import { Link } from '@chakra-ui/next-js';
import { Box, chakra, Flex, HStack, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { DraggableCore } from 'react-draggable';
import { MdSettings } from 'react-icons/md';
import {
  RiChatSmile2Line,
  RiHome2Line,
  RiTaskLine,
  RiVideoLine,
} from 'react-icons/ri';
import { useSidebar } from '../context/SidebarContext';

function Sidebar() {
  const flexRef = useRef<HTMLDivElement>(null); // Create a ref for the Flex container
  const { flexWidth, setFlexWidth } = useSidebar(); // State to store the flex container width
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const router = useRouter();
  const handleDrag = (e: any, data: any) => {
    const newWidth = flexWidth + data.deltaX;
    const minWidth = 200; // Minimum width of the sidebar
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
        ref={flexRef} // Attach the ref to the Flex container
        cursor={isDragging ? 'grabbing' : 'grab'}
      >
        <VStack spacing={8} align="start" w="100%">
          <Link href="/">
            <chakra.span mb={4} fontSize="2xl" fontWeight="bold" color="white">
              Glitch
            </chakra.span>
          </Link>
          <Link
            href="/"
            color={router.pathname === '/' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <RiHome2Line size={24} />
              <chakra.span fontWeight="bold">Home</chakra.span>
            </HStack>
          </Link>
          <Link
            href="/settings"
            color={router.pathname === '/settings' ? 'white' : 'gray.300'}
            _hover={{ color: 'white' }}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <MdSettings size={24} />
              <chakra.span fontWeight="bold">Settings</chakra.span>
            </HStack>
          </Link>
        </VStack>
      </Box>
    </DraggableCore>
  );
}

export default Sidebar;
