import { Link } from '@chakra-ui/next-js';
import { Box, chakra, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
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

function TeamSidebar() {
  const flexRef = useRef<HTMLDivElement>(null);
  const { flexWidth, setFlexWidth } = useSidebar();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const router = useRouter();
  const { id } = router.query;

  const handleDrag = (e: any, data: any) => {
    const newWidth = flexWidth + data.deltaX;
    const minWidth = 200;
    const limitedWidth = Math.max(minWidth, newWidth);
    setFlexWidth(limitedWidth);
  };

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
              Glitch
            </Text>
          </Link>
          <Link
            href={`/team/${id}`}
            color={router.pathname === '/team/[id]' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsPeopleFill size={24} />
              <chakra.span fontWeight="bold">Team</chakra.span>
            </HStack>
          </Link>
          <Link
            href={`/team/chat/${id}`}
            color={router.pathname === '/team/chat/[id]' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsChatDotsFill size={24} />
              <chakra.span fontWeight="bold">Chat</chakra.span>
            </HStack>
          </Link>
          <Link
            href="/team/tasks"
            color={router.pathname === '/team/tasks' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsCheckSquareFill size={24} />
              <chakra.span fontWeight="bold">Tasks</chakra.span>
            </HStack>
          </Link>
          <Link
            href="/team/video"
            color={router.pathname === '/team/video' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsCameraVideoFill size={24} />
              <chakra.span fontWeight="bold">Video Call</chakra.span>
            </HStack>
          </Link>
          <Link
            href="/search"
            color={router.pathname === '/search' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsSearch size={24} />
              <chakra.span fontWeight="bold">Search</chakra.span>
            </HStack>
          </Link>
          <Link
            href="/settings"
            color={router.pathname === '/settings' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <BsGearFill size={24} />
              <chakra.span fontWeight="bold">Settings</chakra.span>
            </HStack>
          </Link>
        </VStack>
      </Box>
    </DraggableCore>
  );
}

export default TeamSidebar;
