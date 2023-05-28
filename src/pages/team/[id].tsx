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
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import {
  AiFillEdit,
  AiFillWechat,
  AiOutlineEllipsis,
  AiOutlineUserAdd,
} from 'react-icons/ai';
import { FiArrowLeft } from 'react-icons/fi';
import { MdMail } from 'react-icons/md';
import tinycolor from 'tinycolor2';
import EditTeamDataModal from '../../../components/EditTeamDataModal';
import InviteMemberModal from '../../../components/InviteMemberModal';
import Layout from '../../../components/Layout';
import { client } from '../../../utils/appwriteConfig';
import withAuth from '../../../utils/withAuth';
function Team() {
  const router = useRouter();
  const { id } = router.query;
  const databases = useMemo(() => new Databases(client), []);
  const avatars: any = useMemo(() => new Avatars(client), []);

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
        staleTime: 6000000,
        cacheTime: 6000000,
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
    { staleTime: 6000000, cacheTime: 6000000 }
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
      console.log(response);
      if (
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
        const promise = await storage.getFile(
          process.env.NEXT_PUBLIC_TEAM_PROFILE_BUCKET_ID as string,
          id as string
        );
        const timestamp = Date.now(); // Get the current timestamp
        const imageUrl = storage.getFilePreview(
          process.env.NEXT_PUBLIC_TEAM_PROFILE_BUCKET_ID as string,
          id as string
        );
        console.log(imageUrl);
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
    { staleTime: 6000000, cacheTime: 6000000 }
  );

  return (
    <Layout>
      {isOpen && <InviteMemberModal isOpen={isOpen} onClose={onClose} />}
      {isEditTeamModalOpen && (
        <EditTeamDataModal
          isOpen={isEditTeamModalOpen}
          onClose={closeEditTeamModal}
          teamName={teamPreference?.name}
          teamThemeColor={teamPreference?.bg}
          teamProfileImage={result}
          teamDescription={teamPreference?.description}
        />
      )}
      <Box
        w="full"
        mt={-32}
        py={8}
        bgGradient={`linear-gradient(to bottom, ${
          teamPreference.bg
        } 0%, ${tinycolor(teamPreference.bg).darken(20).toString()})`}
        backgroundSize="cover"
      >
        <Flex mx={8} pt={32} align="center">
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
              <MenuItem borderRadius="md">Chat</MenuItem>
              <MenuItem borderRadius="md">Leave Team</MenuItem>
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
            teamMembersData.map((teamMember: any) => (
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
                  <Link href={`/profile/${teamMember.$id}`}>
                    <Flex direction="row" align="center">
                      <Avatar
                        borderRadius="none"
                        name={teamMember.userName}
                        src="/path/to/avatar1.jpg"
                        mr={4}
                      />
                      <VStack align="start">
                        <Text _hover={{ textDecoration: 'underline' }}>
                          {teamMember.userName}
                        </Text>{' '}
                        {teamMember.roles.map((role: string, index: number) => {
                          return (
                            <Badge mr={1} key="index" fontSize="sm">
                              {role}
                            </Badge>
                          );
                        })}
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
                        <MenuItem borderRadius="md">Remove</MenuItem>
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
