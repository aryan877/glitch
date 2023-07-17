import {
  Avatar,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Account, Avatars, Databases, Query, Storage } from 'appwrite';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AiOutlineGroup, AiOutlineLogout, AiOutlineUser } from 'react-icons/ai';
import { BsBell, BsBellFill } from 'react-icons/bs';
import { FiArrowLeft, FiBell, FiLogOut, FiMessageSquare } from 'react-icons/fi';
import { MdArrowBackIosNew, MdGroup, MdMessage, MdTask } from 'react-icons/md';
import { RiGroup2Fill, RiGroupFill } from 'react-icons/ri';
import tinycolor from 'tinycolor2';
import { UserContext, useUser } from '../context/UserContext';
import { client } from '../utils/appwriteConfig';

export interface UnreadChat {
  teamId: string;
  teamName: string;
  unreadCount: number;
}

export interface UnreadDirectChat {
  sender: string;
  sender_name: string;
  unreadCount: number;
}

export interface UnreadTasks {
  sender?: string;
  sender_name: string;
  assignee?: string;
  assignee_name: string;
  taskId: string;
  taskName: string;
  team: string;
  teamName: string;
  $id: string;
}

const Navbar = ({ flexWidth }: { flexWidth: number }) => {
  const { currentUser, loading, setCurrentUser } = useUser();
  const queryClient = useQueryClient();
  const storage = useMemo(() => new Storage(client), []);
  const avatars: any = useMemo(() => new Avatars(client), []);
  const router = useRouter();
  const { id, slug } = router.query;
  const [directChatTooltipOpen, setDirectChatTooltipOpen] = useState(false);
  const [groupDMTooltipOpen, setGroupDMTooltipOpen] = useState(false);
  const [taskTooltipOpen, setTaskTooltipOpen] = useState(false);
  const darkButtonRoutes = useMemo(
    () => [
      '/team/[id]',
      '/profile/[id]',
      '/profile/edit/[id]',
      '/team/[id]/dm/[slug]',
    ],
    []
  );
  const databases = useMemo(() => new Databases(client), []);
  const {
    data: teamPreference = {
      bg: '',
      description: '',
      name: '',
      defaultRole: '',
      teamImage: '',
    },
  } = useQuery(
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
      enabled: !router.pathname.startsWith('/profile/[id]'),
    }
  );

  const {
    data: result = '',
    isLoading: resultLoading,
    isError: resultError,
  } = useQuery(
    [`teamProfileImage-${id}`, teamPreference],
    async () => {
      try {
        const timestamp = Date.now(); // Get the current timestamp
        const imageUrl = storage.getFilePreview(
          process.env.NEXT_PUBLIC_TEAM_PROFILE_BUCKET_ID as string,
          teamPreference.teamImage
        );

        return `${imageUrl.toString()}&timestamp=${timestamp}`;
      } catch (error) {
        const result = avatars.getInitials(
          teamPreference.name as string,
          240,
          240,
          tinycolor(teamPreference.bg).lighten(20).toHex()
        );
        return result.toString();
      }
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
      enabled: router.pathname.startsWith('/profile/[id]'),
    }
  );

  const isDarkButtonRoute = useMemo(() => {
    return darkButtonRoutes.some((route) => router.pathname.startsWith(route));
  }, [darkButtonRoutes, router.pathname]);

  const handleLogOut = () => {
    const account = new Account(client);
    const promise = account.deleteSession('current');
    promise.then(
      function (response) {
        setCurrentUser(undefined);
      },
      function (error) {
        console.error(error);
      }
    );
  };

  const goBack = () => {
    router.back();
  };

  //DIRECT CHAT NOTIF DATA HANDLERS
  // a. notifications reader
  const { data: unreadDirectChatsData = [] } = useQuery<UnreadDirectChat[]>(
    ['unreadDirectChats'],
    async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env
            .NEXT_PUBLIC_DIRECT_CHATS_NOTIFICATION_COLLECTION_ID as string,
          [
            Query.equal('readerId', currentUser.$id),
            Query.equal('isRead', false),
          ]
        );

        const unreadDirectChats: UnreadDirectChat[] = response.documents.reduce(
          (result: UnreadDirectChat[], document: any) => {
            const { sender, sender_name } = document;

            const existingSender = result.find(
              (unread) => unread.sender === sender
            );

            if (existingSender) {
              existingSender.unreadCount++;
            } else {
              result.push({
                sender,
                sender_name,
                unreadCount: 1,
              });
            }

            return result;
          },
          []
        );

        return unreadDirectChats;
      } catch (error) {
        console.error('Error fetching direct messages notifications:', error);
        throw error;
      }
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
    }
  );

  // b. Subscriptions
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_DIRECT_CHATS_NOTIFICATION_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.events.includes(
            `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_DIRECT_CHATS_NOTIFICATION_COLLECTION_ID}.documents.*.create`
          )
        ) {
          const payload = response.payload as {
            isRead: boolean;
            sender: string;
            sender_name: string;
            readerId: string;
            channel: string;
          };

          // console.log(payload.teamId);
          if (payload?.sender !== currentUser?.$id) {
            queryClient.setQueryData(['unreadDirectChats'], (prevData: any) => {
              const existingSenderIndex = prevData.findIndex(
                (unread: any) => unread.sender === payload.sender
              );
              if (existingSenderIndex !== -1) {
                const updatedData = [...prevData];
                updatedData[existingSenderIndex] = {
                  ...updatedData[existingSenderIndex],
                  unreadCount: updatedData[existingSenderIndex].unreadCount + 1,
                };
                return updatedData;
              } else {
                const newData = [
                  ...prevData,
                  {
                    sender: payload.sender,
                    sender_name: payload.sender_name,
                    unreadCount: 1,
                  },
                ];
                return newData;
              }
            });
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [queryClient, id, currentUser, router.pathname]);
  //DIRECT CHAT NOTIF DATA HANDLERS

  //GROUP CHAT NOTIF DATA HANDLERS
  // a. notifications reader
  const { data: unreadChatsData = [] } = useQuery<UnreadChat[]>(
    ['unreadChats'],
    async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_CHATS_NOTIFICATION_COLLECTION_ID as string,
          [
            Query.equal('readerId', currentUser.$id),
            Query.equal('isRead', false),
          ]
        );

        const unreadChats: UnreadChat[] = response.documents.reduce(
          (result: UnreadChat[], document: any) => {
            const { teamId, teamName } = document;

            const existingTeam = result.find((team) => team.teamId === teamId);

            if (existingTeam) {
              existingTeam.unreadCount++;
            } else {
              result.push({
                teamId,
                teamName,
                unreadCount: 1,
              });
            }

            return result;
          },
          []
        );

        return unreadChats;
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
  // b. Subscriptions
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHATS_NOTIFICATION_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.events.includes(
            `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHATS_NOTIFICATION_COLLECTION_ID}.documents.*.create`
          )
        ) {
          const payload = response.payload as {
            isRead: boolean;
            sender: string;
            teamName: string;
            teamId: string;
          };
          // console.log(payload.teamId);
          if (payload?.sender !== currentUser?.$id) {
            queryClient.setQueryData(['unreadChats'], (prevData: any) => {
              const teamId = payload.teamId;

              const existingTeamIndex = prevData.findIndex(
                (team: any) => team.teamId === teamId
              );
              if (existingTeamIndex !== -1) {
                const updatedData = [...prevData];
                updatedData[existingTeamIndex] = {
                  ...updatedData[existingTeamIndex],
                  unreadCount: updatedData[existingTeamIndex].unreadCount + 1,
                };
                return updatedData;
              } else {
                const newData = [
                  ...prevData,
                  {
                    teamId,
                    teamName: payload.teamName,
                    unreadCount: 1,
                  },
                ];
                return newData;
              }
            });
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [queryClient, id, currentUser, router.pathname]);

  // c. clear cache on RUD
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as {
          team: string;
        };
        if (payload.team === id && router.pathname !== '/team/chat/[id]') {
          queryClient.refetchQueries([`teamMessagesSidebar-${id}`]);
          queryClient.invalidateQueries([`teamMessages-${payload.team}`]);
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [queryClient, router.pathname, id]);
  //GROUP CHAT NOTIF DATA HANDLERS

  //TASK ASSIGNMENT NOTIF HANDLERS
  // a. notifications reader
  const { data: unreadTasks = [] } = useQuery<UnreadTasks[]>(
    ['unreadTasks'],
    async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TASKS_NOTIFICATION_COLLECTION_ID as string,
          [
            Query.equal('readerId', currentUser.$id),
            Query.equal('isRead', false),
          ]
        );

        const unreadTasks: UnreadTasks[] = response.documents.map(
          (document: any) => {
            const {
              taskName,
              assignee_name,
              sender_name,
              taskId,
              teamName,
              team,
              $id,
            } = document;

            return {
              taskName,
              assignee_name,
              sender_name,
              taskId,
              teamName,
              team,
              $id,
            };
          }
        );

        return unreadTasks;
      } catch (error) {
        console.error('Error fetching unread tasks:', error);
        throw error;
      }
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
    }
  );

  const { data: allTasks = [] } = useQuery<UnreadTasks[]>(
    ['allTasks'],
    async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TASKS_NOTIFICATION_COLLECTION_ID as string,
          [
            Query.equal('readerId', currentUser.$id),
            Query.limit(2),
            Query.orderDesc('$createdAt'),
          ]
        );

        const unreadTasks: UnreadTasks[] = response.documents.map(
          (document: any) => {
            const {
              taskName,
              assignee_name,
              sender_name,
              taskId,
              teamName,
              team,
              $id,
            } = document;

            return {
              taskName,
              assignee_name,
              sender_name,
              taskId,
              teamName,
              team,
              $id,
            };
          }
        );

        return unreadTasks;
      } catch (error) {
        console.error('Error fetching unread tasks:', error);
        throw error;
      }
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
    }
  );

  // b. Subscriptions
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_TASKS_NOTIFICATION_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.events.includes(
            `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_TASKS_NOTIFICATION_COLLECTION_ID}.documents.*.create`
          )
        ) {
          queryClient.refetchQueries([`allTasks`]);
          queryClient.refetchQueries([`unreadTasks`]);
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [queryClient]);
  // c. clear cache on RUD
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_DIRECT_CHATS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as {
          sender: string;
        };
        if (router.pathname !== `/team/[id]/dm/[slug]`) {
          queryClient.invalidateQueries([
            `directMessages-${id}-${payload.sender}`,
          ]);
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [queryClient, router.pathname, id]);
  //to be done
  //TASK ASSIGNMENT NOTIF HANDLERS

  //get logged in user data
  const { data, isLoading, isError, error } = useQuery(
    [`userData-${currentUser.$id}`],
    async () => {
      try {
        const response = await axios.post('/api/getuser', {
          userId: currentUser.$id,
        });
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch user');
      }
    },
    { staleTime: 600000, cacheTime: 600000 }
  );

  //get logged in user profile image
  const {
    data: resultUserImage = '',
    isLoading: resultUserImageLoading,
    isError: resultUserImageError,
  } = useQuery(
    [`userProfileImage-${currentUser.$id}`, data],
    async () => {
      try {
        const imageUrl = storage.getFilePreview(
          process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
          data.prefs.profileImageId
        );

        return `${imageUrl.toString()}`;
      } catch (error) {
        const result = avatars.getInitials(
          data.name as string,
          240,
          240,
          tinycolor(data.prefs.profileColor).lighten(20).toHex()
        );
        return result.toString();
      }
    },
    { staleTime: 600000, cacheTime: 600000, enabled: !!data }
  );

  //get data of user to dm
  const {
    data: dmUserData,
    isLoading: dmUserIsLoading,
    isError: dmUserIsError,
    error: dmUserError,
  } = useQuery(
    [`dmUserData`, slug],
    async () => {
      try {
        const response = await axios.post('/api/getuser', {
          userId: slug,
        });
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch dm user');
      }
    },
    { staleTime: 600000, cacheTime: 600000, enabled: !!slug }
  );

  const {
    data: dmUserImage = '',
    isLoading: dmUserImageLoading,
    isError: dmUserImageError,
  } = useQuery(
    [`dmUserProfileImage-${slug}`],
    async () => {
      try {
        const imageUrl = storage.getFilePreview(
          process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
          dmUserData.prefs.profileImageId
        );

        return `${imageUrl.toString()}`;
      } catch (error) {
        const result = avatars.getInitials(
          dmUserData.name as string,
          240,
          240,
          tinycolor(dmUserData.prefs.profileColor).lighten(20).toHex()
        );
        return result.toString();
      }
    },
    { staleTime: 600000, cacheTime: 600000, enabled: !!dmUserData }
  );

  const handleTaskNotificationMenuOpen = async () => {
    try {
      for (const unreadTask of unreadTasks) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TASKS_NOTIFICATION_COLLECTION_ID as string,
          unreadTask.$id as string,
          {
            isRead: true,
          }
        );
      }
      queryClient.refetchQueries([`unreadTasks`]);
    } catch (error) {}
  };

  const loadPreviousTaskNotificationsHandler = async () => {
    try {
      const lastUnreadTask = allTasks[allTasks.length - 1];
      const lastCursor = lastUnreadTask.$id;

      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_TASKS_NOTIFICATION_COLLECTION_ID as string,
        [
          Query.equal('readerId', currentUser.$id),
          Query.limit(2),
          Query.orderDesc('$createdAt'),
          Query.cursorAfter(lastCursor),
        ]
      );
      const unreadTasks: UnreadTasks[] = response.documents.map(
        (document: any) => {
          // Map the document fields to the UnreadTasks interface
          const {
            taskName,
            assignee_name,
            sender_name,
            taskId,
            teamName,
            team,
            $id,
          } = document;

          return {
            taskName,
            assignee_name,
            sender_name,
            taskId,
            teamName,
            team,
            $id,
          };
        }
      );
      const updatedTaskNotifications = [...allTasks, ...unreadTasks];
      queryClient.setQueryData(['allTasks'], updatedTaskNotifications);
    } catch (error) {}
  };

  const handleTaskNotifictionMenuClose = () => {
    queryClient.refetchQueries([`allTasks`]);
  };

  return (
    <Flex
      justifyContent="space-between"
      px={4}
      align="center"
      bg={isDarkButtonRoute ? 'transparent' : 'gray.800'}
      color="white"
      h="16"
      w={`calc(100% - ${flexWidth}px)`}
      right="0"
      zIndex="999"
      pos="fixed"
    >
      <HStack>
        {router.pathname !== '/' && (
          <Tooltip label="Go Back" bg="gray.900" color="white">
            <IconButton
              ml={8}
              aria-label="Go Back"
              icon={<MdArrowBackIosNew />}
              onClick={goBack}
              bg="gray.900"
              borderRadius="full"
              color="white"
            />
          </Tooltip>
        )}
        {router.pathname.startsWith('/team/chat/[id]') && (
          <Link href={`/team/${id}`}>
            <HStack ml={4}>
              <Avatar
                borderWidth={2}
                borderColor={teamPreference.bg}
                h="10"
                w="10"
                src={result}
                mr={2}
              />
              <Text color="white">Team {teamPreference?.name}</Text>
            </HStack>
          </Link>
        )}
        {dmUserData && router.pathname.startsWith('/team/[id]/dm/[slug]') && (
          <Link href={`/profile/${slug}`}>
            <HStack ml={4}>
              <Avatar
                borderWidth={2}
                // borderColor={teamPreference.bg}
                h="10"
                w="10"
                src={dmUserImage}
                mr={2}
              />
              <Text color="white">{dmUserData.name}</Text>
            </HStack>
          </Link>
        )}
      </HStack>
      {!isDarkButtonRoute && <Spacer />}
      <HStack gap={4}>
        <Menu placement="bottom">
          <Tooltip
            bg="gray.900"
            color="white"
            label="direct chats"
            isOpen={directChatTooltipOpen}
          >
            <MenuButton
              as={IconButton}
              aria-label="notifications"
              onClick={() => setDirectChatTooltipOpen(false)}
              onMouseEnter={() => setDirectChatTooltipOpen(true)}
              onMouseLeave={() => setDirectChatTooltipOpen(false)}
              icon={
                <Flex position="relative">
                  <FiMessageSquare size="24px" />
                  {unreadDirectChatsData.length > 0 && (
                    <Box
                      position="absolute"
                      top="0"
                      right="0"
                      w="6"
                      h="6"
                      borderRadius="full"
                      bg="red.500"
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transform="translate(50%, -50%)"
                    >
                      {unreadDirectChatsData.length.toString()}
                    </Box>
                  )}
                </Flex>
              }
              bg="gray.900"
              _hover={{ bg: 'gray.900' }}
              _focus={{ bg: 'gray.900' }}
              _active={{ bg: 'gray.900' }}
              variant="outline"
              border="none"
              size="md"
              borderRadius="full"
            />
          </Tooltip>
          <MenuList p={2} border="none" borderRadius="md">
            {unreadDirectChatsData.length > 0 ? (
              unreadDirectChatsData.map((unreadChat) => (
                <Link
                  key={unreadChat.sender}
                  href={`/team/${id}/dm/${unreadChat.sender}`}
                >
                  <MenuItem borderRadius="md" p={4} px={2}>
                    <Image
                      src="/notification_logo.svg"
                      alt="notification logo"
                      h="10"
                      mr={2}
                    />
                    <Text fontSize="sm" fontWeight="bold">
                      {unreadChat.unreadCount === 1 ? (
                        <>1 new chat from {unreadChat.sender_name}</>
                      ) : (
                        <>
                          {unreadChat.unreadCount} new chats from{' '}
                          {unreadChat.sender_name}
                        </>
                      )}
                    </Text>
                  </MenuItem>
                </Link>
              ))
            ) : (
              <Box p={4}>All direct messages have been read!</Box>
            )}
          </MenuList>
        </Menu>

        <Menu placement="bottom">
          <Tooltip
            bg="gray.900"
            color="white"
            label="group chats"
            isOpen={groupDMTooltipOpen}
          >
            <MenuButton
              as={IconButton}
              onClick={() => setGroupDMTooltipOpen(false)}
              onMouseEnter={() => setGroupDMTooltipOpen(true)}
              onMouseLeave={() => setGroupDMTooltipOpen(false)}
              aria-label="notifications"
              icon={
                <Flex position="relative">
                  <RiGroupFill size="24px" />
                  {unreadChatsData.length > 0 && (
                    <Box
                      position="absolute"
                      top="0"
                      right="0"
                      w="6"
                      h="6"
                      borderRadius="full"
                      bg="red.500"
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transform="translate(50%, -50%)"
                    >
                      {unreadChatsData.length.toString()}
                    </Box>
                  )}
                </Flex>
              }
              bg="gray.900"
              _hover={{ bg: 'gray.900' }}
              _focus={{ bg: 'gray.900' }}
              _active={{ bg: 'gray.900' }}
              variant="outline"
              border="none"
              size="md"
              borderRadius="full"
            />
          </Tooltip>
          <MenuList p={2} border="none" borderRadius="md">
            {unreadChatsData.length > 0 ? (
              unreadChatsData.map((unreadChat) => (
                <Link
                  key={unreadChat.teamId}
                  href={`/team/chat/${unreadChat.teamId}`}
                >
                  <MenuItem borderRadius="md" p={4} px={2}>
                    <Image
                      src="/notification_logo.svg"
                      alt="notification logo"
                      h="10"
                      mr={2}
                    />
                    <Text fontSize="sm" fontWeight="bold">
                      {unreadChat.unreadCount === 1 ? (
                        <>1 new chat in {unreadChat.teamName}</>
                      ) : (
                        <>
                          {unreadChat.unreadCount} new chats in{' '}
                          {unreadChat.teamName}
                        </>
                      )}
                    </Text>
                  </MenuItem>
                </Link>
              ))
            ) : (
              <Box p={4}>All group chats have been read!</Box>
            )}
          </MenuList>
        </Menu>
        {/* task notifications */}
        <Menu
          placement="bottom"
          onOpen={handleTaskNotificationMenuOpen}
          onClose={handleTaskNotifictionMenuClose}
        >
          <Tooltip
            bg="gray.900"
            color="white"
            label="task notifications"
            isOpen={taskTooltipOpen}
          >
            <MenuButton
              as={IconButton}
              aria-label="notifications"
              onClick={() => setTaskTooltipOpen(false)}
              onMouseEnter={() => setTaskTooltipOpen(true)}
              onMouseLeave={() => setTaskTooltipOpen(false)}
              icon={
                <Flex position="relative">
                  <FiBell size="24px" />
                  {unreadTasks.length > 0 && (
                    <Box
                      position="absolute"
                      top="0"
                      right="0"
                      w="6"
                      h="6"
                      borderRadius="full"
                      bg="red.500"
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transform="translate(50%, -50%)"
                    >
                      {unreadTasks.length.toString()}
                    </Box>
                  )}
                </Flex>
              }
              bg="gray.900"
              _hover={{ bg: 'gray.900' }}
              _focus={{ bg: 'gray.900' }}
              _active={{ bg: 'gray.900' }}
              variant="outline"
              border="none"
              size="md"
              borderRadius="full"
            />
          </Tooltip>
          <MenuList
            p={2}
            border="none"
            borderRadius="md"
            maxW="400"
            maxH="600"
            overflowY="auto"
          >
            {allTasks.length > 0 ? (
              allTasks.map((task, index) => (
                <Link
                  key={index}
                  href={`/team/tasks/task_page/${task.team}/${task.taskId}`}
                >
                  <MenuItem borderRadius="md" p={4} px={2}>
                    <Image
                      src="/notification_logo.svg"
                      alt="notification logo"
                      h="10"
                      mr={2}
                    />
                    <Text fontSize="sm" fontWeight="bold">
                      <Text as="span" color="blue.200">
                        {task.sender_name}
                      </Text>{' '}
                      assigned a task to{' '}
                      <Text as="span" color="green.200">
                        You
                      </Text>{' '}
                      in team{' '}
                      <Text as="span" color="orange.200">
                        {task.teamName}
                      </Text>
                      <br />
                      {task.taskName && (
                        <Text as="span" color="gray.300" fontSize="sm">
                          Title: {task.taskName}
                        </Text>
                      )}
                    </Text>
                  </MenuItem>
                </Link>
              ))
            ) : (
              <Box p={4}>You have no task notifications!</Box>
            )}
            <Button
              variant="unstyled"
              ml={4}
              color="blue.200"
              onClick={loadPreviousTaskNotificationsHandler}
            >
              Load more...
            </Button>
          </MenuList>
        </Menu>
        <Menu>
          <MenuButton
            as={Button}
            borderRadius="full"
            bg={!isDarkButtonRoute ? 'transparent' : 'gray.800'}
            variant="styled"
            colorScheme="gray"
          >
            <HStack gap={2}>
              <Avatar src={resultUserImage} size="sm" />
              <Text ml={4} fontWeight="bold" color="white">
                {currentUser?.name}
              </Text>
            </HStack>
          </MenuButton>
          <MenuList p={2} border="none" borderRadius="md">
            <Link href={`/profile/${currentUser.$id}`}>
              <MenuItem borderRadius="md">
                <AiOutlineUser size="24px" />
                <Text ml={4}>Profile</Text>
              </MenuItem>
            </Link>
            <MenuItem onClick={handleLogOut} borderRadius="md">
              <FiLogOut color="red" size="24px" />
              <Text ml={4}>Logout</Text>
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

export default Navbar;
