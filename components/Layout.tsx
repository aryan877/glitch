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
import TeamSidebar from './TeamSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { flexWidth } = useSidebar();

  //SUSCRIBE TO NEW CHATS BEING ADDED IN DB AND THEN BOOM, ADD NOTIFICATIONS FOR EVERYONE FOR THE TEAM

  //IN DB WE ADD IN NOFIFICAITONS COLLECTION-:
  //MESSAGEID, MESSAGE_SENDER_ID, READ STATUS, READ TIME, READERID ( READ PERMISSIONS FOR THIS DOC IS ONLY
  // THE READERID AND CAN BE READ BY THE MESSAGE_SENDER BY USING API KEY )

  //WE ALSO SUSCRIBE TO THE CHAT NOTIFS, THE MOMENT NEW CHATS ARE THERE, WE GET NOTIFIED ( ONLT THE READER GETS NOTIFIED )
  //WE THEN UPDATE THE DATA IN REALTIME FOR READ FOR THE SENDER, AND FOR THE OTHERS WE NOTIFY THEM

  return (
    <>
      <Navbar flexWidth={flexWidth} />
      {/* Pass the flexWidth prop to the Navbar component */}
      <Flex h="full">
        {router.pathname.startsWith('/team/') ? <TeamSidebar /> : <Sidebar />}
        <Box flex="1" ml={flexWidth} mt={32} mb={16}>
          {/* Add left margin to accommodate the fixed sidebar */}
          {children}
        </Box>
      </Flex>
    </>
  );
};

export default Layout;
