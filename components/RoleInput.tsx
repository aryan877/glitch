import { getBadgeColor } from '@/pages/team/[id]';
import {
  Badge,
  Box,
  Button,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { Teams } from 'appwrite';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { IoMdAdd } from 'react-icons/io';
import { MdAdd, MdClose } from 'react-icons/md';
import { Tracing } from 'trace_events';
import { client } from 'utils/appwriteConfig';

interface RoleInputProps {
  memberRoles: string[];
  memberId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

function RoleInput({
  memberRoles,
  memberId,
  isOpen,
  onClose,
  onOpen,
}: RoleInputProps) {
  const [inputValue, setInputValue] = useState('');
  const teamsClient = useMemo(() => new Teams(client), []);
  const queryClient = useQueryClient();

  const [roles, setRoles] = useState<string[]>(memberRoles);
  const router = useRouter();
  const { id } = router.query;

  const handleToggleMenu = () => {
    if (isOpen) {
      onClose();
    } else {
      onOpen();
    }
  };

  const handleMenuItemClick = () => {
    onClose();
    // Perform any desired action on menu item click
  };

  const handleAddRole = () => {
    if (inputValue.trim() !== '') {
      setRoles([...roles, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveRole = (index: number) => {
    setRoles((prevRoles) => prevRoles.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddRole();
    }
  };

  const handleMenuClose = () => {
    setRoles(memberRoles);
    onClose();
  };

  const saveRoles = async () => {
    await teamsClient.updateMembershipRoles(
      id as string,
      memberId as string,
      roles
    );
    setRoles(roles);
    onClose();
    queryClient.refetchQueries([`teamMembers-${id}`]);
  };

  return (
    <Box>
      <Menu isOpen={isOpen} onClose={handleMenuClose}>
        <MenuButton as={Button} onClick={handleToggleMenu}>
          Roles
        </MenuButton>
        <MenuList p={4} border="none">
          <Box mb={2} p={2}>
            {roles.map((role, index) => (
              <Badge
                key={role}
                size="sm"
                mr={2}
                px={2}
                bg={getBadgeColor(role)}
              >
                {role}
                <Button
                  size="sm"
                  ml={2}
                  variant="ghost"
                  onClick={() => handleRemoveRole(index)}
                >
                  <MdClose />
                </Button>
              </Badge>
            ))}
          </Box>
          <Box display="flex" alignItems="center" mb={2}>
            <Input
              placeholder="Enter role"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              marginRight={2}
            />
            <Button size="sm" colorScheme="whatsapp" onClick={handleAddRole}>
              <MdAdd size="24px" />
            </Button>
          </Box>
          <Button onClick={saveRoles} mt={2} colorScheme="whatsapp">
            Apply
          </Button>
        </MenuList>
      </Menu>
    </Box>
  );
}

export default RoleInput;
