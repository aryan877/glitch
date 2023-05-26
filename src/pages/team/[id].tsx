import { Image } from '@chakra-ui/next-js';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Avatars, Databases, Teams } from 'appwrite';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { AiFillEdit, AiFillWechat, AiOutlineUserAdd } from 'react-icons/ai';
import { FiArrowLeft } from 'react-icons/fi';
import { MdMail } from 'react-icons/md';
import tinycolor from 'tinycolor2';
import EditTeamDataModal from '../../../components/EditTeamDataModal';
import InviteMemberModal from '../../../components/InviteMemberModal';
import Layout from '../../../components/Layout';
import { client } from '../../../utils/appwriteConfig';
import withAuth from '../../../utils/withAuth';
import { queryClient } from '../_app';
function Team() {
  const router = useRouter();
  const { id } = router.query;
  const databases = useMemo(() => new Databases(client), []);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditTeamModalOpen,
    onOpen: openEditTeamModal,
    onClose: closeEditTeamModal,
  } = useDisclosure();
  const teamsClient = useMemo(() => new Teams(client), []);
  const [teamMembers, setTeamMembers] = useState<any>([]);

  //team preferences in db collection
  const { data: teamPreference = { bg: '', description: '' } } = useQuery(
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
    }
  );
  const avatars = useMemo(() => new Avatars(client), []);

  //team api member list
  const {
    data: teamMembersData,
    isLoading: teamMembersLoading,
    isError: teamMembersError,
    isSuccess: teamMembersSuccess,
  } = useQuery([`teamMembers-${id}`], async () => {
    const response = await teamsClient.listMemberships(id as string);
    return response.memberships;
  });

  //team api data
  const {
    data: currentTeamData,
    isLoading: isLoadingTeam,
    isError: isErrorTeam,
    isSuccess: isSuccessTeam,
  } = useQuery(
    [`currentTeam-${id}`],
    async () => {
      const response = await teamsClient.get(id as string);
      return response;
    },
    {
      staleTime: 600000,
    }
  );

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
  }, [id]);

  useEffect(() => {
    if (teamMembersData && teamMembersSuccess) {
      setTeamMembers(teamMembersData);
    }
  }, [teamMembersData, teamMembersSuccess]);

  const {
    data: result = '',
    isLoading: resultLoading,
    isError: resultError,
  } = useQuery(
    [`teamProfileImage-${id}`, currentTeamData?.name, teamPreference.bg],
    () => {
      return avatars.getInitials(
        currentTeamData?.name,
        240,
        240,
        tinycolor(teamPreference.bg).lighten(20).toHex()
      );
    },
    {
      staleTime: 600000,
    }
  );

  return (
    <Layout>
      {isOpen && <InviteMemberModal isOpen={isOpen} onClose={onClose} />}
      {isEditTeamModalOpen && (
        <EditTeamDataModal
          isOpen={isEditTeamModalOpen}
          onClose={closeEditTeamModal}
          teamName={currentTeamData?.name}
          teamThemeColor={teamPreference?.bg}
          teamProfileImage={result.toString()}
          teamDescription={teamPreference?.description}
        />
      )}
      <Box
        w="full"
        h="400px"
        mt={-32}
        bgGradient={`linear-gradient(to bottom, ${
          teamPreference.bg
        } 0%, ${tinycolor(teamPreference.bg).darken(20).toString()})`}
        backgroundSize="cover"
      >
        <Flex mx={8} pt={32} align="center">
          <Image
            bgGradient={`linear-gradient(to bottom right, ${
              teamPreference.bg
            } 0%, ${tinycolor(teamPreference.bg)
              .complement()
              .lighten(20)
              .toString()} 100%)`}
            src={result.toString()}
            width="240"
            boxShadow="xl"
            height="240"
            maxH="240"
            maxW="240"
            alt="team profile"
            mr={8}
          />
          <VStack gap={4} align="start">
            <Text fontWeight="extrabold" fontSize="5xl">
              {currentTeamData?.name}
            </Text>
            <Text fontWeight="semibold" fontSize="lg">
              {teamPreference.description}
            </Text>
            <Text fontWeight="semibold" fontSize="lg">
              {currentTeamData?.total} Members
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
            borderRadius="full"
            bg="white"
            _hover={{ bg: 'white' }}
            color="black"
            onClick={onOpen}
            leftIcon={<AiOutlineUserAdd size="24px" />}
          >
            Invite Member
          </Button>
        </Box>
        <Text fontSize="lg" fontWeight="bold">
          All Members
        </Text>
        <Box>
          {teamMembers.map((teamMember: any) => (
            <Link key={teamMember.$id} href={`/profile/${teamMember.$id}`}>
              <Flex
                _hover={{ bg: 'gray.700' }}
                align="center"
                my={4}
                px={4}
                py={2}
                borderRadius="md"
                justifyContent="space-between"
              >
                <Flex direction="row" align="center">
                  <Avatar
                    borderRadius="none"
                    name={teamMember.userName}
                    src="/path/to/avatar1.jpg"
                    mr={4}
                  />
                  <VStack align="start">
                    <Text>{teamMember.userName}</Text>{' '}
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

                {!teamMember.confirm && (
                  <Badge colorScheme="yellow">
                    <Flex alignItems="center">
                      <Icon as={MdMail} boxSize={4} mr={1} />
                      Invite Pending
                    </Flex>
                  </Badge>
                )}
              </Flex>
            </Link>
          ))}
        </Box>
      </Box>
    </Layout>
  );
}

export default withAuth(Team);
