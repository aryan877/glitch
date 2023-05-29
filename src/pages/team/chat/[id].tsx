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
import { isNotEmptyObject } from '@chakra-ui/utils';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import { Account, Databases, ID, Permission, Query, Role } from 'appwrite';
import axios from 'axios';
import dayjs from 'dayjs';
import { isEmpty } from 'lodash';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useUser } from '../../../../context/UserContext';
import { client } from '../../../../utils/appwriteConfig';
import withAuth from '../../../../utils/withAuth';
function ChatMessage({
  sender,
  content,
  isReply,
  reference,
  senderName,
  createdAt,
  docId,
}: {
  sender: string;
  content: string;
  isReply?: boolean;
  reference?: string;
  createdAt: string;
  senderName: string;
  docId: string;
}) {
  const { currentUser } = useUser();
  const account = useMemo(() => new Account(client), []);
  const handleDelete = async () => {
    const promise = await account.createJWT();
    await axios.post('/api/deletechat', {
      $id: docId,
      jwt: promise.jwt,
    });
  };

  return (
    <Flex
      direction="column"
      alignItems={sender === currentUser.$id ? 'flex-end' : 'flex-start'}
    >
      <Flex alignItems="center">
        {sender !== currentUser.$id && (
          <Avatar name={sender} size="md" bg="gray.500" color="white" mr={2} />
        )}

        <Box
          maxW="2xl"
          py={4}
          px={4}
          bg={sender === currentUser.$id ? 'teal.100' : 'purple.100'}
          color="white"
          borderRadius="md"
          my={2}
        >
          <Text fontSize="xs" mb={2} color="gray.500">
            {senderName}
          </Text>
          {isReply && (
            <Box
              borderRadius="md"
              p={2}
              bg={sender === currentUser.$id ? 'teal.200' : 'purple.200'}
              mb={2}
              w="full"
              borderLeftColor={
                sender === currentUser.$id ? 'teal.500' : 'purple.500'
              }
              borderLeftWidth={4}
            >
              <Text color="gray.900" ml={1} fontSize="xs">
                {reference}
              </Text>
            </Box>
          )}

          <Text fontSize="md" color="gray.900">
            {content}
          </Text>
          <HStack gap={4} align="center">
            <Text mt={2} color="gray.500" fontSize="xs">
              {dayjs(createdAt).format('hh:mm A')}
            </Text>
            <Menu>
              <MenuButton
                p={2}
                as={IconButton}
                icon={<HiEllipsisHorizontal color="black" size="24px" />}
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
                <MenuItem icon={<BsTrash2 />} onClick={handleDelete}>
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
  const databases = useMemo(() => new Databases(client), []);

  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const [replyReference, setReplyReference] = useState<string | null>(null);
  const account = useMemo(() => new Account(client), []);
  const router = useRouter();
  const { id } = router.query;
  const { data } = useQuery(
    [`teamMessages-${id}`],
    async () => {
      try {
        console.log('ran this');
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID as string,
          [Query.search('team', id as string)]
        );
        return response.documents;
      } catch (error) {
        console.error('Error fetching team messages:', error);
        throw error;
      }
    },
    {
      staleTime: 6000000,
      cacheTime: 6000000,
    }
  );

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat container when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [data]);

  const sendMessage = async () => {
    if (message.trim() !== '') {
      try {
        const docId = uuidv4();
        queryClient.setQueryData([`teamMessages-${id}`], (prevData: any) => {
          const newMessage = {
            sender: currentUser.$id,
            content: message,
            team: id,
            $id: docId,
            sender_name: currentUser.name,
            $createdAt: Date.now(),
          };

          return [...prevData, newMessage];
        });
        const promise = await account.createJWT();
        await axios.post('/api/postchat', {
          jwt: promise.jwt,
          content: message,
          team: id,
          $id: docId,
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  //Subscriptions
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.events.includes(
            `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID}.documents.*.create`
          )
        ) {
          // queryClient.invalidateQueries(['allTeams']);
          if (
            (response.payload as { team?: string; sender?: string })?.team ===
              id &&
            (response.payload as { team?: string; sender?: string })?.sender !==
              currentUser.$id
          ) {
            setMessage('');
            queryClient.setQueryData(
              [`teamMessages-${id}`],
              (prevData: any) => {
                const newMessage = response.payload;
                return [...prevData, newMessage];
              }
            );
          }
        } else if (
          response.events.includes(
            `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID}.documents.*.delete`
          )
        ) {
          if (
            (response.payload as { team?: string; sender?: string })?.team ===
            id
          ) {
            queryClient.setQueryData(
              [`teamMessages-${id}`],
              (prevData: any) => {
                const deletedMessage = response.payload as {
                  $id: string;
                };
                const newData = prevData.filter(
                  (message: any) => message.$id !== deletedMessage.$id
                );
                return [...newData];
              }
            );
          }
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [queryClient, id, currentUser.$id]);

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
          {data &&
            data.map((msg: any) => (
              <ChatMessage
                key={msg.$id}
                docId={msg.$id}
                sender={msg.sender}
                content={msg.content}
                isReply={msg.isReply}
                senderName={msg.sender_name}
                createdAt={msg.$createdAt}
                // reference={
                //   messages.find((m) => m.id === msg.reference)?.content
                // }
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
