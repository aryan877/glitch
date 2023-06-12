import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  HStack,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Account, Avatars, Databases, Query, Storage, Teams } from 'appwrite';
import axios from 'axios';
import { useNotification } from 'context/NotificationContext';
import { useUser } from 'context/UserContext';
import dayjs from 'dayjs';
import 'dayjs/locale/en'; // Import the locale you want to use (e.g., 'en' for English)
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime'; // Import the relativeTime plugin
import { assign, isEmpty } from 'lodash';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  AiFillCopy,
  AiFillEdit,
  AiOutlineClose,
  AiOutlineDown,
  AiOutlineSearch,
  AiOutlineSend,
} from 'react-icons/ai';
import { BsArrowDown, BsPin } from 'react-icons/bs';
import { FaCopy, FaTrash } from 'react-icons/fa';
import { FiCopy, FiPaperclip } from 'react-icons/fi';
import { IoMdAdd, IoMdCopy } from 'react-icons/io';
import 'react-quill/dist/quill.snow.css';
import ResizeTextarea from 'react-textarea-autosize';
import tinycolor from 'tinycolor2';
import { client } from 'utils/appwriteConfig';
import withAuth from 'utils/withAuth';
import Layout from '../../../../../../components/Layout';
import TaskNoteFileSender from '../../../../../../components/TaskNoteFileSender';
import { getBadgeColor } from '../../../[id]';
const ReactQuillWithNoSSR = dynamic(() => import('react-quill'), {
  ssr: false,
});

function Note({
  sender,
  content,
  senderName,
  createdAt,
  docId,
  fileId,
  profileImage,
}: {
  sender: string;
  content: string;
  createdAt: string;
  senderName: string | null;
  docId: string;
  fileId: string;
  profileImage: string | undefined;
}) {
  const router = useRouter();
  const { id, slug } = router.query;
  const { currentUser } = useUser();
  const databases = useMemo(() => new Databases(client), []);
  const storage = useMemo(() => new Storage(client), []);
  const { showNotification } = useNotification();
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const {
    data: result = { previewUrl: '', name: '' },
    isLoading: resultLoading,
    isError: resultError,
  } = useQuery(
    [`taskFile-${docId}`],
    async () => {
      try {
        const promise = await storage.getFile(
          process.env.NEXT_PUBLIC_TASK_NOTES_FILES_BUCKET_ID as string,
          fileId
        );
        // const timestamp = Date.now(); // Get the current timestamp
        const previewUrl = storage.getFilePreview(
          process.env.NEXT_PUBLIC_TASK_NOTES_FILES_BUCKET_ID as string,
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

  const downloadFileHandler = () => {
    const result = storage.getFileDownload(
      process.env.NEXT_PUBLIC_TASK_NOTES_FILES_BUCKET_ID as string,
      fileId as string
    );
    const link = document.createElement('a');
    link.href = result.href;
    link.download = 'filename'; // Set the desired filename here
    link.click();
  };

  const deleteNoteHandler = async (
    docId: string,
    fileId: string
  ): Promise<void> => {
    try {
      setDeleteLoading(true);
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_TASKS_NOTES_COLLECTION_ID as string,
        docId as string
      );
      if (fileId) {
        await storage.deleteFile(
          process.env.NEXT_PUBLIC_TASK_NOTES_FILES_BUCKET_ID as string,
          fileId
        );
      }
      showNotification('deleted note');
      queryClient.refetchQueries([`taskNotes-${slug}`]);
    } catch (error) {
      showNotification('something went wrong, could not delete note');
    } finally {
      setDeleteLoading(false);
    }
  };

  // const handleDelete = async (): Promise<void> => {
  //   const promise = await account.createJWT();
  //   const postData: { $id: string; jwt: string; file?: string } = {
  //     $id: docId,
  //     jwt: promise.jwt,
  //   };

  //   if (fileId) {
  //     postData.file = fileId;
  //   }

  //   try {
  //     await axios.post('/api/deletechat', postData);
  //   } catch (error) {
  //     // Handle the error
  //   }
  // };

  return (
    <Flex direction="column" px={4} mt={4}>
      <Flex>
        {
          <Link href={`/profile/${sender}}`}>
            <Avatar
              name={senderName as string}
              size="md"
              mr={4}
              src={profileImage}
              w="12"
              bg="gray.500"
              color="white"
            />
          </Link>
        }
        {
          <Box
            w="full"
            py={2}
            px={4}
            bg="gray.700"
            color="white"
            borderRadius="md"
          >
            <Link href={`/profile/${sender}}`}>
              <Text fontWeight="bold" color="gray.300">
                {senderName}
              </Text>
            </Link>
            <Text
              fontSize="md"
              color="gray.200"
              my={2}
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {fileId && (
              <VStack align="start" w="min-content">
                {' '}
                <Image
                  minW="140"
                  src={result.previewUrl}
                  alt="file preview"
                  h="200"
                  w={
                    result.name.endsWith('.jpg') ||
                    result.name.endsWith('.jpeg') ||
                    result.name.endsWith('.png')
                      ? 'auto'
                      : '200'
                  }
                />
                {fileId && (
                  <Flex
                    w="full"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Text mt={2} color="gray.300">
                      {result.name.length > 10
                        ? result.name.replace(/^(.{7}).+?(\.[^.]+)$/, '$1...$2')
                        : result.name}
                    </Text>
                    <Tooltip
                      color="white"
                      label="Download File"
                      placement="top"
                    >
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
              </VStack>
            )}

            <HStack align="center" mt={2} justifyContent="space-between">
              {/* <Spacer /> */}
              <Text fontWeight="bold" color="gray.300" fontSize="xs">
                {`${dayjs(createdAt).format('MM/DD/YYYY hh:mm A')}`}
              </Text>
              {currentUser.$id === sender && (
                <Button
                  isLoading={deleteLoading}
                  onClick={() => {
                    deleteNoteHandler(docId, fileId);
                  }}
                >
                  Delete
                </Button>
              )}
            </HStack>
          </Box>
        }
      </Flex>
    </Flex>
  );
}

function TaskPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchId, setSearchId] = useState('');
  const [note, setNote] = useState('');
  const router = useRouter();
  const { id, slug } = router.query;
  const { showNotification } = useNotification();
  const { currentUser } = useUser();
  const storage = useMemo(() => new Storage(client), []);
  const teamsClient = useMemo(() => new Teams(client), []);
  const avatars = useMemo(() => new Avatars(client), []);
  const [sendNoteLoading, setSendNoteLoading] = useState<boolean>(false);
  const databases = useMemo(() => new Databases(client), []);
  const account = useMemo(() => new Account(client), []);
  const [file, setFile] = useState<File | undefined>(undefined);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const modules = {
    toolbar: [
      // [{ header: '1' }, { header: '2' }],
      // [{ size: [] }],
      ['bold', 'italic', 'underline', 'strike', 'code'],
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
      ],
      ['link'],
    ],
    clipboard: {
      matchVisual: false,
    },
  };

  const handleKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      if (e.shiftKey) {
        e.preventDefault();
        setNote((prevNote: string) => prevNote + '\n');
      } else {
        e.preventDefault();
        sendNote();
      }
    }
  };

  const queryClient = useQueryClient();
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

  const { data: taskData, isSuccess: isSuccessTaskData } = useQuery(
    [`task-${slug}`],
    async () => {
      try {
        const response = await databases.getDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
          slug as string
        );
        return response;
      } catch (error) {
        console.error('Error fetching team messages:', error);
        throw error;
      }
    },
    {
      // staleTime: 3600000,
      // cacheTime: 3600000,
    }
  );

  const { data: taskNotes, isSuccess: isSuccessTaskNotesData } = useQuery(
    [`taskNotes-${slug}`],
    async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TASKS_NOTES_COLLECTION_ID as string,
          [
            Query.equal('taskId', slug as string),
            Query.equal('team', id as string),
          ]
        );
        return response.documents;
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

  const {
    data: teamMembersProfileImages,
    isLoading: isLoadingTeamMembersProfileImages,
    isError: isErrorTeamMembersProfileImages,
    isSuccess: isSuccessTeamMembersProfileImages,
  } = useQuery(
    [`teamMembersProfileImages-${id}`],
    async () => {
      const response = await teamsClient.listMemberships(id as string);
      const userIds = response.memberships.map((member) => member.userId);

      const memberImageUrls: { [key: string]: string } = {};

      for (const userId of userIds) {
        let userResponse;
        try {
          userResponse = await axios.post('/api/getuser', {
            userId,
          });
          const prefs = userResponse?.data?.prefs;
          if (prefs && prefs.profileImageId) {
            const imageUrl = storage.getFilePreview(
              process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
              prefs.profileImageId
            );
            memberImageUrls[userId] = imageUrl.toString();
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
          memberImageUrls[userId] = result.toString();
        }
      }

      return memberImageUrls;
    },
    { staleTime: 3600000, cacheTime: 3600000 }
  );

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

  const sendNote = async () => {
    if (note.trim() !== '') {
      try {
        let formattedNote = note.trim();
        formattedNote = note.replace(/\n/g, '<br>');
        setNote('');
        const promise = await account.createJWT();
        setSendNoteLoading(true);
        showNotification('adding note...');
        await axios.post('/api/posttasknote', {
          jwt: promise.jwt,
          content: formattedNote,
          team: id,
          taskId: slug,
        });
        // Mark the message as delivered
        queryClient.refetchQueries([`taskNotes-${slug}`]);
        //here we set that as delivered
      } catch (error) {
        console.error(error);
      } finally {
        setSendNoteLoading(false);
      }
    }
  };

  const sendFileMessage = async (fileId: string) => {
    if (file) {
      try {
        setNote('');
        const promise = await account.createJWT();
        await axios.post('/api/posttasknote', {
          jwt: promise.jwt,
          content: '',
          team: id,
          taskId: slug,
          file: fileId,
        });
        queryClient.refetchQueries([`taskNotes-${slug}`]);
        //here we set that as delivered
      } catch (error) {
        console.error(error);
      }
    }
  };
  const { isOpen, onOpen, onClose } = useDisclosure();

  const pinTaskHandler = async (taskId: string, pinned: boolean) => {
    try {
      const promise = await account.createJWT();
      setPinLoading(true);
      await axios.post('/api/taskpintoggle', {
        jwt: promise.jwt,
        team: id,
        taskId: taskId,
      });
      const pinToggleMessage = pinned ? 'unpinned' : 'pinned';
      showNotification(`task ${pinToggleMessage}`);
      queryClient.invalidateQueries([`teamTasks-${id}`]);
      queryClient.refetchQueries([`task-${slug}`]);
    } catch (error) {
      console.error(error);
      throw new Error('failed to pin task');
    } finally {
      setPinLoading(false);
    }
  };

  const handleClickCopy = () => {
    const idToCopy = taskData?.$id;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
    }
    showNotification('task id copied');
  };

  return (
    <Layout>
      <TaskNoteFileSender
        sendFileMessage={sendFileMessage}
        isOpen={isOpen}
        onClose={onClose}
        file={file}
      />
      <Box mx={8} mt={-8}>
        {taskData && (
          <HStack align="baseline">
            <Text fontSize="lg" mb={2}>
              {' '}
              Task ID <strong>{taskData?.$id}</strong>
            </Text>
            <Button
              ml={4}
              onClick={handleClickCopy}
              leftIcon={<FiCopy />}
              variant="unstyled"
            >
              copy id
            </Button>
          </HStack>
        )}
        <Grid templateColumns="repeat(1,1fr)" minH={300} gap={4} my={0}>
          {taskData && (
            <Box
              borderWidth={2}
              borderColor={taskData.isComplete ? 'green.900' : 'yellow.500'}
              key={taskData.$id}
              bg="gray.700"
              p={8}
              borderRadius="md"
              boxShadow="sm"
              width="100%"
              color="white"
            >
              <VStack
                p={2}
                px={4}
                borderRadius="md"
                bg="gray.600"
                gap={2}
                align="baseline"
                mb={2}
              >
                <Text fontWeight="semibold" fontSize="lg">
                  Task Name
                </Text>
                <Text>{taskData.taskName}</Text>
              </VStack>
              <VStack
                p={4}
                borderRadius="md"
                bg="gray.600"
                gap={2}
                mb={2}
                align="baseline"
              >
                <Text fontWeight="semibold" fontSize="lg">
                  Task Description
                </Text>
                <Text
                  className="bullet-list"
                  dangerouslySetInnerHTML={{ __html: taskData.taskDescription }}
                />
              </VStack>
              <HStack
                p={2}
                px={4}
                borderRadius="md"
                bg="gray.600"
                gap={2}
                mb={2}
                align="center"
              >
                <Text fontWeight="semibold" fontSize="lg" mb={2} mr={4}>
                  Assigned To
                </Text>
                {/* <Text mb={2}>
                    {teamMembersData &&
                      teamMembersData.map((teamMember) =>
                        teamMember.userId === task.assignee
                          ? teamMember.userName
                          : ''
                      )}
                  </Text> */}

                {teamMembersProfileImages && (
                  <Link href={`/profile/${taskData.assignee}`}>
                    <Tooltip
                      bg="gray.900"
                      color="white"
                      label={
                        teamMembersData &&
                        teamMembersData.map((teamMember) =>
                          teamMember.userId === taskData.assignee
                            ? teamMember.userName
                            : ''
                        )
                      }
                    >
                      <Avatar
                        size="md"
                        src={
                          teamMembersProfileImages[taskData.assignee] as string
                        }
                      />
                    </Tooltip>
                  </Link>
                )}

                <Text fontWeight="semibold" fontSize="lg" mb={2} mx={4}>
                  Created By
                </Text>
                {teamMembersProfileImages && (
                  <Link href={`/profile/${taskData.assignee}`}>
                    <Tooltip
                      bg="gray.900"
                      color="white"
                      label={
                        teamMembersData &&
                        teamMembersData.map((teamMember) =>
                          teamMember.userId === currentUser.$id
                            ? teamMember.userName
                            : ''
                        )
                      }
                    >
                      <Avatar
                        size="md"
                        src={
                          teamMembersProfileImages[currentUser.$id] as string
                        }
                      />
                    </Tooltip>
                  </Link>
                )}
              </HStack>

              <HStack
                p={2}
                px={4}
                borderRadius="md"
                bg="gray.600"
                gap={2}
                mb={2}
                align="center"
              >
                <>
                  {' '}
                  <Text fontWeight="semibold" fontSize="lg" mr={0}>
                    Deadline
                  </Text>
                  {taskData.deadline ? (
                    <>
                      {' '}
                      <Text mr={4}>
                        {dayjs(taskData.deadline).format(
                          'dddd, MMMM D, h:mm A'
                        )}
                      </Text>
                      <Badge>
                        {`Time Left: ${Math.floor(
                          dayjs(taskData.deadline).diff(dayjs(), 'minute') /
                            (24 * 60)
                        )} days, ${Math.floor(
                          (dayjs(taskData.deadline).diff(dayjs(), 'minute') %
                            (24 * 60)) /
                            60
                        )} hours, ${
                          dayjs(taskData.deadline).diff(dayjs(), 'minute') % 60
                        } minutes`}
                      </Badge>
                    </>
                  ) : (
                    <Text mr={4}>No deadline</Text>
                  )}
                </>
              </HStack>
              <Badge
                color={taskData.isComplete ? 'black' : 'white'}
                mr={2}
                fontSize="sm"
                variant="solid"
                bg={taskData.isComplete ? 'green.600' : 'yellow.600'}
              >
                {taskData.isComplete ? 'Complete' : 'Pending'}
              </Badge>
              <Badge
                mr={2}
                fontSize="sm"
                bg={
                  taskData.priority === 'high'
                    ? 'red'
                    : taskData.priority === 'medium'
                    ? 'blue'
                    : ''
                }
                variant="solid"
                color="white"
              >
                PRIORITY: {taskData.priority}
              </Badge>
              <Badge fontSize="sm" color="white">
                CREATED:{' '}
                {dayjs(taskData.$createdAt, 'YYYY-MM-DD HH:mm:ss').format(
                  'dddd, MMMM D, YYYY, h:mm A'
                )}
              </Badge>
              <Box mt={4}>
                <Button
                  onClick={() => {
                    pinTaskHandler(
                      taskData.$id,
                      taskData.pinned.includes(currentUser.$id)
                    );
                  }}
                  isLoading={pinLoading}
                  variant="solid"
                  leftIcon={<BsPin color="white" />}
                >
                  {taskData.pinned.includes(currentUser.$id) ? 'Unpin' : 'Pin'}
                </Button>
              </Box>
            </Box>
          )}
        </Grid>

        <Box
          p={4}
          // ref={ChatSectionRef}
          // py={5}
          mt={8}
          bg="gray.700"
          borderRadius="md"
          // h={20}
        >
          <Flex align="center" pos="relative">
            <IconButton
              {...getRootProps()}
              // onClick={onOpen}
              icon={<FiPaperclip size="24px" color="white" />}
              bg="transparent"
              fontSize="20px"
              h={12}
              w={16}
              _hover={{ bg: 'gray.600' }}
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
              placeholder="Enter note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
              mr={2}
              onKeyDown={handleKeyDown}
            />

            <IconButton
              icon={<AiOutlineSend size="24px" />}
              colorScheme={
                taskData && taskData.isComplete ? 'whatsapp' : 'yellow'
              }
              isLoading={sendNoteLoading}
              h={12}
              w={16}
              aria-label="send-message"
              onClick={sendNote}
            />
          </Flex>
        </Box>
        <Box mt={8}>
          <Text fontWeight="bold">
            Notes ({taskNotes ? taskNotes.length : 0})
          </Text>
          {taskNotes &&
            taskNotes?.map((taskNote) => (
              <Note
                key={taskNote.$id}
                sender={taskNote.sender}
                senderName={taskNote.sender_name}
                content={taskNote.content}
                docId={taskNote.$id}
                createdAt={taskNote.$createdAt}
                fileId={taskNote.file}
                profileImage={teamMembersProfileImages?.[taskNote.sender] ?? ''}
              />
            ))}
        </Box>
        {!taskNotes && (
          <Center>
            <Text>There are no notes created</Text>
          </Center>
        )}
      </Box>
    </Layout>
  );
}

export default withAuth(TaskPage);
