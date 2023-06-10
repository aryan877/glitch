import { Link } from '@chakra-ui/next-js';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Grid,
  HStack,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Avatars, Databases, Query, Storage, Teams } from 'appwrite';
import axios from 'axios';
import { useUser } from 'context/UserContext';
import dayjs from 'dayjs';
import 'dayjs/locale/en'; // Import the locale you want to use (e.g., 'en' for English)
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime'; // Import the relativeTime plugin
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { IoMdAdd } from 'react-icons/io';
import tinycolor from 'tinycolor2';
import { client } from 'utils/appwriteConfig';
import withAuth from 'utils/withAuth';
import Layout from '../../../../components/Layout';
import { getBadgeColor } from '../[id]';
// Dummy task data with colors
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
function TeamTasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { id } = router.query;

  const [filterType, setFilterType] = useState('all');
  const { currentUser } = useUser();
  const storage = useMemo(() => new Storage(client), []);
  const teamsClient = useMemo(() => new Teams(client), []);
  const avatars = useMemo(() => new Avatars(client), []);
  const databases = useMemo(() => new Databases(client), []);
  const [sortType, setSortType] = useState<string | null>(null);
  const [showSortType, setShowSortType] = useState(false);
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

  const { data: teamTasksData, isSuccess: isSuccessTeamTasksData } = useQuery(
    [`teamTasks-${id}`, filterType, searchQuery, sortType],
    async () => {
      try {
        let filters = [];

        // Apply filters based on filterType
        if (filterType === 'pending') {
          //@ts-ignore
          filters.push(Query.equal('isComplete', false));
        } else if (filterType === 'assigned') {
          //@ts-ignore
          filters.push(Query.equal('assignee', currentUser.$id));
        } else if (filterType === 'completed') {
          //@ts-ignore
          filters.push(Query.equal('isComplete', true));
        }

        if (!searchQuery) {
          //@ts-ignore
          filters.push(Query.equal('team', id as string));
        } else if (searchQuery) {
          //@ts-ignore
          filters.push(Query.search('taskName', searchQuery as string));
        }

        let sortBy = null;
        if (sortType === 'dateCreated') {
          //@ts-ignore
          sortBy = Query.orderDesc('$createdAt');
        } else if (sortType === 'deadline') {
          //@ts-ignore
          sortBy = Query.orderAsc('deadline');
        }

        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          //@ts-ignore
          process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID as string,
          //@ts-ignore
          [...filters, sortBy].filter(Boolean) // Remove null/undefined filters
        );

        return response.documents;
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

  const taskMarkCompleteHandler = () => {
    if (ownerOrAdmin) {
      //if you are owner or admin you already have the permissions to mark complete/edit
    } else {
      //else you don not have updation persmissions, an as assignee you can only mark complete, not edit, so delegate this task to serverless functions
    }
  };

  return (
    <Layout>
      <Box mx={8} mt={-8}>
        <Box>
          <Input
            placeholder="Search tasks with name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
            onClick={() => setFilterType('assigned')}
            variant={filterType === 'assigned' ? 'solid' : 'outline'}
          >
            Assigned to You
          </Button>
          <Button
            borderRadius="full"
            onClick={() => setFilterType('completed')}
            variant={filterType === 'completed' ? 'solid' : 'outline'}
          >
            Complete
          </Button>
          <Menu>
            <MenuButton as={Button} borderRadius="full" variant="outline">
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
                borderColor={task.isComplete ? 'green.700' : 'yellow.700'}
                key={task.$id}
                bg={task.isComplete ? 'green.700' : 'gray.700'}
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
                  bg={task.isComplete ? 'green.600' : 'gray.600'}
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
                  p={2}
                  px={4}
                  borderRadius="md"
                  bg={task.isComplete ? 'green.600' : 'gray.600'}
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
                  bg={task.isComplete ? 'green.600' : 'gray.600'}
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
                          size="lg"
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
                  bg={task.isComplete ? 'green.600' : 'gray.600'}
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
                          Time Left: {dayjs(task.deadline).fromNow(true)}
                        </Badge>
                      </>
                    ) : (
                      <Text mr={4}>No deadline</Text>
                    )}
                  </>
                </HStack>
                <Badge
                  color="white"
                  mr={2}
                  fontSize="sm"
                  variant="outline"
                  bg={task.isComplete ? 'green.600' : 'yellow.600'}
                >
                  {task.isComplete ? 'Complete' : 'Pending'}
                </Badge>
                <Badge mr={2} fontSize="sm" variant="outline" color="white">
                  PRIORITY: {task.priority}
                </Badge>
                <Badge fontSize="sm" color="white">
                  CREATED:{' '}
                  {dayjs(task.$createdAt, 'YYYY-MM-DD HH:mm:ss')
                    .locale('en')
                    .format('dddd, MMMM D, YYYY, h:mm A')}
                </Badge>

                {
                  <Box mt={4}>
                    {(ownerOrAdmin || task.assignee === currentUser.$id) && (
                      <Button
                        borderRadius="md"
                        bg="transparent"
                        onClick={taskMarkCompleteHandler}
                        color="white"
                        border="1px solid white"
                        _hover={{ bg: 'white', color: 'gray.900' }}
                        px={4}
                        py={2}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {ownerOrAdmin && (
                      <Button
                        borderRadius="md"
                        bg="transparent"
                        color="white"
                        ml={4}
                        leftIcon={<AiFillEdit />}
                        border="1px solid white"
                        _hover={{ bg: 'white', color: 'gray.900' }}
                        px={4}
                        py={2}
                      >
                        Edit Task
                      </Button>
                    )}
                  </Box>
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
