import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import {
  BsArrowLeftShort,
  BsReply,
  BsSend,
  BsThreeDots,
  BsTrash2,
} from 'react-icons/bs';
import { FaEllipsisH } from 'react-icons/fa';
import { FiEdit, FiPaperclip } from 'react-icons/fi';
import { HiEllipsisHorizontal } from 'react-icons/hi2';
import { MdSend } from 'react-icons/md';
import Layout from '../../../../components/Layout';
import { useSidebar } from '../../../../context/SidebarContext';
import withAuth from '../../../../utils/withAuth';

function ChatMessage({
  sender,
  content,
  isReply,
  reference,
}: {
  sender: any;
  content: any;
  isReply?: boolean;
  reference?: any;
}) {
  return (
    <Flex
      direction="column"
      alignItems={sender === 'me' ? 'flex-end' : 'flex-start'}
    >
      <Flex alignItems="center">
        {sender !== 'me' && (
          <Avatar name={sender} size="sm" bg="teal.500" color="white" mr={2} />
        )}

        <Box
          maxW="2xl"
          py={4}
          px={4}
          bg={sender === 'me' ? 'teal.400' : 'purple.400'}
          color="white"
          borderRadius="md"
          my={2}
        >
          <Text fontSize="md" mb={2} color="gray.100">
            {sender}
          </Text>
          {isReply && (
            <Box
              borderRadius="md"
              p={2}
              bg={sender === 'me' ? 'green.200' : 'purple.200'}
              mb={2}
              w="full"
            >
              <Text color="gray.900" ml={1} fontSize="sm">
                {reference}
              </Text>
            </Box>
          )}

          <Text>{content}</Text>
          <HStack gap={4} align="center">
            <Text mt={2} color="gray.100" fontSize="xs">
              06:24 AM
            </Text>
            <Menu>
              <MenuButton
                p={2}
                as={IconButton}
                icon={<HiEllipsisHorizontal size="24px" />}
                bg="transparent"
                size="sm"
                variant="unstyled"
                aria-label="Message Options"
              />
              <MenuList border="none">
                <MenuItem
                  icon={<BsReply />}
                  onClick={() => console.log('Reply')}
                >
                  Reply
                </MenuItem>
                <MenuItem icon={<FiEdit />} onClick={() => console.log('Edit')}>
                  Edit
                </MenuItem>
                <MenuItem
                  icon={<BsTrash2 />}
                  onClick={() => console.log('Delete')}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Box>
      </Flex>
    </Flex>
  );
}

function TeamChat() {
  const { flexWidth, setFlexWidth } = useSidebar();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'me', content: 'Hello!' },
    { id: 2, sender: 'John', content: 'Hi there!' },
    { id: 3, sender: 'me', content: 'How are you?' },
    { id: 4, sender: 'John', content: "I'm good, thanks!" },
    // Additional messages
    { id: 5, sender: 'Jane', content: 'Hey everyone!' },
    {
      id: 6,
      sender: 'Sam',
      content: 'Nice to see you all. How was your day?',
      isReply: true,
      reference: 4, // Reference to the message with id 4
    },
    {
      id: 7,
      sender: 'John',
      content: 'It was great! I had a productive day at work.',
      isReply: true,
      reference: 3, // Reference to the message with id 3
    },
    {
      id: 8,
      sender: 'Jane',
      content: "I'm glad to hear that. Mine was busy but good.",
    },
    {
      id: 9,
      sender: 'Sam',
      content:
        'That sounds great. Let me share some updates...That sounds great. Let me share some updates...That sounds great. Let me share some updates...That sounds great. Let me share some updates...',
      isReply: true,
      reference: 7, // Reference to the message with id 7
    },
    {
      id: 10,
      sender: 'me',
      content: 'Sure, go ahead!',
      isReply: true,
      reference: 9, // Reference to the message with id 9
    },
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat container when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (message.trim() !== '') {
      const newMessage = {
        id: messages.length + 1,
        sender: 'me',
        content: message,
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  return (
    <Layout>
      <Box
        pos="fixed"
        left={flexWidth}
        right="0"
        bottom="0"
        top="0"
        bg="red"
        my={16}
        mb={20}
        // mb={-16}
        // mt={-16}
        // h="calc(100% - 100px)"
        display="flex"
        flexDirection="column"
      >
        <Box
          bg="gray.700"
          overflowY="scroll"
          flex="1"
          p={4}
          ref={chatContainerRef}
        >
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.sender}
              content={msg.content}
              isReply={msg.isReply}
              reference={messages.find((m) => m.id === msg.reference)?.content}
            />
          ))}
        </Box>
        <Box
          p={4}
          bg="gray.700"
          borderTopWidth="1px"
          position="fixed"
          bottom="0"
          left={flexWidth}
          right="0"
          h={20}
        >
          <Flex align="center">
            <IconButton
              icon={<FiPaperclip size="24px" color="white" />}
              bg="transparent"
              fontSize="20px"
              aria-label="Attach File"
              mr={2}
            />
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              bg="white"
              borderRadius="full"
              flex={1}
              color="gray.900"
              mr={2}
            />
            <IconButton
              icon={<BsSend size="24px" />}
              colorScheme="teal"
              borderRadius="full"
              aria-label="Send Message"
              onClick={sendMessage}
            />
          </Flex>
        </Box>
      </Box>
    </Layout>
  );
}

export default withAuth(TeamChat);
