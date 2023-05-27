import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { Account } from 'appwrite';
import { useRouter } from 'next/router';
import { useContext, useMemo } from 'react';
import { FaBell } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { UserContext } from '../context/UserContext';
import { client } from '../utils/appwriteConfig';

import { useUser } from '../context/UserContext';

const Navbar = ({ flexWidth }: { flexWidth: number }) => {
  const { currentUser, loading, setCurrentUser } = useUser();
  const router = useRouter();

  const darkButtonRoutes = useMemo(
    () => ['/team/[id]', '/profile/[id]', '/profile/edit/[id]'],
    []
  );

  const isDarkButtonRoute = useMemo(() => {
    return darkButtonRoutes.some((route) => router.pathname.startsWith(route));
  }, [darkButtonRoutes, router.pathname]);

  const handleLogOut = () => {
    const account = new Account(client);
    const promise = account.deleteSession('current');
    promise.then(
      function (response) {
        setCurrentUser(undefined);
      },
      function (error) {
        console.log(error);
      }
    );
  };

  const goBack = () => {
    router.back();
  };

  return (
    <Flex
      justifyContent="space-between"
      pr={4}
      align="center"
      bg={isDarkButtonRoute ? 'transparent' : 'gray.800'}
      color="white"
      h="16"
      w={`calc(100% - ${flexWidth}px)`}
      right="0"
      zIndex="9999999"
      pos="fixed"
    >
      {router.pathname !== '/' && (
        <Tooltip label="Go Back" color="white">
          <IconButton
            ml={8}
            aria-label="Go Back"
            icon={<FiArrowLeft />}
            onClick={goBack}
            bg="gray.800"
            _hover={{ bg: 'gray.700' }}
            _active={{ bg: 'gray.700' }}
            borderRadius="full"
            color="white"
          />
        </Tooltip>
      )}
      {!isDarkButtonRoute && <Spacer />}
      <HStack gap={4}>
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="notifications"
            icon={
              <Flex position="relative">
                <FaBell size="24px" />
                {21 > 0 && (
                  <Box
                    position="absolute"
                    top="0px"
                    right="-4px"
                    px={2}
                    py={1}
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                    transform="translate(50%, -50%)"
                  >
                    2
                  </Box>
                )}
              </Flex>
            }
            bg="gray.800"
            _hover={{ bg: 'gray.700' }}
            _active={{ bg: 'gray.700' }}
            variant="outline"
            border="none"
            size="md"
            borderRadius="full"
          />
          <MenuList p={2} border="none" borderRadius="md">
            <MenuItem borderRadius="md">Av joined Team Blockwave</MenuItem>
            <MenuItem borderRadius="md">
              John completed his assigned task in Blockwave
            </MenuItem>
            <MenuItem borderRadius="md">A task was assigned to you</MenuItem>
          </MenuList>
        </Menu>
        <Menu>
          <MenuButton
            as={Button}
            borderRadius="full"
            bg={!isDarkButtonRoute ? 'transparent' : 'gray.800'}
            variant="styled"
            colorScheme="gray"
          >
            <HStack gap={2}>
              <Avatar name="aryan" size="sm" />
              <Text ml={4} fontWeight="bold" color="white">
                {currentUser?.name}
              </Text>
            </HStack>
          </MenuButton>
          <MenuList p={2} border="none" borderRadius="md">
            <MenuItem borderRadius="md">Profile</MenuItem>
            <MenuItem onClick={handleLogOut} borderRadius="md">
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

export default Navbar;
