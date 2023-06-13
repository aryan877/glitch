import { Link } from '@chakra-ui/next-js';

import {
  Avatar,
  Box,
  Center,
  chakra,
  Flex,
  HStack,
  Image,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatars, Databases, Query, Storage, Teams } from 'appwrite';
import axios from 'axios';
import { useUser } from 'context/UserContext';
import dayjs from 'dayjs';
import { default as duration } from 'dayjs/plugin/duration';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DraggableCore } from 'react-draggable';
import { AiFillHome, AiFillMessage } from 'react-icons/ai';
import {
  BsCameraVideoFill,
  BsChatDotsFill,
  BsCheckSquareFill,
  BsGearFill,
  BsPeopleFill,
  BsPin,
  BsSearch,
} from 'react-icons/bs';
import { FaSearch, FaTasks } from 'react-icons/fa';
import { FiMessageCircle, FiMessageSquare, FiSearch } from 'react-icons/fi';
import { IoMdSearch } from 'react-icons/io';
import { MdPin, MdSearchOff } from 'react-icons/md';
import { RiMessage2Line, RiMessageLine } from 'react-icons/ri';
import tinycolor from 'tinycolor2';
import { useSidebar } from '../context/SidebarContext';
import { client } from '../utils/appwriteConfig';
import { UnreadChat, UnreadDirectChat } from './Navbar';
dayjs.extend(duration);

function TeamSidebar() {
  const flexRef = useRef<HTMLDivElement>(null);
  const { flexWidth, setFlexWidth } = useSidebar();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const router = useRouter();
  const { id, slug } = router.query;
  const queryClient = useQueryClient();
  const databases = useMemo(() => new Databases(client), []);
  const handleDrag = (e: any, data: any) => {
    const newWidth = flexWidth + data.deltaX;
    const minWidth = 240;
    const maxWidth = 600;
    const limitedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setFlexWidth(limitedWidth);
  };
  const { currentUser } = useUser();
  const teamsClient = useMemo(() => new Teams(client), []);
  const storage = useMemo(() => new Storage(client), []);
  const avatars = useMemo(() => new Avatars(client), []);
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const [timeAgo, setTimeAgo] = useState<string>('');

  const handleDragStop = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (flexRef.current) {
      const { width } = flexRef.current.getBoundingClientRect();
      setFlexWidth(width);
    }
  }, [setFlexWidth]);

  const { data, isSuccess } = useQuery(
    [`teamMessagesSidebar-${id}`],
    async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_CHATS_COLLECTION_ID as string,
          [
            Query.equal('team', [id as string]),
            Query.limit(1),
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
      enabled: Boolean(id),
      staleTime: 3600000,
      cacheTime: 3600000,
    }
  );

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

  useEffect(() => {
    let createdAt;
    if (data && data[0]) {
      createdAt = data[0].$createdAt;
    }
    const updateTimeAgo = () => {
      if (createdAt) {
        setTimeAgo(getTimeAgo(createdAt));
      } else {
        setTimeAgo('');
      }
    };
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => {
      clearInterval(interval);
    };
  }, [data, isSuccess]);

  const getTimeAgo = (createdAt) => {
    const diff = dayjs().diff(createdAt);

    if (diff < 60000) {
      // Less than 1 minute
      const seconds = dayjs.duration(diff).asSeconds();
      return `${seconds.toFixed(0)}s ago`;
    } else if (diff < 3600000) {
      // Less than 1 hour
      const minutes = dayjs.duration(diff).asMinutes();
      return `${minutes.toFixed(0)}m ago`;
    } else if (diff < 86400000) {
      // Less than 1 day
      const hours = dayjs.duration(diff).asHours();
      return `${hours.toFixed(0)}h ago`;
    } else {
      // Over a day
      return dayjs(createdAt).format('DD/MM/YY');
    }
  };

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

  const shouldHideIcons = flexWidth < 150;

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
        enabled: !router.pathname.startsWith('/profile/[id]'),
      }
    );

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

  return (
    // @ts-ignore
    <DraggableCore
      onDrag={handleDrag}
      onStart={handleDragStart}
      onStop={handleDragStop}
    >
      <Box
        bg="black"
        p={8}
        px={4}
        zIndex="999"
        pos="fixed"
        as="nav"
        h="full"
        overflowY="auto"
        w={flexWidth}
        ref={flexRef}
        cursor={isDragging ? 'grabbing' : 'grab'}
      >
        <Link mb={2} py={2} href="/" _hover={{ textDecoration: 'none' }}>
          <Text fontSize="2xl" fontWeight="bold" color="green.200">
            Glitch.
            {/* <Image maxW="100" src="/logo.png" alt="logo" /> */}
          </Text>
        </Link>

        <Text fontWeight="bold" fontSize="md" mt={8} mb={4} color="gray.300">
          #-team-{teamPreference.name}
        </Text>
        <VStack spacing={2} align="start" w="100%">
          <Link
            p={2}
            _hover={{ bg: 'gray.800', color: 'white' }}
            borderRadius="md"
            w="full"
            href={`/team/${id}`}
            color={router.pathname === '/team/[id]' ? 'white' : 'gray.300'}
          >
            <HStack spacing={4} alignItems="start" w="full">
              <Box>
                <BsPeopleFill size={24} />
              </Box>
              <VStack align="start">
                <Text fontWeight="bold">Team</Text>
                <Text
                  mt={-2}
                  fontSize="sm"
                  color="gray.500"
                  fontWeight="semibold"
                >
                  dashboard
                </Text>
              </VStack>
            </HStack>
          </Link>

          <Link
            href={`/team/chat/${id}`}
            color={router.pathname === '/team/chat/[id]' ? 'white' : 'gray.300'}
            p={2}
            _hover={{ bg: 'gray.800', color: 'white' }}
            borderRadius="md"
            w="full"
          >
            <HStack spacing={4} alignItems="start" w="100%">
              <Box>
                <FiMessageSquare size="24px" />
              </Box>
              {
                <VStack align="start">
                  <HStack>
                    <chakra.div
                      as={Text}
                      overflow="hidden"
                      whiteSpace="nowrap"
                      fontWeight="bold"
                      textOverflow="ellipsis"
                      maxW={flexWidth - 100}
                    >
                      Team Chat
                    </chakra.div>
                    {unreadChatsData.find((chat) => chat.teamId === id)
                      ?.unreadCount && (
                      <Box
                        width={6}
                        height={6}
                        borderRadius="full"
                        bg="red.500"
                        color="white"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        <Center h="100%" w="100%">
                          {
                            unreadChatsData.find((chat) => chat.teamId === id)
                              ?.unreadCount
                          }
                        </Center>
                      </Box>
                    )}
                  </HStack>

                  {data && data[0] && isSuccess && (
                    <Box>
                      <chakra.div
                        as={Text}
                        overflow="hidden"
                        whiteSpace="nowrap"
                        fontWeight="bold"
                        textOverflow="ellipsis"
                        maxW={flexWidth - 100}
                        color="gray.200"
                      >
                        {data[0].sender_name}
                      </chakra.div>
                      <chakra.div
                        as={Text}
                        overflow="hidden"
                        whiteSpace="nowrap"
                        color="gray.200"
                        mt={1}
                        textOverflow="ellipsis"
                        maxW={flexWidth - 100}
                      >
                        {data[0].content}
                      </chakra.div>
                    </Box>
                  )}
                  {data && <Text fontSize="xs"> {timeAgo}</Text>}
                </VStack>
              }
            </HStack>
          </Link>

          <Link
            href={`/team/tasks/${id}`}
            color={
              router.pathname === '/team/tasks/[id]' ? 'white' : 'gray.300'
            }
            p={2}
            _hover={{ bg: 'gray.800', color: 'white' }}
            borderRadius="md"
            w="full"
          >
            <HStack spacing={4} alignItems="start" w="100%">
              <Box>
                <FaTasks size="24px" />
              </Box>
              <VStack align="start">
                <Text fontWeight="bold">Tasks</Text>
                <Text
                  fontSize="sm"
                  color="gray.500"
                  fontWeight="semibold"
                  mt={-2}
                >
                  team tasks
                </Text>
              </VStack>
            </HStack>
          </Link>
          <Link
            href={`/team/tasks/pinned/${id}`}
            color={
              router.pathname === '/team/tasks/pinned/[id]'
                ? 'white'
                : 'gray.300'
            }
            p={2}
            _hover={{ bg: 'gray.800', color: 'white' }}
            borderRadius="md"
            w="full"
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <Box>
                <BsPin size="24px" />
              </Box>
              <VStack align="start">
                <chakra.div
                  as={Text}
                  overflow="hidden"
                  whiteSpace="nowrap"
                  fontWeight="bold"
                  textOverflow="ellipsis"
                  maxW={flexWidth - 100}
                >
                  Pinned Tasks
                </chakra.div>
                <Text
                  mt={-2}
                  fontSize="sm"
                  color="gray.500"
                  fontWeight="semibold"
                >
                  your pins
                </Text>
              </VStack>
            </HStack>
          </Link>
          {/* <Link
            href={`/team/video/${id}`}
            color={
              router.pathname === '/team/video/[id]' ? 'white' : 'gray.300'
            }
            p={2}
            _hover={{ bg: 'gray.700', color: 'white' }}
            borderRadius="md"
            w="full"
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <Box>
                <BsCameraVideoFill size={24} />
              </Box>

              <Text
                display={shouldHideIcons ? 'none' : 'flex'}
                fontWeight="bold"
              >
                Video Call
              </Text>
            </HStack>
          </Link> */}
          <Link
            href={`/team/user_search/${id}`}
            color={
              router.pathname === '/team/user_search/[id]'
                ? 'white'
                : 'gray.300'
            }
            p={2}
            _hover={{ bg: 'gray.800', color: 'white' }}
            borderRadius="md"
            w="full"
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <Box>
                <FiSearch size="24px" />{' '}
              </Box>

              <VStack align="start">
                <chakra.div
                  as={Text}
                  overflow="hidden"
                  whiteSpace="nowrap"
                  fontWeight="bold"
                  textOverflow="ellipsis"
                  maxW={flexWidth - 100}
                >
                  Search
                </chakra.div>
                <Text
                  mt={-2}
                  fontSize="sm"
                  color="gray.500"
                  fontWeight="semibold"
                >
                  search users
                </Text>
              </VStack>
            </HStack>
          </Link>
        </VStack>
        <Box mt={8} ml={2}>
          <Text fontWeight="bold" mb={4} fontSize="md" color="gray.300">
            <chakra.div>
              Direct Messages (
              {teamMembersData?.length ? teamMembersData?.length - 1 : 0})
            </chakra.div>
          </Text>
          {teamMembersData && teamMembersData.length <= 1 && (
            <Text mt={-2} fontSize="sm" color="gray.500" fontWeight="semibold">
              Add members to see direct chats
            </Text>
          )}

          <VStack align="start" gap={2}>
            {teamMembersData?.map((teamMember) => {
              if (currentUser.$id === teamMember.userId) {
                return;
              }
              return (
                <Link
                  _hover={{ textDecoration: 'none' }}
                  key={teamMember.userId}
                  href={`/team/${id}/dm/${teamMember.userId}`}
                >
                  <HStack
                    borderRadius="md"
                    p={2}
                    _hover={{ bg: 'gray.800' }}
                    gap={2}
                  >
                    {teamMembersProfileImages && (
                      <>
                        <Box position="relative" mr={2}>
                          <Avatar
                            size="sm"
                            src={teamMembersProfileImages[teamMember.userId]}
                            name={teamMember.userName}
                          />
                          {unreadDirectChatsData.find(
                            (unreadDirectChat) =>
                              unreadDirectChat.sender === teamMember.userId
                          ) && (
                            <Box
                              position="absolute"
                              top="-2"
                              right="-2"
                              width={6}
                              height={6}
                              borderRadius="full"
                              bg="red.500"
                              color="white"
                              fontSize="xs"
                              fontWeight="bold"
                              display="flex"
                              justifyContent="center"
                              alignItems="center"
                            >
                              <Text>
                                {unreadDirectChatsData.reduce(
                                  (count, unreadDirectChat) =>
                                    unreadDirectChat.sender ===
                                    teamMember.userId
                                      ? count + unreadDirectChat.unreadCount
                                      : count,
                                  0
                                )}
                              </Text>
                            </Box>
                          )}
                        </Box>
                      </>
                    )}

                    <chakra.div
                      as={Text}
                      overflow="hidden"
                      whiteSpace="nowrap"
                      color={slug === teamMember.userId ? 'white' : 'gray.300'}
                      fontWeight="bold"
                      textOverflow="ellipsis"
                      maxW={flexWidth - 100} // Adjust the maximum width as per your requirement
                    >
                      {teamMember.userName}
                    </chakra.div>
                  </HStack>
                </Link>
              );
            })}
          </VStack>
        </Box>
      </Box>
    </DraggableCore>
  );
}

export default TeamSidebar;
