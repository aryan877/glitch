import {
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  Textarea,
  TextareaProps,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { isNotEmptyObject } from '@chakra-ui/utils';
import useKeepScrollPosition from '../../../../components/hooks/useKeepScrollPosition';

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Account,
  Avatars,
  Databases,
  ID,
  Permission,
  Query,
  Role,
  Storage,
  Teams,
} from 'appwrite';
import axios from 'axios';
import dayjs from 'dayjs';
import { isEmpty, random } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  BsArrowDown,
  BsArrowLeftShort,
  BsCheck2,
  BsCheck2All,
  BsReply,
  BsSend,
  BsThreeDots,
  BsTrash2,
} from 'react-icons/bs';
import { FaCheck, FaCheckDouble, FaEllipsisH, FaXing } from 'react-icons/fa';
import { FiEdit, FiPaperclip } from 'react-icons/fi';
import { HiEllipsisHorizontal } from 'react-icons/hi2';
import { MdClose, MdSend } from 'react-icons/md';
import { useInView } from 'react-intersection-observer';
import ResizeTextarea from 'react-textarea-autosize';
import tinycolor from 'tinycolor2';
import { v4 as uuidv4 } from 'uuid';
import ChatFileSender from '../../../../components/ChatFileSender';
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
  fileId,
  profileImage,
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
  fileId: string;
  delivered: boolean | null;
  profileImage: string | undefined;
}) {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useUser();
  const account = useMemo(() => new Account(client), []);
  const databases = useMemo(() => new Databases(client), []);
  const storage = useMemo(() => new Storage(client), []);

  const handleDelete = async (): Promise<void> => {
    const promise = await account.createJWT();
    const postData: { $id: string; jwt: string; file?: string } = {
      $id: docId,
      jwt: promise.jwt,
    };

    if (fileId) {
      postData.file = fileId;
    }

    try {
      await axios.post('/api/deletechat', postData);
    } catch (error) {
      // Handle the error
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  const {
    data: result = { previewUrl: '', name: '' },
    isLoading: resultLoading,
    isError: resultError,
  } = useQuery(
    [`chatFile-${docId}`],
    async () => {
      try {
        const promise = await storage.getFile(
          process.env.NEXT_PUBLIC_CHATS_FILES_BUCKET_ID as string,
          fileId
        );
        // const timestamp = Date.now(); // Get the current timestamp
        const previewUrl = storage.getFilePreview(
          process.env.NEXT_PUBLIC_CHATS_FILES_BUCKET_ID as string,
          fileId
        );
        return {
          previewUrl: `${previewUrl.toString()}`,
          name: promise.name,
        };
      } catch (error) {
        return { previewUrl: '', name: '' };
      }
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
      enabled: !isEmpty(fileId),
    }
  );

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
      // staleTime: 3600000,
      // cacheTime: 3600000,
    }
  );

  const downloadFileHandler = () => {
    const result = storage.getFileDownload(
      process.env.NEXT_PUBLIC_CHATS_FILES_BUCKET_ID as string,
      fileId as string
    );
    const link = document.createElement('a');
    link.href = result.href;
    link.download = 'filename'; // Set the desired filename here
    link.click();
  };
  return (
    <Flex
      ref={originalMessageRef}
      direction="column"
      bg={docId === referenceToScroll ? 'gray.400' : ''}
      px={4}
      mt={marginY}
      alignItems={sender === currentUser?.$id ? 'flex-end' : 'flex-start'}
    >
      <Flex
        alignItems="center"
        flexDirection={sender === currentUser?.$id ? 'row-reverse' : 'row'}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
      >
        {
          <Link href={`/profile/${sender}}`}>
            <Avatar
              name={senderName as string}
              size="md"
              src={profileImage}
              w="12"
              bg="gray.500"
              color="white"
              mr={sender !== currentUser?.$id ? 2 : 0}
              ml={sender === currentUser?.$id ? 2 : 0}
            />
          </Link>
        }
        {
          <Box
            maxW="xl"
            py={2}
            px={4}
            bg={sender === currentUser?.$id ? 'teal.100' : 'white'}
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
                bg={sender === currentUser?.$id ? 'teal.200' : 'gray.100'}
                mb={2}
                w="full"
                borderLeftColor={
                  sender === currentUser.$id ? 'teal.500' : 'gray.300'
                }
                cursor="pointer"
                borderLeftWidth={4}
              >
                <Text
                  color={sender === currentUser.$id ? 'teal.700' : 'gray.700'}
                  ml={1}
                  textTransform="uppercase"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  {referenceUser}
                </Text>
                <Text
                  color={sender === currentUser.$id ? 'teal.700' : 'gray.700'}
                  ml={1}
                  fontSize="md"
                >
                  {referenceContent.replaceAll('<br>', ' ')}
                </Text>
              </Box>
            )}

            <Text
              fontSize="md"
              color="gray.900"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {fileId && (
              <Image
                src={result.previewUrl}
                alt="file preview"
                w={
                  result.name.endsWith('.jpg') ||
                  result.name.endsWith('.jpeg') ||
                  result.name.endsWith('.png')
                    ? 'auto'
                    : '200px'
                }
              />
            )}
            {fileId && (
              <Flex alignItems="center" justifyContent="space-between">
                <Text mt={2} color="gray.900">
                  {result.name.length > 10
                    ? result.name.replace(/^(.{7}).+?(\.[^.]+)$/, '$1...$2')
                    : result.name}
                </Text>
                <Tooltip color="white" label="Download File" placement="top">
                  <Button
                    onClick={downloadFileHandler}
                    variant="unstyled"
                    aria-label="download file"
                  >
                    <BsArrowDown size="20" color="#606060" />
                  </Button>
                </Tooltip>
              </Flex>
            )}
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
                <MenuList border="none" maxH="420px" overflow="auto">
                  <MenuItem
                    icon={<BsReply />}
                    onClick={() => {
                      setMessageId(docId);
                      if (fileId) {
                        setMessageContent(result.name);
                      } else {
                        setMessageContent(content);
                      }
                      setMessageUser(senderName);
                      setMode('REPLY');
                      inputRef.current.focus();
                    }}
                  >
                    Reply
                  </MenuItem>
                  {sender === currentUser.$id && !fileId && (
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

                  {data?.map((reader: any, index: number) => (
                    <MenuItem key={index}>
                      <Text fontSize="sm" mr={2}>
                        {reader.readerName}
                      </Text>
                      <Text fontSize="xs">
                        Read at {dayjs(reader.readTime).format('HH:mm')}
                      </Text>
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
  const [message, setMessage] = useState<string>('');
  const databases = useMemo(() => new Databases(client), []);
  const avatars = useMemo(() => new Avatars(client), []);
  const storage = useMemo(() => new Storage(client), []);
  const [mode, setMode] = useState<'EDIT' | 'REPLY' | null>(null);
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const [messageId, setMessageId] = useState<string | null>(null);
  const [referenceToScroll, setReferenceToScroll] = useState<string | null>(
    null
  );
  const teamsClient = useMemo(() => new Teams(client), []);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [messageContent, setMessageContent] = useState<string | null>(null);
  const [messageUser, setMessageUser] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const ChatSectionRef = useRef<HTMLDivElement>(null);
  const account = useMemo(() => new Account(client), []);
  const router = useRouter();
  const { id } = router.query;

  const onDrop = (acceptedFiles: any) => {
    if (acceptedFiles) {
      const file = acceptedFiles[0];
      if (file) {
        setFile(file);
        onOpen();
        // setImageUrl(URL.createObjectURL(file));
        // setCropMode(true);
      }
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragAccept,
    isDragReject,
    isDragActive,
  } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB in bytes
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  //here we implement infinite query and we move up and load previous messages not the next ones,
  // we start with the latest and go back
  const { data, isSuccess } = useQuery(
    [`teamMessages-${id}`],
    async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID as string,
          [
            Query.equal('team', [id as string]),
            Query.limit(5),
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
      staleTime: 3600000,
      cacheTime: 3600000,
    }
  );

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   if (chatScrollRef.current) {
  //     chatScrollRef.current.scrollIntoView({
  //       behavior: 'auto',
  //       block: 'end',
  //     });
  //   }
  // }, [data, isSuccess]);

  const handleKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      if (e.shiftKey) {
        e.preventDefault();
        setMessage((prevMessage: string) => prevMessage + '\n');
      } else {
        e.preventDefault();
        sendMessage();
      }
    }
  };

  const sendMessage = async () => {
    if (message.trim() !== '') {
      try {
        let formattedMessage = message.trim();
        formattedMessage = message.replace(/\n/g, '<br>');
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
              prevData[messageIndex].content = formattedMessage;
              prevData[messageIndex].edited = true;
            }
            return prevData;
          };
          queryClient.setQueryData([`teamMessages-${id}`], queryData);
          const promise = await account.createJWT();
          await axios.post('/api/editchat', {
            jwt: promise.jwt,
            content: formattedMessage,
            $id: messageId,
          });
          return;
        }
        // edit flow ends here
        // normal message and reply flow
        const queryData = (prevData: any) => {
          const newMessage = {
            sender: currentUser.$id,
            content: formattedMessage,
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
          content: formattedMessage,
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

  const sendFileMessage = async (fileId: string) => {
    if (file) {
      try {
        // let formattedMessage = message.trim();
        let formattedMessage = '';
        // formattedMessage = message.replace(/\n/g, '<br>');
        setMessage('');
        if (mode === 'REPLY') {
          setMessageContent('');
          setMode(null);
        }
        const docId = uuidv4();
        // if (mode === 'EDIT') {
        //   //find id with messageId
        //   const queryData = (prevData: any) => {
        //     const messageIndex = prevData.findIndex(
        //       (message: any) => message.$id === messageId
        //     );
        //     if (messageIndex !== -1) {
        //       // prevData[messageIndex].content = formattedMessage;
        //       prevData[messageIndex].edited = true;
        //     }
        //     return prevData;
        //   };
        //   queryClient.setQueryData([`teamMessages-${id}`], queryData);
        //   const promise = await account.createJWT();
        //   await axios.post('/api/editchat', {
        //     jwt: promise.jwt,
        //     content: formattedMessage,
        //     $id: messageId,
        //   });
        //   return;
        // }
        // edit flow ends here
        // normal message and reply flow
        const queryData = (prevData: any) => {
          const newMessage = {
            sender: currentUser.$id,
            content: formattedMessage,
            team: id,
            $id: docId,
            sender_name: currentUser.name,
            $createdAt: Date.now(),
            file: fileId,
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
          content: formattedMessage,
          team: id,
          file: fileId,
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

  const [bottomValue, setBottomValue] = useState(20);

  useEffect(() => {
    if (ChatSectionRef.current) {
      const height = ChatSectionRef.current.clientHeight;
      setBottomValue(height);
    }
  }, [message]);

  const {
    data: teamMembersProfileImages,
    isLoading: isLoadingTeamMembersProfileImages,
    isError: isErrorTeamMembersProfileImages,
    isSuccess: isSuccessTeamMembersProfileImages,
  } = useQuery(
    [`teamMembersProfileImages-${id}`],
    async () => {
      const response = await teamsClient.listMemberships(id as string);
      const memberIds = response.memberships.map((member) => member.userId);

      const memberImageUrls: { [key: string]: string } = {};

      for (const memberId of memberIds) {
        let userResponse;
        try {
          userResponse = await axios.post('/api/getuser', {
            userId: memberId,
          });

          const prefs = userResponse?.data?.prefs;
          if (prefs && prefs.profileImageId) {
            const promise = await storage.getFile(
              process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
              prefs.profileImageId
            );
            const imageUrl = storage.getFilePreview(
              process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
              prefs.profileImageId
            );
            memberImageUrls[memberId] = imageUrl.toString();
          } else {
            throw new Error('no profile image id');
          }
        } catch (error) {
          const prefs = userResponse?.data?.prefs;
          const result = avatars.getInitials(
            userResponse?.data?.name as string,
            240,
            240,
            tinycolor(prefs?.profileColor).lighten(20).toHex()
          );
          memberImageUrls[memberId] = result.toString();
        }
      }

      return memberImageUrls;
    },
    { staleTime: 3600000, cacheTime: 3600000 }
  );

  const renderDateDisplay = (createdAt) => {
    const today = dayjs().startOf('day');
    const messageDate = dayjs(createdAt);

    if (today.isSame(messageDate, 'day')) {
      return 'Today';
    } else {
      return messageDate.format('MMM D, YYYY');
    }
  };

  useEffect(() => {
    // if (data && isSuccess) {
    //   if (chatContainerRef.current) {
    //     chatContainerRef.current.scrollTop =
    //       chatContainerRef.current.scrollHeight - 32;
    //   }
    // }
  }, [data, isSuccess]);

  const [ref, inView] = useInView({
    triggerOnce: false,
    rootMargin: '0px 0px 300px 0px', // Adjust the rootMargin as needed
  });

  const isLoadingRef = useRef(false);

  // useEffect(() => {
  //   const chatContainer = chatContainerRef.current;
  //   console.log('chatContainer:', chatContainer);

  //   const handleScroll = () => {
  //     const prevScrollHeight = chatContainer?.scrollHeight;
  //     console.log('prevScrollHeight:', prevScrollHeight);

  //     const prevClientHeight = chatContainer?.clientHeight;
  //     console.log('prevClientHeight:', prevClientHeight);

  //     const prevScrollTop = chatContainer?.scrollTop;
  //     console.log('prevScrollTop:', prevScrollTop);
  //   };

  //   chatContainer?.addEventListener('scroll', handleScroll);

  //   return () => {
  //     chatContainer?.removeEventListener('scroll', handleScroll);
  //   };
  // }, []);

  const { containerRef } = useKeepScrollPosition([data]);

  useEffect(() => {
    async function fetchData() {
      if (!data || isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;

      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID as string,
          [
            Query.equal('team', [id as string]),
            Query.cursorAfter(data[0].$id as string),
            Query.limit(5),
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
        queryClient.setQueryData([`teamMessages-${id}`], (prevData: any) => {
          const updatedData = [...updatedDocuments, ...prevData];
          return updatedData;
        });
      } catch (error) {
        // Handle error
      } finally {
        isLoadingRef.current = false;
      }
      // Dispatch the request in useQuery
    }

    if (inView) {
      fetchData();
    }
  }, [currentUser.$id, databases, id, queryClient, data, isLoadingRef, inView]);

  // const scrollPos = async () => {
  //   const h = chatContainerRef.current?.scrollHeight;
  //   if (!h) {
  //     return;
  //   }
  //   chatContainerRef.current?.scrollTo({
  //     top: h - 1000,
  //     behavior: 'smooth',
  //   });
  // };

  return (
    <Layout>
      <ChatFileSender
        sendFileMessage={sendFileMessage}
        isOpen={isOpen}
        onClose={onClose}
        file={file}
      />
      <Box
        pos="fixed"
        left={flexWidth}
        right="0"
        bottom="20"
        top="16"
        display="flex"
        flexDirection="column"
      >
        <Box
          overflowY="scroll"
          flex="1"
          bgGradient={`linear(to top, gray.700 99%, ${teamPreference.bg})`}
          py={4}
          ref={containerRef}
        >
          {/* <Box ref={ref} h="1px" w="full"></Box> */}
          {data &&
            data.map((msg: any, index: number) => {
              const previousMsg = index > 0 ? data[index - 1] : data[index];
              const isSameSender =
                previousMsg && previousMsg.sender === msg.sender;
              const displayDate =
                index === 0 ||
                !dayjs(msg.$createdAt).isSame(
                  dayjs(data[index - 1].$createdAt),
                  'day'
                );

              return (
                <Box key={msg.$id}>
                  {displayDate && (
                    <HStack w="full" my={8} px={4}>
                      <Divider flex="1" mr={2} />
                      <Text fontSize="sm" fontWeight="bold" color="gray.400">
                        {renderDateDisplay(msg.$createdAt)}
                      </Text>
                      <Divider flex="1" ml={2} />
                    </HStack>
                  )}
                  <Box ref={index === 0 ? ref : null}>
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
                      inputRef={textAreaRef}
                      setMode={setMode}
                      setMessage={setMessage}
                      referenceUser={msg.referenceUser}
                      edited={msg.edited}
                      fileId={msg.file}
                      referenceToScroll={referenceToScroll}
                      handleOriginalMessageClick={handleOriginalMessageClick}
                      originalMessageRef={componentRefs[msg.$id]}
                      marginY={isSameSender && index !== 0 ? 1 : 8}
                      delivered={msg.delivered}
                      profileImage={
                        teamMembersProfileImages &&
                        teamMembersProfileImages[msg.sender]
                      }
                    />
                  </Box>
                </Box>
              );
            })}
        </Box>
        {/* <h1>{`Header inside viewport ${inView}.`}</h1> */}
        {messageContent && mode === 'REPLY' && (
          <Flex
            justifyContent="space-between"
            p={2}
            px={4}
            bg="gray.500"
            position="fixed"
            bottom={`${bottomValue}px`}
            left={flexWidth}
            align="center"
            right="0"
          >
            <Flex direction="column">
              <Text color="gray.200">{messageUser}</Text>
              <Text>{messageContent.replaceAll('<br>', ' ')}</Text>
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
            bottom={`${bottomValue}px`}
            left={flexWidth}
            align="center"
            right="0"
          >
            <Text>{messageContent.replaceAll('<br>', ' ')}</Text>

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
          ref={ChatSectionRef}
          // py={5}
          bg="gray.700"
          borderTopWidth="1px"
          position="fixed"
          bottom="0"
          left={flexWidth}
          right="0"
          // h={20}
        >
          <Flex align="center">
            <IconButton
              {...getRootProps()}
              // onClick={onOpen}
              icon={<FiPaperclip size="24px" color="white" />}
              bg="transparent"
              fontSize="20px"
              aria-label="Attach File"
              mr={2}
            >
              {/* <Box
                bg="gray.500"
                borderStyle={isDragActive ? 'dashed' : 'solid'}
                borderColor={
                  isDragAccept
                    ? 'blue.200'
                    : isDragReject
                    ? 'red.500'
                    : 'gray.400'
                }
                alignItems="center"
                cursor="pointer"
                position="relative"
              > */}
              {/* {imageUrl && (
                <Image
                  // borderRadius="full"
                  boxShadow="xl"
                  width="100"
                  height="100"
                  src={imageUrl}
                  alt=""
                />
              )} */}
              <input
                type="file"
                {...getInputProps()}
                accept="image/*"
                placeholder="Choose an image"
              />
              {/* </Box> */}
            </IconButton>

            <Textarea
              placeholder="Type your message..."
              value={message.replace(/<br\s*\/?>/gi, '\n')}
              onChange={(e) => setMessage(e.target.value)}
              // bg="white"
              minH="12"
              minRows={1}
              // whiteSpace="pre-wrap"
              size="lg"
              resize="none"
              overflow="hidden"
              ref={textAreaRef}
              p={2}
              px={4}
              as={ResizeTextarea}
              // color="gray.900"
              mr={2}
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
