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
import { Account, Avatars, Databases, Query, Storage, Teams } from 'appwrite';
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
import { FaCopy, FaTrash } from 'react-icons/fa';
import { IoMdAdd } from 'react-icons/io';
import tinycolor from 'tinycolor2';
import { client } from 'utils/appwriteConfig';
import withAuth from 'utils/withAuth';
import Layout from '../../../../components/Layout';
import { getBadgeColor } from '../[id]';
// Dummy task data with colors
// dayjs.extend(relativeTime);
// dayjs.extend(customParseFormat);
function TeamTasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchId, setSearchId] = useState('');
  const router = useRouter();

  const { id } = router.query;
  const { showNotification } = useNotification();
  const [filterType, setFilterType] = useState('all');
  const { currentUser } = useUser();
  const storage = useMemo(() => new Storage(client), []);
  const teamsClient = useMemo(() => new Teams(client), []);
  const avatars = useMemo(() => new Avatars(client), []);
  const databases = useMemo(() => new Databases(client), []);
  const account = useMemo(() => new Account(client), []);
  const [sortType, setSortType] = useState<string | null>(null);
  const [showSortType, setShowSortType] = useState(false);
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

  const [assignee, setAssignee] = useState<string | null>(null);

  const { data: teamTasksData, isSuccess: isSuccessTeamTasksData } = useQuery(
    [`teamTasks-${id}`, filterType, searchQuery, sortType, assignee, searchId],
    async () => {
      try {
        let filters = [];

        if (filterType === 'pending') {
          //@ts-ignore
          filters.push(Query.equal('isComplete', false));
        } else if (filterType === 'completed') {
          //@ts-ignore
          filters.push(Query.equal('isComplete', true));
        }

        if (!searchQuery && searchId) {
          //@ts-ignore
          filters.push(Query.equal('$id', searchId as string));
        } else if (searchQuery) {
          //@ts-ignore
          filters.push(Query.search('taskName', searchQuery as string));
        } else if (!searchQuery) {
          //@ts-ignore
          filters.push(Query.equal('team', id as string));
        }

        if (assignee) {
          //@ts-ignore
          filters.push(Query.equal('assignee', assignee));
        }

        let sortBy = null;
        if (sortType === 'dateCreated') {
          //@ts-ignore
          sortBy = Query.orderDesc('$createdAt');
        } else if (sortType === 'deadline') {
          //@ts-ignore
          sortBy = Query.orderDesc('deadline');
        }

        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
          //@ts-ignore
          [...filters, sortBy].filter(Boolean)
        );

        let sortedDocuments = response.documents;
        if (sortType === 'priority') {
          sortedDocuments = response.documents.sort((doc1, doc2) => {
            const priority1 = doc1?.priority || '';
            const priority2 = doc2?.priority || '';

            if (priority1 === 'high' && priority2 !== 'high') {
              return -1;
            } else if (priority1 !== 'high' && priority2 === 'high') {
              return 1;
            } else if (priority1 === 'medium' && priority2 === 'low') {
              return -1;
            } else if (priority1 === 'low' && priority2 === 'medium') {
              return 1;
            } else {
              return 0;
            }
          });
        }

        return sortedDocuments;
      } catch (error) {
        console.error('Error fetching team messages:', error);
        throw error;
      }
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

  const handleSortByChange = (sortType: string) => {
    setSortType(sortType);
    setShowSortType(true);
  };

  const clearSortType = () => {
    setSortType(null);
    setShowSortType(false);
  };

  const clearAssignee = () => {
    setAssignee(null);
  };

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
      queryClient.refetchQueries([`teamTasks-${id}`]);
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
        queryClient.refetchQueries([`teamTasks-${id}`]);
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

  const isAppwriteID = (term) => {
    const appwriteIDPattern = /^[a-f0-9]{20}$/;
    const searchTermPattern = /(\b(\w{1,3})\b)|(\b(\w{4})\b)/i;
    return appwriteIDPattern.test(term) && !searchTermPattern.test(term);
  };

  const searchHandler = (e) => {
    const inputValue = e.target.value;

    if (isAppwriteID(inputValue)) {
      setSearchId(inputValue);
      setSearchQuery('');
    } else {
      setSearchQuery(inputValue);
      setSearchId('');
    }

    setAssignee(null);
    setSortType(null);
    setFilterType('all');
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
        <Box>
          <InputGroup>
            <Input
              placeholder="Search with Task Name or Task ID"
              value={searchQuery ? searchQuery : searchId}
              onChange={searchHandler}
              pr="4.5rem" // Add padding to accommodate the icon
              variant="outline"
              borderColor="gray.400"
              borderRadius="md"
              size="md"
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px blue.500',
              }}
            />
            <InputRightElement width="4.5rem" pointerEvents="none">
              <AiOutlineSearch size="24px" color="gray" />
            </InputRightElement>
          </InputGroup>
        </Box>
        {ownerOrAdmin && (
          <Link href={`/team/tasks/create/${id}`}>
            <Button my={4} borderRadius="full" leftIcon={<IoMdAdd size={18} />}>
              Create New Task
            </Button>
          </Link>
        )}
        <HStack spacing={2} my={4}>
          <Button
            borderRadius="full"
            onClick={() => setFilterType('all')}
            variant={filterType === 'all' ? 'solid' : 'outline'}
          >
            All
          </Button>
          <Button
            borderRadius="full"
            onClick={() => setFilterType('pending')}
            variant={filterType === 'pending' ? 'solid' : 'outline'}
          >
            Pending
          </Button>

          <Button
            borderRadius="full"
            onClick={() => setFilterType('completed')}
            variant={filterType === 'completed' ? 'solid' : 'outline'}
          >
            Complete
          </Button>
          <Button
            borderRadius="full"
            onClick={() => setAssignee(currentUser.$id)}
            variant={assignee === currentUser.$id ? 'solid' : 'outline'}
          >
            Assigned to You
          </Button>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<AiOutlineDown />}
              borderRadius="full"
              variant="outline"
            >
              {assignee
                ? (
                    teamMembersData?.find(
                      (member) => member.userId === assignee
                    )?.userName || 'Filter Member'
                  ).slice(0, 8) + '...'
                : 'Filter Member'}
            </MenuButton>
            <MenuList border="none">
              {teamMembersData?.map((teamMember) => (
                <MenuItem
                  key={teamMember.$id}
                  onClick={() => setAssignee(teamMember.userId as string)}
                >
                  {teamMember.userName}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          {assignee && (
            <Button
              variant="ghost"
              bg="red"
              borderRadius="full"
              onClick={clearAssignee}
            >
              {' '}
              Remove Filter
            </Button>
          )}

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<AiOutlineDown />}
              borderRadius="full"
              variant="outline"
            >
              {showSortType ? sortType : 'Sort By'}
            </MenuButton>
            <MenuList border="none">
              <MenuItem onClick={() => handleSortByChange('dateCreated')}>
                Date Created ( Latest to Oldest )
              </MenuItem>
              <MenuItem onClick={() => handleSortByChange('priority')}>
                Priority ( High to Low)
              </MenuItem>
              <MenuItem onClick={() => handleSortByChange('deadline')}>
                Deadline ( Shortest to Longest )
              </MenuItem>
            </MenuList>
          </Menu>
          {showSortType && (
            <Button bg="red" borderRadius="full" onClick={clearSortType}>
              {' '}
              Clear Sort
            </Button>
          )}
        </HStack>
        <Grid templateColumns="repeat(1,1fr)" minH={300} gap={4} my={0}>
          {teamTasksData &&
            teamTasksData.map((task) => (
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
                    dangerouslySetInnerHTML={{ __html: task.taskDescription }}
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
                    <Link href={`/profile/${task.assignee}`}>
                      <Tooltip
                        bg="gray.900"
                        color='white'
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
                      : ''
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
              </Box>
            ))}
        </Grid>
        {teamTasksData?.length == 0 && (
          <Center>
            <Text>No Tasks To Show</Text>
          </Center>
        )}
      </Box>
    </Layout>
  );
}

export default withAuth(TeamTasks);
