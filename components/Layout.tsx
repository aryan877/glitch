import { Link } from '@chakra-ui/next-js';
import { Box, chakra, HStack, VStack } from '@chakra-ui/react';

import {
  RiChatSmile2Line,
  RiHome2Line,
  RiTaskLine,
  RiVideoLine,
} from 'react-icons/ri';
interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return (
    <Box display="flex">
      <Box bg="gray.900" p={8} pr={16} pos="fixed" h="100vh">
        <VStack spacing={8} align="start" w="100%">
          <chakra.span mb={4} fontSize="2xl" fontWeight="bold" color="white">
            TStream
          </chakra.span>
          <Link href="/" color="gray.300" _hover={{ color: 'white' }}>
            <HStack spacing={4} alignItems="center" w="100%">
              <RiVideoLine size={24} />
              <chakra.span fontWeight="bold">Video</chakra.span>
            </HStack>
          </Link>
          <Link href="/" color="gray.300" _hover={{ color: 'white' }}>
            <HStack spacing={4} alignItems="center" w="100%">
              <RiChatSmile2Line size={24} />
              <chakra.span fontWeight="bold">Chat</chakra.span>
            </HStack>
          </Link>
          <Link href="/" color="gray.300" _hover={{ color: 'white' }}>
            <HStack spacing={4} alignItems="center" w="100%">
              <RiTaskLine size={24} />
              <chakra.span fontWeight="bold">Tasks</chakra.span>
            </HStack>
          </Link>
          {/* Add more HStacks as needed */}
        </VStack>
      </Box>
      <Box flex="1">{children}</Box>
    </Box>
  );
};

export default Sidebar;
