import { Link } from '@chakra-ui/next-js';
import {
  Avatar,
  Box,
  chakra,
  Flex,
  HStack,
  Image,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatars, Databases, Storage, Teams } from 'appwrite';
import axios from 'axios';
import { useUser } from 'context/UserContext';
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
    const minWidth = 200;
    const limitedWidth = Math.max(minWidth, newWidth);
    setFlexWidth(limitedWidth);
  };
  const { currentUser } = useUser();
  const teamsClient = useMemo(() => new Teams(client), []);
  const storage = useMemo(() => new Storage(client), []);
  const avatars = useMemo(() => new Avatars(client), []);
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (flexRef.current) {
      const { width } = flexRef.current.getBoundingClientRect();
      setFlexWidth(width);
    }
  }, [setFlexWidth]);

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
        zIndex="999"
        pos="fixed"
        as="nav"
        h="full"
        w={flexWidth}
        ref={flexRef}
        cursor={isDragging ? 'grabbing' : 'grab'}
      >
        <Link mb={2} py={2} href="/">
          <Text fontSize="2xl" fontWeight="bold" color="green.200">
            Glitch.
            {/* <Image maxW="100" src="/logo.png" alt="logo" /> */}
          </Text>
        </Link>

        <Text fontWeight="bold" fontSize="md" mt={8} mb={4} color="gray.300">
          team-{teamPreference.name}
        </Text>
        <VStack spacing={4} align="start" w="100%">
          <Link
            p={2}
            _hover={{ bg: 'gray.800', color: 'white' }}
            borderRadius="md"
            w="full"
            href={`/team/${id}`}
            color={router.pathname === '/team/[id]' ? 'white' : 'gray.300'}
          >
            <HStack spacing={4} alignItems="center" w="100%">
              <Box>
                <BsPeopleFill size={24} />
              </Box>
              <Text
                display={shouldHideIcons ? 'none' : 'flex'}
                fontWeight="bold"
              >
                Team
              </Text>
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
            <HStack spacing={4} alignItems="center" w="100%">
              <Box>
                <FiMessageSquare size="24px" />
              </Box>

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
            <HStack spacing={4} alignItems="center" w="100%">
              <Box>
                <FaTasks size="24px" />
              </Box>

              <Text
                display={shouldHideIcons ? 'none' : 'flex'}
                fontWeight="bold"
              >
                Tasks
              </Text>
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

              <Text
                display={shouldHideIcons ? 'none' : 'flex'}
                fontWeight="bold"
              >
                Search
              </Text>
            </HStack>
          </Link>
        </VStack>
        <Box mt={8}>
          <Text fontWeight="bold" mb={4} fontSize="md" color="gray.300">
            Direct Messages
          </Text>
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
                      <Avatar
                        size="sm"
                        src={teamMembersProfileImages[teamMember.userId]}
                        name={teamMember.userName}
                      ></Avatar>
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
