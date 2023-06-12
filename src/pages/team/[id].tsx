// import { Image } from '@chakra-ui/next-js';
// import { Image } from '@chakra-ui/next-js';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
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
import { Avatars, Databases, Storage, Teams } from 'appwrite';
import axios from 'axios';
import Link from 'next/link';

import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import {
  AiFillEdit,
  AiFillWechat,
  AiOutlineEllipsis,
  AiOutlineUserAdd,
} from 'react-icons/ai';
import { BsCircleFill, BsInfoCircle, BsInfoCircleFill } from 'react-icons/bs';
import { FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import { MdAdd, MdClose, MdMail } from 'react-icons/md';
import stringHash from 'string-hash';
import tinycolor from 'tinycolor2';
import EditTeamDataModal from '../../../components/EditTeamDataModal';
import InviteMemberModal from '../../../components/InviteMemberModal';
import Layout from '../../../components/Layout';
import RoleInput from '../../../components/RoleInput';
import { useUser } from '../../../context/UserContext';
import { client } from '../../../utils/appwriteConfig';
import { default as withAuth } from '../../../utils/withAuth';
export const getBadgeColor = (word: string) => {
  const hash = stringHash(word || '');
  const red = hash % 256;
  const green = (hash >> 8) % 256;
  const blue = (hash >> 16) % 256;
  return `rgb(${red}, ${green}, ${blue})`;
};

function Team() {
  const router = useRouter();
  const { id } = router.query;
  const databases = useMemo(() => new Databases(client), []);
  const avatars: any = useMemo(() => new Avatars(client), []);
  const { currentUser } = useUser();
  const storage = useMemo(() => new Storage(client), []);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditTeamModalOpen,
    onOpen: openEditTeamModal,
    onClose: closeEditTeamModal,
  } = useDisclosure();
  const teamsClient = useMemo(() => new Teams(client), []);
  // const [teamMembers, setTeamMembers] = useState<any>([]);
  const queryClient = useQueryClient();
  //team preferences in db collection
  //preferences has bg and description
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
      staleTime: 600000,
      cacheTime: 600000,
    }
  );
  //team api member list
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

  //team api data
  //team api has name data and member count
  // const {
  //   data: currentTeamData = { name: '', total: 0 },
  //   isLoading: isLoadingTeam,
  //   isError: isErrorTeam,
  //   isSuccess: isSuccessTeam,
  // } = useQuery(
  //   [`currentTeam-${id}`],
  //   async () => {
  //     const response = await teamsClient.get(id as string);
  //     return response;
  //   },
  //   {
  //     staleTime: 600000,
  //   }
  // );

  useEffect(() => {
    const unsubscribe = client.subscribe('memberships', (response) => {
      if (response.events.includes(`teams.${id}.memberships.*.delete`)) {
        queryClient.setQueryData([`teamMembers-${id}`], (prevData: any) => {
          const deletedMember: any = response.payload;
          return prevData.filter(
            (member: any) => member.$id !== deletedMember.$id
          );
        });
      } else if (
        response.events.includes(`teams.${id}.memberships.*.create`) ||
        response.events.includes(`teams.${id}.memberships.*.update.status`)
      ) {
        // queryClient.invalidateQueries([`teamMembers-${id}`]);
        queryClient.setQueryData([`teamMembers-${id}`], (prevData: any) => {
          const newMember: any = response.payload;
          const existingMemberIndex = prevData.findIndex(
            (member: any) => member.$id === newMember.$id
          );
          if (existingMemberIndex !== -1) {
            const updatedData = [...prevData];
            updatedData[existingMemberIndex] = newMember;
            return updatedData;
          } else {
            return [newMember, ...prevData];
          }
        });
      }
    });
    return () => {
      unsubscribe();
    };
  }, [id, queryClient]);

  // useEffect(() => {
  //   if (teamMembersData && teamMembersSuccess) {
  //     setTeamMembers(teamMembersData);
  //   }
  // }, [teamMembersData, teamMembersSuccess]);

  //we get the avatar here, but before that we need to check if there is a profile image for team in bucket
  const {
    data: result = '',
    isLoading: resultLoading,
    isError: resultError,
  } = useQuery(
    [`teamProfileImage-${id}`, teamPreference],
    async () => {
      try {
        const imageUrl = await storage.getFilePreview(
          process.env.NEXT_PUBLIC_TEAM_PROFILE_BUCKET_ID as string,
          teamPreference.teamImage
        );
        return `${imageUrl.toString()}`;
      } catch (error) {
        const result = await avatars.getInitials(
          teamPreference.name as string,
          240,
          240,
          tinycolor(teamPreference.bg).lighten(20).toHex()
        );
        return result.toString();
      }
    },
    {
      staleTime: 600000,
      cacheTime: 600000,
      enabled: !!teamPreference,
    }
  );

  // const {
  //   data: resultUserImage = '',
  //   isLoading: resultUserImageLoading,
  //   isError: resultUserImageError,
  // } = useQuery(
  //   [`userProfileImage-${currentUser.$id}`, data],
  //   async () => {
  //     try {
  //       const imageUrl = storage.getFilePreview(
  //         process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
  //         data.prefs.profileImageId
  //       );

  //       return `${imageUrl.toString()}`;
  //     } catch (error) {
  //       const result = avatars.getInitials(
  //         data.name as string,
  //         240,
  //         240,
  //         tinycolor(data.prefs.profileColor).lighten(20).toHex()
  //       );
  //       return result.toString();
  //     }
  //   },
  //   { staleTime: 600000, cacheTime: 600000, enabled: !!data }
  // );

  const cancelMembershipHandler = async (membershipId: string) => {
    const promise = await teamsClient.deleteMembership(
      id as string,
      membershipId as string
    );
  };

  const owner = useMemo(
    () =>
      teamMembersData?.some(
        (teamMember) =>
          teamMember.roles.includes('owner') &&
          teamMember.userId === currentUser.$id
      ),
    [teamMembersData, currentUser]
  );

  const leaveTeamHandler = async () => {
    const membership = teamMembersData?.find(
      (teamMember) => teamMember.userId === currentUser.$id
    );

    if (membership) {
      const membershipId = membership.$id;

      try {
        await teamsClient.deleteMembership(
          id as string,
          membershipId as string
        );

        queryClient.removeQueries({ queryKey: ['teamsList'] });
        router.push('/');
      } catch (error) {
        // Handle error
      }
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
            // const promise = await storage.getFile(
            //   process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
            //   prefs.profileImageId
            // );
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

  const [roleInputState, setRoleInputState] = useState<{ isOpen: boolean }[]>(
    []
  );

  const handleRoleInputClose = (index: number) => {
    const updatedState = [...roleInputState];
    updatedState[index] = { ...updatedState[index], isOpen: false };
    setRoleInputState(updatedState);
  };

  const handleRoleInputOpen = (index: number) => {
    const updatedState = [...roleInputState];
    updatedState[index] = { ...updatedState[index], isOpen: true };
    setRoleInputState(updatedState);
  };

  return (
    <Layout>
      {isOpen && (
        <InviteMemberModal
          defaultRole={teamPreference.defaultRole}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
      {isEditTeamModalOpen && (
        <EditTeamDataModal
          isOpen={isEditTeamModalOpen}
          onClose={closeEditTeamModal}
          teamName={teamPreference?.name}
          teamThemeColor={teamPreference?.bg}
          teamProfileImage={result}
          teamDescription={teamPreference?.description}
          defaultRole={teamPreference?.defaultRole}
        />
      )}
      <Box
        w="full"
        mt={-32}
        pt={16}
        pb={12}
        bgGradient={`linear-gradient(to bottom, ${
          teamPreference.bg
        } 0%, ${tinycolor(teamPreference.bg).darken(20).toString()})`}
        backgroundSize="cover"
      >
        <Flex mx={8} pt={8} align="center">
          {result && (
            <Image
              bgGradient={`linear-gradient(to bottom right, ${
                teamPreference.bg
              } 0%, ${tinycolor(teamPreference.bg)
                .complement()
                .lighten(20)
                .toString()} 100%)`}
              src={result}
              width="240"
              boxShadow="xl"
              height="240"
              maxH="240"
              maxW="240"
              backgroundSize="cover"
              alt="team profile"
              mr={8}
            />
          )}

          <VStack gap={4} align="start">
            <Text fontWeight="extrabold" fontSize="6xl">
              {teamPreference?.name}
            </Text>
            <Text fontWeight="semibold" fontSize="lg">
              {teamPreference.description}
            </Text>
            <Text fontWeight="semibold" fontSize="lg">
              {teamMembersData?.length}{' '}
              {teamMembersData?.length === 1 ? 'Member' : 'Members'}
            </Text>
            <HStack spacing={0} align="center">
              <Button
                leftIcon={
                  <Icon
                    color={getBadgeColor(
                      String(teamPreference.defaultRole) as string
                    )}
                    as={BsCircleFill}
                    boxSize={6}
                  />
                }
                variant="solid"
              >
                Default Role:{' '}
                {teamPreference.defaultRole
                  ? teamPreference.defaultRole
                  : 'member'}
              </Button>
              <Tooltip
                bg="gray.900"
                color="white"
                label="members will be assigned this role by default when they join"
              >
                <Button
                  variant="ghost"
                  _hover={{ bg: 'transparent' }}
                  _focus={{ boxShadow: 'none' }}
                >
                  <BsInfoCircleFill />
                </Button>
              </Tooltip>
            </HStack>
            <Button
              leftIcon={<AiFillEdit size="24px" />}
              variant="solid"
              onClick={openEditTeamModal}
            >
              Edit
            </Button>
          </VStack>
        </Flex>
      </Box>

      <Box px={16} py={8} bg="gray.800">
        <Box mb={8}>
          <Button
            mr={4}
            borderRadius="full"
            bg="white"
            _hover={{ bg: 'white' }}
            color="black"
            onClick={onOpen}
            leftIcon={<AiOutlineUserAdd size="24px" />}
          >
            Invite Member
          </Button>

          <Menu>
            <MenuButton
              as={Button}
              bg="transparent"
              p={0}
              m={0}
              _hover={{ bg: 'transparent', color: 'gray.200' }}
              _active={{ bg: 'transparent' }}
              rightIcon={<AiOutlineEllipsis size="48px" />}
            ></MenuButton>
            <MenuList borderRadius="md" p={2} border="none">
              <MenuItem borderRadius="md">Team Chat</MenuItem>

              <MenuItem
                _hover={{ bg: 'red.500' }}
                borderRadius="md"
                onClick={leaveTeamHandler}
              >
                Leave Team
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>

        <Box mt={8}>
          <HStack>
            <Text fontWeight="bold">
              {teamMembersData?.length}{' '}
              {teamMembersData?.length === 1 ? 'Member' : 'Members'}
            </Text>
          </HStack>
          {teamMembersData &&
            teamMembersData.map((teamMember: any, index: number) => (
              <Flex
                _hover={{ bg: 'gray.700' }}
                align="center"
                my={4}
                px={4}
                py={2}
                borderRadius="md"
                justifyContent="space-between"
                key={teamMember.$id}
              >
                <>
                  <Link href={`/profile/${teamMember.userId}`}>
                    <Flex direction="row" align="center">
                      {teamMembersProfileImages && (
                        <Avatar
                          borderRadius="none"
                          name={teamMember.userName}
                          src={
                            teamMembersProfileImages[
                              teamMember.userId
                            ] as string
                          }
                          mr={4}
                        />
                      )}
                      <VStack align="start">
                        <Text _hover={{ textDecoration: 'underline' }}>
                          {teamMember.userName}
                        </Text>{' '}
                        {teamMember.userId === currentUser.$id && (
                          <Text _hover={{ textDecoration: 'underline' }}>
                            (YOU)
                          </Text>
                        )}
                        <HStack gap={1}>
                          {teamMember.roles.map(
                            (role: string, index: number) => {
                              return (
                                <Badge
                                  mr={2}
                                  key={role}
                                  size="sm"
                                  px={2}
                                  colorScheme="white"
                                  bg={getBadgeColor(role)}
                                  fontSize="sm"
                                >
                                  {role}
                                </Badge>
                              );
                            }
                          )}
                        </HStack>
                      </VStack>
                      {/* Use the appropriate property for the team member's name */}
                    </Flex>
                  </Link>
                  <Flex direction="row" align="center">
                    {!teamMember.confirm && (
                      <Badge colorScheme="yellow" mr={4}>
                        <Flex alignItems="center">
                          <Icon as={MdMail} boxSize={4} mr={1} />
                          Invite Pending
                        </Flex>
                      </Badge>
                    )}
                    {teamMember.userId !== currentUser.$id && (
                      <Tooltip
                        label="direct message"
                        color="white"
                        bg="gray.900"
                      >
                        <Link href={`/team/${id}/dm/${teamMember.userId}`}>
                          <IconButton
                            mr={4}
                            icon={<FiMessageSquare />}
                            aria-label="DM Message"
                          />
                        </Link>
                      </Tooltip>
                    )}
                    {teamMember.roles && owner && (
                      <RoleInput
                        memberRoles={teamMember.roles}
                        memberId={teamMember.$id}
                        isOpen={roleInputState[index]?.isOpen}
                        onClose={() => handleRoleInputClose(index)}
                        onOpen={() => handleRoleInputOpen(index)}
                      />
                    )}
                    <Menu>
                      <MenuButton
                        as={Button}
                        p={0}
                        m={0}
                        bg="transparent"
                        _hover={{ bg: 'transparent', color: 'gray.200' }}
                        _active={{ bg: 'transparent' }}
                        rightIcon={<AiOutlineEllipsis size="48px" />}
                      ></MenuButton>
                      <MenuList borderRadius="md" p={2} border="none">
                        <Link href={`/profile/${teamMember.userId}`}>
                          <MenuItem borderRadius="md">View Profile</MenuItem>
                        </Link>
                        {owner && teamMember.userId !== currentUser.$id && (
                          <MenuItem
                            onClick={() => {
                              cancelMembershipHandler(teamMember.$id);
                            }}
                            _hover={{ bg: 'red.500' }}
                            borderRadius="md"
                          >
                            Remove
                          </MenuItem>
                        )}
                      </MenuList>
                    </Menu>
                  </Flex>
                </>
              </Flex>
            ))}
        </Box>
      </Box>
    </Layout>
  );
}

export default withAuth(Team);
