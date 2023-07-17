import { Link } from '@chakra-ui/next-js';
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
  Input,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Account,
  Avatars,
  Databases,
  Models,
  Query,
  Storage,
  Teams,
} from 'appwrite';
import axios from 'axios';
import { useNotification } from 'context/NotificationContext';
import { useUser } from 'context/UserContext';
import dayjs from 'dayjs';
import 'dayjs/locale/en'; // Import the locale you want to use (e.g., 'en' for English)
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime'; // Import the relativeTime plugin
import { assign } from 'lodash';
import { useRouter } from 'next/router';
import React, { useMemo, useRef, useState } from 'react';
import {
  AiFillCopy,
  AiFillEdit,
  AiOutlineClose,
  AiOutlineDown,
  AiOutlineSearch,
} from 'react-icons/ai';
import { BsPin } from 'react-icons/bs';
import { FaCopy, FaTrash } from 'react-icons/fa';
import { FiArrowUpRight } from 'react-icons/fi';
import { IoMdAdd } from 'react-icons/io';
import tinycolor from 'tinycolor2';
import { client } from 'utils/appwriteConfig';
import withAuth from 'utils/withAuth';
import Layout from '../../../../../components/Layout';
import { getBadgeColor } from '../../[id]';
// Dummy task data with colors
// dayjs.extend(relativeTime);
// dayjs.extend(customParseFormat);
function PinnedTasks() {
  const router = useRouter();
  const { id } = router.query;
  const { showNotification } = useNotification();
  const { currentUser } = useUser();
  const storage = useMemo(() => new Storage(client), []);
  const teamsClient = useMemo(() => new Teams(client), []);
  const avatars = useMemo(() => new Avatars(client), []);
  const databases = useMemo(() => new Databases(client), []);
  const account = useMemo(() => new Account(client), []);
  const queryClient = useQueryClient();
  const [pinLoadingState, setPinLoadingState] = useState({});
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

  const { data: pinnedTasksData, isSuccess: isSuccessPinnedTasksData } =
    useQuery([`pinnedTasks-${id}`], async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TASKS_PINNED_COLLECTION_ID as string,
          [
            Query.equal('userId', currentUser.$id),
            Query.equal('team', id as string),
          ]
        );

        const tasks: Models.Document[] = [];
        for (const document of response.documents) {
          for (const taskId of document.tasks) {
            try {
              const taskResponse = await databases.getDocument(
                process.env.NEXT_PUBLIC_DATABASE_ID as string,
                process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
                taskId
              );
              tasks.push(taskResponse as Models.Document);
            } catch (error) {
              console.error(`Error fetching task ${taskId}:`, error);
            }
          }
        }

        return tasks;
      } catch (error) {
        console.error('Error fetching pinned tasks:', error);
        throw error;
      }
    });

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

  const ownerOrAdmin = useMemo(
    () =>
      teamMembersData?.some(
        (teamMember) =>
          (teamMember.roles.includes('owner') ||
            teamMember.roles.includes('admin')) &&
          teamMember.userId === currentUser.$id
      ),
    [teamMembersData, currentUser]
  );

  const [taskMarkId, setTaskMarkId] = useState<string | null>(null);
  const [taskMarkStatusComplete, setTaskMarkStatusComplete] = useState<
    boolean | null
  >(null);

  const taskMarkCompleteStateHandler = async () => {
    try {
      if (ownerOrAdmin) {
        // If you are the owner or admin, you already have permissions to edit the whole document
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
          taskMarkId as string,
          { isComplete: !taskMarkStatusComplete }
        );
      } else {
        // If you are not the owner or admin, delegate the task to a serverless function to mark it as complete
        const promise = await account.createJWT();
        await axios.post('/api/taskcompletetoggle', {
          jwt: promise.jwt,
          taskId: taskMarkId,
        });
      }

      onClose();
      setTaskMarkId(null);
      setTaskMarkStatusComplete(null);
      queryClient.refetchQueries([`pinnedTasks-${id}`]);
      showNotification('Task completion status updated');
    } catch (error) {
      console.error('Error updating task completion status:', error);
      showNotification(
        'Something went wrong. Could not update task completion status.'
      );
    }
  };

  const taskDeleteHandler = async () => {
    try {
      if (ownerOrAdmin) {
        // If you are the owner or admin, you already have permissions to edit the whole document
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
          taskMarkId as string
        );
        onDeleteClose();
        setTaskMarkId(null);
        queryClient.refetchQueries([`pinnedTasks-${id}`]);
        showNotification('Task deleted successfully');
      }
    } catch (error) {
      console.error('Error updating task completion status:', error);
      showNotification(
        'Something went wrong. Could not update task completion status.'
      );
    }
  };

  const cancelRef = useRef<HTMLButtonElement>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const copyTaskIdHandler = (taskId: string) => {
    navigator.clipboard
      .writeText(taskId)
      .then(() => {
        showNotification('Task ID copied to clipboard');
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const pinTaskHandler = async (taskId: string, pinned: boolean) => {
    try {
      const promise = await account.createJWT();
      setPinLoadingState((prevState) => ({ ...prevState, [taskId]: true }));
      await axios.post('/api/taskpintoggle', {
        jwt: promise.jwt,
        team: id,
        taskId: taskId,
      });
      const pinToggleMessage = pinned ? 'unpinned' : 'pinned';
      showNotification(`task ${pinToggleMessage}`);
      queryClient.refetchQueries([`pinnedTasks-${id}`]);
    } catch (error) {
      console.error(error);
      throw new Error('failed to pin task');
    } finally {
      setPinLoadingState((prevState) => ({ ...prevState, [taskId]: false }));
    }
  };

  return (
    <Layout>
      {/* mark complete dialog */}
      <AlertDialog
        isCentered
        leastDestructiveRef={cancelRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmation
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to update the completion status of the task
              ?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose}>
                {/* <Button onClick={onClose} disabled={isMarkingComplete}> */}
                No
              </Button>
              <Button
                colorScheme="whatsapp"
                onClick={taskMarkCompleteStateHandler}
                ml={3}
                // isLoading={isMarkingComplete}
              >
                Yes
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      {/* delete task dialog */}
      <AlertDialog
        isCentered
        leastDestructiveRef={cancelRef}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmation
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this task ?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>
                {/* <Button onClick={onClose} disabled={isMarkingComplete}> */}
                No
              </Button>
              <Button
                colorScheme="red"
                onClick={taskDeleteHandler}
                ml={3}
                // isLoading={isMarkingComplete}
              >
                Yes
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <Box mx={8} mt={-8}>
        {/* {ownerOrAdmin && (
          <Link href={`/team/tasks/create/${id}`}>
            <Button my={4} borderRadius="full" leftIcon={<IoMdAdd size={18} />}>
              Create New Task
            </Button>
          </Link>
        )} */}
        <HStack align="baseline">
          {' '}
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Your Pins ({pinnedTasksData?.length}){' '}
          </Text>{' '}
          <BsPin size="18px" />
        </HStack>

        <Grid templateColumns="repeat(1,1fr)" minH={300} gap={4} my={0}>
          {pinnedTasksData &&
            pinnedTasksData.map((task) => (
              <Box
                borderWidth={2}
                borderColor={task.isComplete ? 'green.900' : 'yellow.500'}
                key={task.$id}
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
                  <Text>{task.taskName}</Text>
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
                    noOfLines={8}
                    dangerouslySetInnerHTML={{ __html: task.taskDescription }}
                  />
                  <Link href={`/team/tasks/task_page/${id}/${task.$id}`}>
                    <Text color="blue.300">Read more</Text>
                  </Link>
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
                    <Link href={`/profile/${task.assignee}`}>
                      <Tooltip
                        bg="gray.900"
                        color="white"
                        label={
                          teamMembersData &&
                          teamMembersData.map((teamMember) =>
                            teamMember.userId === task.assignee
                              ? teamMember.userName
                              : ''
                          )
                        }
                      >
                        <Avatar
                          size="md"
                          src={
                            teamMembersProfileImages[task.assignee] as string
                          }
                        />
                      </Tooltip>
                    </Link>
                  )}

                  <Text fontWeight="semibold" fontSize="lg" mb={2} mx={4}>
                    Created By
                  </Text>
                  {teamMembersProfileImages && (
                    <Link href={`/profile/${task.assignee}`}>
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
                    {task.deadline ? (
                      <>
                        {' '}
                        <Text mr={4}>
                          {dayjs(task.deadline).format('dddd, MMMM D, h:mm A')}
                        </Text>
                        <Badge>
                          {`Time Left: ${Math.floor(
                            dayjs(task.deadline).diff(dayjs(), 'minute') /
                              (24 * 60)
                          )} days, ${Math.floor(
                            (dayjs(task.deadline).diff(dayjs(), 'minute') %
                              (24 * 60)) /
                              60
                          )} hours, ${
                            dayjs(task.deadline).diff(dayjs(), 'minute') % 60
                          } minutes`}
                        </Badge>
                      </>
                    ) : (
                      <Text mr={4}>No deadline</Text>
                    )}
                  </>
                </HStack>
                <Badge
                  color={task.isComplete ? 'black' : 'white'}
                  mr={2}
                  fontSize="sm"
                  variant="solid"
                  bg={task.isComplete ? 'green.600' : 'yellow.600'}
                >
                  {task.isComplete ? 'Complete' : 'Pending'}
                </Badge>
                <Badge
                  mr={2}
                  fontSize="sm"
                  bg={
                    task.priority === 'high'
                      ? 'red'
                      : task.priority === 'medium'
                      ? 'blue'
                      : 'gray.600'
                  }
                  variant="solid"
                  color="white"
                >
                  PRIORITY: {task.priority}
                </Badge>
                <Badge fontSize="sm" color="white">
                  CREATED:{' '}
                  {dayjs(task.$createdAt, 'YYYY-MM-DD HH:mm:ss').format(
                    'dddd, MMMM D, YYYY, h:mm A'
                  )}
                </Badge>

                {
                  <Flex justifyContent="space-between" mt={8}>
                    <HStack>
                      {(ownerOrAdmin || task.assignee === currentUser.$id) && (
                        <Button
                          borderRadius="md"
                          bg="transparent"
                          onClick={() => {
                            setTaskMarkId(task.$id);
                            setTaskMarkStatusComplete(task.isComplete);
                            onOpen();
                          }}
                          color="white"
                          border="1px solid white"
                          _hover={{ bg: 'white', color: 'gray.900' }}
                          px={4}
                          py={2}
                        >
                          {task.isComplete
                            ? 'Mark Incomplete'
                            : 'Mark Complete'}
                        </Button>
                      )}
                      {ownerOrAdmin && (
                        <Link href={`/team/tasks/edit/${id}/${task.$id}`}>
                          <Button
                            borderRadius="md"
                            bg="transparent"
                            color="white"
                            leftIcon={<AiFillEdit />}
                            border="1px solid white"
                            _hover={{ bg: 'white', color: 'gray.900' }}
                            px={4}
                            py={2}
                          >
                            Edit Task
                          </Button>
                        </Link>
                      )}
                    </HStack>
                    <HStack>
                      <Button
                        borderRadius="md"
                        color="white"
                        ml={4}
                        bg="gray.900"
                        leftIcon={<FaCopy />}
                        _hover={{ bg: 'gray.600' }}
                        px={4}
                        py={2}
                        onClick={() => copyTaskIdHandler(task.$id)}
                      >
                        Copy ID
                      </Button>
                      {ownerOrAdmin && (
                        <Button
                          borderRadius="md"
                          bg="transparent"
                          color="white"
                          leftIcon={<FaTrash />}
                          border="1px solid white"
                          _hover={{
                            bg: 'red',
                            color: 'gray.900',
                            border: '1px solid red',
                          }}
                          px={4}
                          py={2}
                          onClick={() => {
                            setTaskMarkId(task.$id);
                            onDeleteOpen();
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </HStack>
                  </Flex>
                }
                <HStack spacing={4} mt={4} align="baseline">
                  <Button
                    onClick={() => {
                      pinTaskHandler(
                        task.$id,
                        task.pinned.includes(currentUser.$id)
                      );
                    }}
                    isLoading={pinLoadingState[task.$id]}
                    variant="solid"
                    leftIcon={<BsPin color="white" />}
                  >
                    {task.pinned.includes(currentUser.$id) ? 'Unpin' : 'Pin'}
                  </Button>
                  <Link href={`/team/tasks/task_page/${id}/${task.$id}`}>
                    <Button
                      color="gray.300"
                      rightIcon={<FiArrowUpRight />}
                      _hover={{ color: 'white' }}
                      variant="unstyled"
                    >
                      expand
                    </Button>
                  </Link>
                </HStack>
              </Box>
            ))}
        </Grid>
        {pinnedTasksData?.length == 0 && (
          <Center>
            <Text>No Pinned Tasks</Text>
          </Center>
        )}
      </Box>
    </Layout>
  );
}

export default withAuth(PinnedTasks);
