import {
  Avatar,
  Box,
  Button,
  Flex,
  Grid,
  Image,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Avatars, Databases, Query, Teams } from 'appwrite';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { isEmpty } from 'lodash';
import { Nunito_Sans } from 'next/font/google';
import Head from 'next/head';
import Link from 'next/link';
import { useContext, useEffect, useMemo, useState } from 'react';
import { IoMdAdd } from 'react-icons/io';
import tinycolor from 'tinycolor2';
import { default as CreateTeamModal } from '../../components/CreateTeamModal';
import Layout from '../../components/Layout';
import Navbar from '../../components/Navbar';
import { useUser } from '../../context/UserContext';
import { client } from '../../utils/appwriteConfig';
import withAuth from '../../utils/withAuth';
import { queryClient } from './_app';
const nunito = Nunito_Sans({ subsets: ['latin'] });

function Home() {
  const { currentUser, loading } = useUser();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [teams, setTeams] = useState<any>([]);
  const [teamPreferences, setTeamPreferences] = useState<any>([]);
  const [teamImages, setTeamImages] = useState<any>([]);
  const teamsClient = useMemo(() => new Teams(client), []);
  const databases = useMemo(() => new Databases(client), []);

  const { data, isLoading, isError, isSuccess } = useQuery(
    ['allTeams'],
    async () => {
      const response = await teamsClient.list([Query.orderDesc('$createdAt')]);
      return response.teams;
    },
    {
      staleTime: 20000,
    }
  );

  const {
    data: teamPreferencesData,
    isLoading: teamPreferencesLoading,
    isError: teamPreferencesError,
    isSuccess: teamPreferenceSuccess,
  } = useQuery(
    ['teamPreferences', teams],
    async () => {
      const teamPreferencePromises = teams.map((team: any) =>
        databases.getDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TEAMS_COLLECTION_ID as string,
          team.$id
        )
      );
      const results = await Promise.allSettled(teamPreferencePromises);
      const preferencesMap: { [key: string]: any } = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const preference = result.value;
          preferencesMap[teams[index].$id] = preference;
        } else {
          console.error('Error fetching team preferences:', result.reason);
          // Handle error for individual promise here
        }
      });
      return preferencesMap;
    },
    {
      staleTime: 600000,
      cacheTime: 600000,
      enabled: teams.length > 0, // Only fetch preferences when teams have been loaded
    }
  );

  const {
    data: teamAvatarData,
    isLoading: teamAvatarLoading,
    isError: teamAvatarError,
    isSuccess: teamAvatarSuccess,
  } = useQuery(
    ['teamAvatars', teams, teamPreferences],
    async () => {
      if (isEmpty(teamPreferences) || isEmpty(teams)) {
        return;
      }
      const avatarPromises = teams.map((team: any) =>
        avatars.getInitials(
          team.name,
          240,
          240,
          tinycolor(teamPreferences[team.$id]?.bg).lighten(20).toHex()
        )
      );
      const avatarResults = await Promise.allSettled(avatarPromises);
      const avatarMap: { [key: string]: string } = {};
      avatarResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const avatar = result.value.toString();
          console.log(avatar);
          avatarMap[teams[index].$id] = avatar;
        } else {
          console.error('Error fetching team avatar:', result.reason);
          // Handle error for individual promise here
        }
      });
      return avatarMap;
    },
    {
      staleTime: 600000,
      cacheTime: 600000,
      enabled: teams.length > 0, // Only fetch avatars when teams have been loaded
    }
  );

  //Subscriptions
  useEffect(() => {
    const unsubscribe = client.subscribe('teams', (response) => {
      if (response.events.includes('teams.*.create')) {
        // queryClient.invalidateQueries(['allTeams']);
        queryClient.setQueryData(['allTeams'], (prevData: any) => {
          const newTeam = response.payload;
          return [newTeam, ...prevData];
        });
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);
  const avatars = useMemo(() => new Avatars(client), []);
  //Subscriptions

  useEffect(() => {
    if (isSuccess && data) {
      setTeams(data);
    }
  }, [isSuccess, data]);

  useEffect(() => {
    if (teamPreferenceSuccess && teamPreferencesData) {
      setTeamPreferences(teamPreferencesData);
    }
  }, [teamPreferenceSuccess, teamPreferencesData]);

  useEffect(() => {
    if (teamAvatarSuccess && teamAvatarData) {
      setTeamImages(teamAvatarData);
    }
  }, [teamAvatarSuccess, teamAvatarData]);

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <CreateTeamModal isOpen={isOpen} onClose={onClose} />
        <Flex direction="column" mx={8} align="flex-start">
          <Box>
            <Button
              mb={16}
              variant="outline"
              borderRadius="md"
              color="white"
              borderWidth={1}
              _hover={{
                bg: 'transparent',
              }}
              borderColor="white"
              leftIcon={<IoMdAdd size={18} />}
              onClick={onOpen}
            >
              Create New Team
            </Button>
          </Box>
          {isLoading && <Text>Loading...</Text>}
          {teams.length === 0 && isSuccess && (
            <Box height="full" alignItems="center" justifyContent="flex-start">
              <Text fontSize="xl" fontWeight="bold" color="gray.200">
                You have no teams
              </Text>
              <Text mt={2} color="gray.200">
                Create a new team from above or join a team
              </Text>
            </Box>
          )}
          {!isLoading && (
            <Grid
              w="full"
              templateColumns="repeat(1, minmax(0px, 1fr))"
              gap={0}
            >
              {teams.map((team: any) => {
                return (
                  <Link href={`/team/${team.$id}`} key={team.$id}>
                    <Box
                      cursor="pointer"
                      // p={4}
                      // borderRadius="md"
                      boxShadow="md"
                      overflow="hidden"
                      // h={200}
                      position="relative" // Add position relative for parent container
                    >
                      {/* Background box */}
                      <Box
                        bg="gray.700"
                        // position="absolute"
                        // top={0}
                        // left={0}
                        // right={0}
                        // bottom={0}
                        // borderRadius="md"
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        transition="background-color 0.2s ease"
                        _hover={{
                          bg: 'gray.600',
                        }}
                      >
                        {teamImages[team.$id] && (
                          <Avatar
                            // key={member.id}
                            name="w"
                            src={teamImages[team.$id]}
                            size="md"
                            m={4}
                            marginRight={2}
                          />
                        )}
                        <Box p={4}>
                          <Text fontSize="xl" fontWeight="bold">
                            {team.name}
                          </Text>
                          <Text fontSize="sm" mt={2}>
                            <Text>
                              {dayjs(team.$createdAt).format(
                                'MMM D, YYYY hh:mm A'
                              )}
                            </Text>
                          </Text>
                        </Box>
                        <Flex mt={4}>
                          {/* {project.members.map((member: any) => (
                        <Avatar
                          key={member.id}
                          name={member.name}
                          src={member.avatar}
                          size="sm"
                          marginRight={2}
                        />
                      ))} */}
                        </Flex>
                      </Box>

                      {/* Cut-out circle */}
                      <Box
                        position="absolute"
                        bottom={0}
                        right={0}
                        transform="translate(50%, 50%)"
                        w="100px"
                        h="100px"
                        borderRadius="50%"
                        bg={teamPreferences[team.$id]?.bg}
                      />
                    </Box>
                  </Link>
                );
              })}
            </Grid>
          )}
        </Flex>
      </Layout>
    </>
  );
}

export default withAuth(Home);
