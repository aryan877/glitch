import {
  Avatar,
  Box,
  Button,
  chakra,
  Flex,
  Grid,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatars, Databases, Query, Storage, Teams } from 'appwrite';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { Nunito_Sans } from 'next/font/google';
import Head from 'next/head';
import Link from 'next/link';
import { useContext, useEffect, useMemo, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { IoMdAdd } from 'react-icons/io';
import tinycolor from 'tinycolor2';
import { useDebounce } from 'usehooks-ts';
import { default as CreateTeamModal } from '../../components/CreateTeamModal';
import Layout from '../../components/Layout';
import Navbar from '../../components/Navbar';
import { useUser } from '../../context/UserContext';
import { client } from '../../utils/appwriteConfig';
import withAuth from '../../utils/withAuth';
function Home() {
  const { currentUser, loading } = useUser();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);
  // const [teams, setTeams] = useState<any>([]);
  // const [teamPreferencesData, setTeamPreferences] = useState<any>([]);
  // const [teamImages, setTeamImages] = useState<any>([]);
  const teamsClient = useMemo(() => new Teams(client), []);
  const databases = useMemo(() => new Databases(client), []);
  // const queryClient = useQueryClient();
  const avatars = useMemo(() => new Avatars(client), []);
  const storage = useMemo(() => new Storage(client), []);
  const {
    data: teams,
    isLoading,
    isError,
    isSuccess,
  } = useQuery(
    ['teamsList', debouncedSearchTerm],
    async () => {
      if (debouncedSearchTerm) {
        const response = await teamsClient.list(
          [Query.orderDesc('$createdAt')],
          debouncedSearchTerm as string
        );
        return response.teams;
      }
      const response = await teamsClient.list([Query.orderDesc('$createdAt')]);
      return response.teams;
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
    }
  );

  const {
    data: teamPreferencesData,
    isLoading: teamPreferencesLoading,
    isError: teamPreferencesError,
    isSuccess: teamPreferenceSuccess,
  } = useQuery(
    ['teamPreferencesData', teams],
    async () => {
      const preferencesMap: { [key: string]: any } = {};

      //@ts-ignore
      for (const team of teams) {
        try {
          const preference = await databases.getDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID as string,
            process.env.NEXT_PUBLIC_TEAMS_COLLECTION_ID as string,
            team.$id
          );
          preferencesMap[team.$id] = preference;
        } catch (error) {
          console.error('Error fetching team preferences:', error);
          // Handle error for individual request here
        }
      }

      return preferencesMap;
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
      enabled: !!teams,
    }
  );

  const {
    data: teamAvatarData = {},
    isLoading: teamAvatarLoading,
    isError: teamAvatarError,
    isSuccess: teamAvatarSuccess,
  } = useQuery(
    ['teamAvatars', teams, teamPreferencesData],
    async () => {
      const avatarMap: { [key: string]: string } = {};
      //@ts-ignore
      for (const team of teams) {
        try {
          //@ts-ignore
          if (teamPreferencesData[team.$id]?.teamImage) {
            const imageUrl = await storage.getFilePreview(
              process.env.NEXT_PUBLIC_TEAM_PROFILE_BUCKET_ID as string,
              //@ts-ignore
              teamPreferencesData[team.$id]?.teamImage
            );
            avatarMap[team.$id] = imageUrl.toString();
          } else {
            throw new Error('no team image');
          }
        } catch (error) {
          console.error('Error fetching team image from bucket:', error);

          try {
            const avatar = await avatars.getInitials(
              //@ts-ignore
              teamPreferencesData[team.$id]?.name,
              240,
              240,
              //@ts-ignore
              tinycolor(teamPreferencesData[team.$id]?.bg).lighten(20).toHex()
            );
            avatarMap[team.$id] = avatar.toString();
          } catch (error) {
            console.error('Error fetching team avatar:', error);
            // Handle error for individual request here
          }
        }
      }

      return avatarMap;
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
      enabled: !!teamPreferencesData && !!teams,
    }
  );

  // Subscriptions
  // useEffect(() => {
  //   const unsubscribe = client.subscribe('teams', (response) => {
  //     if (response.events.includes('teams.*.create')) {
  //       // queryClient.invalidateQueries(['allTeams']);
  //       queryClient.setQueryData(['teamsList'], (prevData: any) => {
  //         console.log(prevData);
  //         console.log(response.payload);
  //         // const newTeam = response.payload;
  //         // return [newTeam, ...prevData];
  //       });
  //     }
  //   });
  //   return () => {
  //     unsubscribe();
  //   };
  // }, [queryClient]);

  //Subscriptions

  // useEffect(() => {
  //   if (isSuccess && data) {
  //     setTeams(data);
  //   }
  // }, [isSuccess, data]);

  // useEffect(() => {
  //   if (teamPreferenceSuccess && teamPreferencesData) {
  //     setTeamPreferences(teamPreferencesData);
  //   }
  // }, [teamPreferenceSuccess, teamPreferencesData]);

  // useEffect(() => {
  //   if (teamAvatarSuccess && teamAvatarData) {
  //     setTeamImages(teamAvatarData);
  //   }
  // }, [teamAvatarSuccess, teamAvatarData]);

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
            <Text mb={8} fontSize="6xl">
              Welcome to Glitch, powered by{' '}
              <chakra.span color="red.500">Appwrite</chakra.span>
            </Text>
            <Button
              mb={8}
              variant="outline"
              borderRadius="md"
              color="white"
              borderWidth={1}
              _hover={{
                bg: 'black',
                borderColor: 'green.500',
                color: 'green.500',
              }}
              borderColor="white"
              leftIcon={<IoMdAdd size={18} />}
              onClick={onOpen}
            >
              Create New Team
            </Button>
          </Box>

          {
            <InputGroup mb={4}>
              <Input
                placeholder="Search team"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outline"
                borderColor="gray.400"
                borderRadius="md"
                size="md"
              />
              <InputRightElement width="4.5rem" pointerEvents="none">
                <AiOutlineSearch size="24px" color="gray" />
              </InputRightElement>
            </InputGroup>
          }
          {isLoading && <Text my={4}>Loading...</Text>}

          {teams && teams.length === 0 && isSuccess && !searchTerm && (
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
              {teams &&
                teams.map((team: any) => {
                  return (
                    <Link href={`/team/${team.$id}`} key={team.$id}>
                      <Box
                        cursor="pointer"
                        // p={4}
                        mb={2}
                        // borderRadius="md"
                        boxShadow="md"
                        overflow="hidden"
                        // h={200}
                        position="relative" // Add position relative for parent container
                      >
                        {/* Background box */}
                        {
                          <Box
                            bg="black"
                            bgGradient={`linear-gradient(to right, gray.600, ${
                              teamPreferencesData?.[team.$id]?.bg ?? 'gray.900'
                            })`}
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
                              bg: 'black',
                            }}
                          >
                            {teamAvatarData[team.$id] && (
                              <Avatar
                                // key={member.id}

                                src={teamAvatarData[team.$id]}
                                size="md"
                                m={4}
                                marginRight={2}
                              />
                            )}
                            <Box p={4}>
                              <Text fontSize="xl" fontWeight="bold">
                                {teamPreferencesData?.[team.$id]?.name ??
                                  'Fetching...'}
                              </Text>
                              <Text fontSize="sm" mt={2}>
                                <Text>
                                  Created on{' '}
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
                        }

                        {/* Cut-out circle */}
                        {/* <Box
                        position="absolute"
                        bottom={0}
                        right={0}
                        transform="translate(50%, 50%)"
                        w="100px"
                        h="100px"
                        borderRadius="50%"
                        bg={teamPreferencesData[team.$id]?.bg}
                      /> */}
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
