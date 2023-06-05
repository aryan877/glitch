import { Link } from '@chakra-ui/next-js';
import {
  Box,
  chakra,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Teams } from 'appwrite';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DraggableCore } from 'react-draggable';
import { AiFillHome } from 'react-icons/ai';
import {
  BsCameraVideoFill,
  BsChatDotsFill,
  BsCheckSquareFill,
  BsGearFill,
  BsPeopleFill,
  BsSearch,
} from 'react-icons/bs';
import { useSidebar } from '../context/SidebarContext';
import { client } from '../utils/appwriteConfig';

function TeamSidebar() {
  const flexRef = useRef<HTMLDivElement>(null);
  const { flexWidth, setFlexWidth } = useSidebar();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();

  const handleDrag = (e: any, data: any) => {
    const newWidth = flexWidth + data.deltaX;
    const minWidth = 100;
    const limitedWidth = Math.max(minWidth, newWidth);
    setFlexWidth(limitedWidth);
  };

  const teamsClient = useMemo(() => new Teams(client), []);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (flexRef.current) {
      const { width } = flexRef.current.getBoundingClientRect();
      setFlexWidth(width);
    }
  }, [setFlexWidth]);

  const {
    data: teamMembersData,
    isLoading: teamMembersLoading,
    isError: teamMembersError,
    isSuccess: teamMembersSuccess,
  } = useQuery(
    [`teamMembers-${id}`],
    async () => {
      const response = await teamsClient.listMemberships(id as string);
      return response.memberships;
    },
    { staleTime: 3600000, cacheTime: 3600000 }
  );

  const shouldHideIcons = flexWidth < 200;

  return (
    <DraggableCore
      onDrag={handleDrag}
      onStart={handleDragStart}
      onStop={handleDragStop}
    >
      <Box
        bg="black"
        p={8}
        zIndex="99999999"
        pos="fixed"
        as="nav"
        h="full"
        w={flexWidth}
        ref={flexRef}
        cursor={isDragging ? 'grabbing' : 'grab'}
      >
        <VStack spacing={8} align="start" w="100%">
          <Link mb={4} href="/">
            <Text fontSize="2xl" fontWeight="bold" color="white">
              <Image src="/logo.png" alt="logo" />
            </Text>
          </Link>
          <Link
            href={`/team/${id}`}
            color={router.pathname === '/team/[id]' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsPeopleFill size={24} />
              <chakra.span
                display={shouldHideIcons ? 'none' : 'flex'}
                fontWeight="bold"
              >
                Team
              </chakra.span>
            </HStack>
          </Link>
          <Link
            href={`/team/chat/${id}`}
            color={router.pathname === '/team/chat/[id]' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsChatDotsFill size={24} />
              <chakra.span
                display={shouldHideIcons ? 'none' : 'flex'}
                fontWeight="bold"
              >
                Chat
              </chakra.span>
            </HStack>
          </Link>
          <Link
            href={`/team/tasks/${id}`}
            color={
              router.pathname === '/team/tasks/[id]' ? 'white' : 'gray.300'
            }
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsCheckSquareFill size={24} />
              <chakra.span
                display={shouldHideIcons ? 'none' : 'flex'}
                fontWeight="bold"
              >
                Tasks
              </chakra.span>
            </HStack>
          </Link>
          <Link
            href={`/team/video/${id}`}
            color={
              router.pathname === '/team/video/[id]' ? 'white' : 'gray.300'
            }
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsCameraVideoFill size={24} />
              <chakra.span
                display={shouldHideIcons ? 'none' : 'flex'}
                fontWeight="bold"
              >
                Video Call
              </chakra.span>
            </HStack>
          </Link>
          <Link
            href={`/team/user_search/${id}`}
            color={
              router.pathname === '/team/user_search/[id]'
                ? 'white'
                : 'gray.300'
            }
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsSearch size={24} />
              <chakra.span
                display={shouldHideIcons ? 'none' : 'flex'}
                fontWeight="bold"
              >
                Search
              </chakra.span>
            </HStack>
          </Link>
          <Link
            href="/settings"
            color={router.pathname === '/settings' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsGearFill size={24} />
              <chakra.span
                fontWeight="bold"
                display={shouldHideIcons ? 'none' : 'flex'}
              >
                Settings
              </chakra.span>
            </HStack>
          </Link>
        </VStack>
      </Box>
    </DraggableCore>
  );
}

export default TeamSidebar;
