import { Link } from '@chakra-ui/next-js';
import { Box, chakra, Flex, HStack, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { DraggableCore } from 'react-draggable';
import {
  RiChatSmile2Line,
  RiHome2Line,
  RiTaskLine,
  RiVideoLine,
} from 'react-icons/ri';
import { useSidebar } from '../context/SidebarContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { flexWidth } = useSidebar();

  return (
    <>
      <Navbar flexWidth={flexWidth} />
      {/* Pass the flexWidth prop to the Navbar component */}
      <Flex h="full">
        <Sidebar />
        <Box flex="1" ml={flexWidth} mt={32} mb={16}>
          {/* Add left margin to accommodate the fixed sidebar */}
          {children}
        </Box>
      </Flex>
    </>
  );
};

export default Layout;
