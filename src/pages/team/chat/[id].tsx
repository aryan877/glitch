import {
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  VStack
} from '@chakra-ui/react';
import { isNotEmptyObject } from '@chakra-ui/utils';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { Account, Databases, ID, Permission, Query, Role } from 'appwrite';
import axios from 'axios';
import dayjs from 'dayjs';
import { isEmpty } from 'lodash';
import { useRouter } from 'next/router';
import { createRef, useEffect, useMemo, useRef, useState } from 'react';
import {
  BsArrowLeftShort,
  BsCheck2,
  BsCheck2All,
  BsReply,
  BsSend,
  BsThreeDots,
  BsTrash2
} from 'react-icons/bs';
import { FaCheck, FaCheckDouble, FaEllipsisH, FaXing } from 'react-icons/fa';
import { FiEdit, FiPaperclip } from 'react-icons/fi';
import { HiEllipsisHorizontal } from 'react-icons/hi2';
import { MdClose, MdSend } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../../../../components/Layout';
import { useSidebar } from '../../../../context/SidebarContext';
import { useUser } from '../../../../context/UserContext';
import { client } from '../../../../utils/appwriteConfig';
import withAuth from '../../../../utils/withAuth';
function ChatMessage({
  sender,
  content,
  senderName,
  createdAt,
  docId,
  reference,
  referenceContent,
  referenceUser,
  setMessageId,
  setMessageContent,
  inputRef,
  setMessage,
  setMode,
  setMessageUser,
  edited,
  referenceToScroll,
  handleOriginalMessageClick,
  originalMessageRef,
  marginY,
  display,
  delivered,
}: {
  sender: string;
  content: string;
  reference: string;
  referenceContent: string;
  createdAt: string;
  senderName: string | null;
  docId: string;
  referenceUser: string;
  edited: boolean;
  setMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  setMessageContent: React.Dispatch<React.SetStateAction<string | null>>;
  setMessageUser: React.Dispatch<React.SetStateAction<string | null>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  inputRef: any;
  setMode: React.Dispatch<React.SetStateAction<'EDIT' | 'REPLY' | null>>;
  referenceToScroll: string | null;
  handleOriginalMessageClick: any;
  originalMessageRef: any;
  marginY: number;
  display: boolean;
  delivered: boolean | null;
}) {
  const { currentUser } = useUser();
  const account = useMemo(() => new Account(client), []);
  const databases = useMemo(() => new Databases(client), []);
  const handleDelete = async () => {
    const promise = await account.createJWT();
    await axios.post('/api/deletechat', {
      $id: docId,
      jwt: promise.jwt,
    });
  };
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading, isError } = useQuery(
    [`messageReaders-${docId}`],
    async () => {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_CHATS_NOTIFICATION_COLLECTION_ID as string,
        [Query.equal('isRead', true), Query.equal('messageId', docId)]
      );
      // Extract reader names from the response
      const readers = response.documents
        .filter((document: any) => document.readerId !== currentUser.$id)
        .map((document: any) => ({
          readerId: document.readerId,
          readerName: document.readerName,
          readTime: document.readTime,
        }));
      return readers;
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
    }
  );

  return (
    <Flex
      ref={originalMessageRef}
      direction="column"
      bg={docId === referenceToScroll ? 'gray.400' : ''}
      px={4}
      mt={marginY}
      alignItems={sender === currentUser?.$id ? 'flex-start' : 'flex-start'}
    >
      <Flex
        alignItems="center"
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
      >
        {
          <Avatar
            name={senderName as string}
            size="md"
            w="12"
            bg="gray.500"
            color="white"
            mr={2}
          />
        }
        {
          <Box
            maxW="2xl"
            py={2}
            px={4}
            bg={sender === currentUser?.$id ? 'teal.100' : 'purple.100'}
            color="white"
            borderRadius="md"
          >
            {display && (
              <Text
                fontSize="sm"
                mb={2}
                textTransform="uppercase"
                color="gray.500"
                fontWeight="bold"
              >
                {senderName}
              </Text>
            )}
            {reference && (
              <Box
                onClick={() => handleOriginalMessageClick(reference)}
                borderRadius="md"
                p={2}
                bg={sender === currentUser?.$id ? 'teal.200' : 'purple.200'}
                mb={2}
                w="full"
                borderLeftColor={
                  sender === currentUser.$id ? 'teal.500' : 'purple.500'
                }
                cursor="pointer"
                borderLeftWidth={4}
              >
                <Text
                  color={sender === currentUser.$id ? 'teal.700' : 'purple.700'}
                  ml={1}
                  textTransform="uppercase"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  {referenceUser}
                </Text>
                <Text
                  color={sender === currentUser.$id ? 'teal.700' : 'purple.700'}
                  ml={1}
                  fontSize="md"
                >
                  {referenceContent}
                </Text>
              </Box>
            )}

            <Text fontSize="md" color="gray.900">
              {content}
            </Text>
            <HStack
              // gap={4}
              // bg="red"
              mt={2}
              // align="flex-end"
              justifyContent="space-between"
            >
              {/* <Spacer /> */}
              <Text fontWeight="bold" color="gray.500" fontSize="xs">
                {dayjs(createdAt).format('hh:mm A')}{' '}
                {edited && <span>edited</span>}
              </Text>

              <Menu
                isOpen={isOpen}
                onClose={() => {
                  setIsOpen(false);
                }}
              >
                <MenuButton
                  // p={2}
                  // icon={<HiEllipsisHorizontal color="black" size="24px" />}
                  bg="transparent"
                  aria-label="Message Options"
                />
                <MenuList border="none">
                  <MenuItem
                    icon={<BsReply />}
                    onClick={() => {
                      setMessageId(docId);
                      setMessageContent(content);
                      setMessageUser(senderName);
                      setMode('REPLY');
                      inputRef.current.focus();
                    }}
                  >
                    Reply
                  </MenuItem>
                  {sender === currentUser.$id && (
                    <MenuItem
                      icon={<FiEdit />}
                      onClick={() => {
                        setMessageId(docId);
                        setMessageContent(content);
                        setMode('EDIT');
                        setMessage(content);
                        inputRef.current.focus();
                      }}
                    >
                      Edit
                    </MenuItem>
                  )}
                  {sender === currentUser.$id && (
                    <MenuItem icon={<BsTrash2 />} onClick={handleDelete}>
                      Delete
                    </MenuItem>
                  )}

                  {data?.map((reader: any) => (
                    <MenuItem key={reader.$id}>
                      <Text mr={2}>{reader.readerName}</Text>
                      Read at {dayjs(reader.readTime).format('HH:mm')}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </HStack>

            {delivered && (
              <Flex py={1} color="gray.400">
                <Spacer />
                {data && data.length > 0 ? (
                  <BsCheck2All size="24" />
                ) : (
                  <BsCheck2 size="24" />
                )}
              </Flex>
            )}
          </Box>
        }
      </Flex>
    </Flex>
  );
}

function TeamChat() {
  const { flexWidth, setFlexWidth } = useSidebar();
  const [message, setMessage] = useState('');
  const databases = useMemo(() => new Databases(client), []);
  const [mode, setMode] = useState<'EDIT' | 'REPLY' | null>(null);
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const [messageId, setMessageId] = useState<string | null>(null);
  const [referenceToScroll, setReferenceToScroll] = useState<string | null>(
    null
  );
  const [messageContent, setMessageContent] = useState<string | null>(null);
  const [messageUser, setMessageUser] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const account = useMemo(() => new Account(client), []);
  const router = useRouter();
  const { id } = router.query;

  //here we implement infinite query and we move up and load previous messages not the next ones,
  // we start with the latest and go back
  const { data } = useQuery(
    [`teamMessages-${id}`],
    async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID as string,
          [
            Query.equal('team', [id as string]),
            Query.limit(8),
            Query.orderDesc('$createdAt'),
          ]
        );

        const sortedDocuments = response.documents.sort((a, b) => {
          const dateA = new Date(a.$createdAt);
          const dateB = new Date(b.$createdAt);
          return dateA.getTime() - dateB.getTime();
        });

        const updatedDocuments = sortedDocuments.map((document) => {
          if (document.sender === currentUser.$id) {
            return { ...document, delivered: true };
          }
          return document;
        });

        return updatedDocuments;
      } catch (error) {
        console.error('Error fetching team messages:', error);
        throw error;
      }
    },
    {
      staleTime: 0,
      cacheTime: 0,
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

  const handleKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (message.trim() !== '') {
      try {
        message.trim();
        setMessage('');
        if (mode === 'REPLY' || mode === 'EDIT') {
          setMessageContent('');
          setMode(null);
        }

        const docId = uuidv4();

        if (mode === 'EDIT') {
          //find id with messageId
          const queryData = (prevData: any) => {
            const messageIndex = prevData.findIndex(
              (message: any) => message.$id === messageId
            );
            if (messageIndex !== -1) {
              prevData[messageIndex].content = message;
              prevData[messageIndex].edited = true;
            }

            return prevData;
          };

          queryClient.setQueryData([`teamMessages-${id}`], queryData);

          const promise = await account.createJWT();
          await axios.post('/api/editchat', {
            jwt: promise.jwt,
            content: message,
            $id: messageId,
          });

          return;
        }
        // edit flow ends here
        // normal message and reply flow
        const queryData = (prevData: any) => {
          const newMessage = {
            sender: currentUser.$id,
            content: message,
            team: id,
            $id: docId,
            sender_name: currentUser.name,
            $createdAt: Date.now(),
            ...(mode === 'REPLY' && {
              reference: messageId,
              referenceContent: messageContent,
              referenceUser: messageUser,
            }),
            edited: false,
            delivered: false,
          };
          return [...prevData, newMessage];
        };

        queryClient.setQueryData([`teamMessages-${id}`], queryData);

        const promise = await account.createJWT();
        await axios.post('/api/postchat', {
          jwt: promise.jwt,
          content: message,
          team: id,
          $id: docId,
          ...(mode === 'REPLY' && {
            reference: messageId,
            referenceContent: messageContent,
            referenceUser: messageUser,
          }),
        });

        // Mark the message as delivered
        queryClient.setQueryData([`teamMessages-${id}`], (prevData: any) => {
          const updatedData = prevData.map((msg: any) => {
            if (msg.$id === docId && msg.sender === currentUser.$id) {
              return {
                ...msg,
                delivered: true,
              };
            }
            return msg;
          });
          return updatedData;
        });
        //here we set that as delivered
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
              currentUser?.$id
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
  }, [queryClient, id, currentUser]);

  const componentRefs =
    data?.reduce(
      (acc: { [key: string]: React.RefObject<HTMLDivElement> }, item) => {
        const id = item.$id;
        acc[id] = createRef();
        return acc;
      },
      {}
    ) || {};

  const handleOriginalMessageClick = (id: string) => {
    if (data) {
      setReferenceToScroll(id);
      setTimeout(() => {
        setReferenceToScroll(null);
      }, 2000);
      const referencedElement = data.find((item) => item.$id === id);
      if (referencedElement && componentRefs[id]?.current !== null) {
        const targetElement = componentRefs[id]?.current;
        if (targetElement instanceof HTMLElement) {
          targetElement.scrollIntoView({ behavior: 'auto' });
        }
      }
    }
  };

  useEffect(() => {
    const markNotificationsAsRead = async () => {
      try {
        if (!data) {
          return;
        }
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_CHATS_NOTIFICATION_COLLECTION_ID as string,
          [
            Query.equal('teamId', id as string),
            Query.equal('readerId', currentUser.$id),
            Query.equal('isRead', false),
          ]
        );

        for (const document of response.documents) {
          try {
            console.log('updating22');
            await databases.updateDocument(
              process.env.NEXT_PUBLIC_DATABASE_ID as string,
              process.env
                .NEXT_PUBLIC_CHATS_NOTIFICATION_COLLECTION_ID as string,
              document.$id,
              { isRead: true, readTime: new Date().toISOString() }
            );
          } catch (error) {
            console.error('Failed to update notification:', error);
          }
        }
        queryClient.refetchQueries({ queryKey: ['unreadChats'] });
        // TODO: Mark notifications as read
      } catch (error) {
        console.error('Error fetching team messages:', error);
        throw error;
      }
    };

    markNotificationsAsRead();
  }, [databases, currentUser.$id, id, data, queryClient]);

  const { data: teamPreference = { bg: '', description: '', name: '' } } =
    useQuery(
      [`teamPreferences-${id}`],
      async () => {
        try {
          const response = await databases.getDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID as string,
            process.env.NEXT_PUBLIC_TEAMS_COLLECTION_ID as string,
            id as string
          );
          return response;
        } catch (error) {
          console.error('Error fetching team preferences:', error);
          throw error;
        }
      },
      {
        staleTime: 3600000,
        cacheTime: 3600000,
      }
    );

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHATS_NOTIFICATION_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.events.includes(
            `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHATS_NOTIFICATION_COLLECTION_ID}.documents.*.update`
          )
        ) {
          console.log(response);
          if (
            (
              response.payload as {
                isRead: boolean;
                readerId: string;
                messageId: string;
                sender: string;
              }
            )?.sender === currentUser.$id
          ) {
            const updatedMessage = response.payload as {
              isRead: boolean;
              readerId: string;
              messageId: string;
            };
            queryClient.setQueryData(
              [`messageReaders-${updatedMessage.messageId}`],
              (prevData: any) => {
                const existingIndex = prevData.findIndex(
                  (item: any) =>
                    item.messageId === updatedMessage.messageId &&
                    item.readerId === updatedMessage.readerId
                );
                if (existingIndex !== -1) {
                  prevData[existingIndex] = updatedMessage;
                  return [...prevData];
                } else {
                  return [...prevData, updatedMessage];
                }
              }
            );
          }
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [currentUser.$id, queryClient]);

  return (
    <Layout>
      <Box
        pos="fixed"
        left={flexWidth}
        right="0"
        bottom="0"
        top="0"
        my={16}
        mb={20}
        // mb={-16}
        // mt={-16}
        // h="calc(100% - 100px)"
        display="flex"
        flexDirection="column"
      >
        <Box
          overflowY="scroll"
          flex="1"
          bgGradient={`linear(to top, gray.700 99%, ${teamPreference.bg})`}
          py={4}
          ref={chatContainerRef}
        >
          {data &&
            data.map((msg: any, index: number) => {
              const previousMsg = index > 0 ? data[index - 1] : data[index];
              const isSameSender =
                previousMsg && previousMsg.sender === msg.sender;

              return (
                <ChatMessage
                  key={msg.$id}
                  docId={msg.$id}
                  sender={msg.sender}
                  content={msg.content}
                  senderName={msg.sender_name}
                  display={isSameSender && index !== 0 ? false : true}
                  createdAt={msg.$createdAt}
                  reference={msg.reference}
                  referenceContent={msg.referenceContent}
                  setMessageContent={setMessageContent}
                  setMessageUser={setMessageUser}
                  setMessageId={setMessageId}
                  inputRef={inputRef}
                  setMode={setMode}
                  setMessage={setMessage}
                  referenceUser={msg.referenceUser}
                  edited={msg.edited}
                  referenceToScroll={referenceToScroll}
                  handleOriginalMessageClick={handleOriginalMessageClick}
                  originalMessageRef={componentRefs[msg.$id]}
                  marginY={isSameSender && index !== 0 ? 1 : 8}
                  delivered={msg.delivered}
                />
              );
            })}
        </Box>
        {messageContent && mode === 'REPLY' && (
          <Flex
            justifyContent="space-between"
            p={2}
            px={4}
            bg="gray.500"
            position="fixed"
            bottom="20"
            left={flexWidth}
            align="center"
            right="0"
          >
            <Flex direction="column">
              <Text color="gray.200">{messageUser}</Text>
              <Text>{messageContent}</Text>
            </Flex>
            <Button
              borderRadius="full"
              onClick={() => {
                setMessageContent('');
                setMessageId('');
                setMode(null);
              }}
              leftIcon={<MdClose />}
            >
              Clear
            </Button>
          </Flex>
        )}
        {messageContent && mode === 'EDIT' && (
          <Flex
            justifyContent="space-between"
            p={4}
            bg="gray.500"
            position="fixed"
            bottom="20"
            left={flexWidth}
            align="center"
            right="0"
          >
            {`Editing : ${messageContent}`}
            <Button
              borderRadius="full"
              onClick={() => {
                setMessageContent('');
                setMessageId('');
                setMode(null);
                setMessage('');
              }}
              leftIcon={<MdClose />}
            >
              Clear
            </Button>
          </Flex>
        )}
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
              onClick={() => {}}
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
              ref={inputRef}
              onKeyDown={handleKeyDown}
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
