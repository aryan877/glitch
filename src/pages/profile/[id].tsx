import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatars, Locale, Storage } from 'appwrite';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/en'; // Import the desired locale
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import {
  AiFillEdit,
  AiFillEye,
  AiFillStar,
  AiOutlineFork,
  AiOutlineGithub,
  AiOutlineLink,
  AiOutlineUser,
} from 'react-icons/ai';
import { IoIosInformationCircleOutline } from 'react-icons/io';
import tinycolor from 'tinycolor2';
import Layout from '../../../components/Layout';
import { useUser } from '../../../context/UserContext';
import { client } from '../../../utils/appwriteConfig';
import withAuth from '../../../utils/withAuth';
function Profile() {
  // Dummy repository data

  const storage = useMemo(() => new Storage(client), []);
  const avatars: any = useMemo(() => new Avatars(client), []);
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, isError, error } = useQuery(
    [`userData-${id}`],
    async () => {
      try {
        const response = await axios.post('/api/getuser', { userId: id });
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch user');
      }
    },
    { staleTime: 600000, cacheTime: 600000 }
  );

  const {
    data: userStats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    error: errorStats,
  } = useQuery(
    ['userStats'],
    async (username) => {
      try {
        const response = await axios.get(
          `https://api.github.com/users/${data.prefs.githubUsername}`
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch user stats');
      }
    },
    {
      staleTime: 600000,
      cacheTime: 600000,
      enabled: !!data,
    }
  );

  const {
    data: githubData,
    isLoading: isLoadingGithub,
    isError: isErrorGithub,
    error: errorGithub,
  } = useQuery(
    ['userData', data],
    async () => {
      try {
        const response = await axios.get(
          `https://api.github.com/users/${data.prefs.githubUsername}/repos?sort=stars&per_page=10`
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch user repositories');
      }
    },
    {
      staleTime: 600000,
      cacheTime: 600000,
      enabled: !!data,
    }
  );

  const {
    data: result = '',
    isLoading: resultLoading,
    isError: resultError,
  } = useQuery(
    [`userProfileImage-${id}`, data],
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

  // const {
  //   data: userCountryData,
  //   isLoading: isUserCountryLoading,
  //   isError: isUserCountryError,
  //   error: userCountryError,
  // } = useQuery(
  //   [`userCountry-${id}`, id],
  //   async () => {
  //     // Your query logic here
  //     const response = await locale.get();
  //     return response.country;
  //   },
  //   {
  //     staleTime: 3600000,
  //     cacheTime: 3600000,
  //   }
  // );

  // Dummy GitHub user data
  // const githubUsername = 'aryankumar877';
  // const githubFollowers = 100;
  // const githubFollowing = 50;
  // const website = 'https://example.com';
  // const country = 'United States';
  // const joinedDate = 'May 2022';

  return (
    <Layout>
      {/* Profile Header */}
      {data && (
        <Box
          w="full"
          py={8}
          px={8}
          display="flex"
          flexDirection="row"
          bgGradient={`linear(to bottom,  ${
            data.prefs.profileColor || 'gray.500'
          }, gray.800)`}
          mt={-32}
          backgroundSize="cover"
          pt={32}
        >
          <Image
            bgGradient={`linear-gradient(to bottom right, ${
              data.prefs.profileColor || 'gray.300'
            } 0%, ${tinycolor(data.prefs.profileColor || 'gray.300')
              .complement()
              .lighten(20)
              .toString()} 100%)`}
            src={result}
            width="240"
            boxShadow="xl"
            borderRadius="full"
            height="240"
            alt="user profile"
            mr={8}
          />
          {data && (
            <VStack gap={4} align="start">
              <Box>
                <Text mb="-2">Username</Text>
                <Text fontWeight="extrabold" fontSize="4xl">
                  {data.name ? data.name : 'No Username'}
                </Text>
              </Box>
              <Box fontSize="lg">
                <Text>Email</Text> <strong>{data.email}</strong>
              </Box>
              <Flex direction="row">
                {data.prefs.country && (
                  <>
                    <HStack mr={2}>
                      <Text>Country</Text>{' '}
                      <Text fontWeight="extrabold">{data.prefs.country}</Text>
                    </HStack>
                    <Text mx={2}>•</Text>
                  </>
                )}
                <HStack>
                  <Text>Joined</Text>{' '}
                  <Text fontWeight="extrabold">
                    {' '}
                    {dayjs(data.$createdAt).locale('en').format('MMMM YYYY')}
                  </Text>
                </HStack>
              </Flex>
              {currentUser.$id === data.$id && (
                <Link href={`/profile/edit/${id}`}>
                  <Button
                    borderRadius="full"
                    bg="white"
                    _hover={{ bg: 'white' }}
                    color="gray.900"
                    px={8}
                    leftIcon={<AiFillEdit style={{ fontSize: '24px' }} />}
                  >
                    <Text>Edit</Text>
                  </Button>
                </Link>
              )}
            </VStack>
          )}
        </Box>
      )}

      {/* About Me and Links */}
      {data && (
        <VStack align="start" px={8} w="full" gap={8} width="80%">
          (
          <Box>
            <Text fontWeight="bold" fontSize="xl" mb={4}>
              About me
            </Text>
            <Text>
              {data.prefs.bio ? data.prefs.bio : 'user has not set a bio'}
            </Text>
          </Box>
          )
          {/* <Box>
          <Text fontWeight="semibold" fontSize="lg">
            Links
          </Text>
        </Box> */}
          {data.prefs.githubUsername ? (
            <>
              <Box>
                <Text fontWeight="bold" fontSize="xl" mb={4}>
                  Github Stats
                </Text>

                <HStack mb={4}>
                  <Text>Github Profile</Text>
                  <Link
                    href={`https://github.com/${data.prefs.githubUsername}`}
                    passHref
                  >
                    <Text
                      as="a"
                      fontWeight="bold"
                      color="blue.500"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <HStack>
                        <Text>{data.prefs.githubUsername}</Text>{' '}
                        <AiOutlineLink size="24px" />
                      </HStack>
                    </Text>
                  </Link>
                </HStack>

                <Box>
                  {/* <Text>Username: {githubUsername}</Text>
            <Text>Followers: {githubFollowers}</Text>
            <Text>Following: {githubFollowing}</Text> */}
                  {!!userStats && (
                    <HStack spacing={2}>
                      <HStack>
                        <Text>Public Repos</Text>
                        <Text fontWeight="bold">{userStats.public_repos}</Text>
                      </HStack>
                      <Text>•</Text>
                      <HStack>
                        <Text>Followers</Text>
                        <Text fontWeight="bold">{userStats.followers}</Text>
                      </HStack>
                      <Text>•</Text>
                      <HStack>
                        <Text>Following</Text>
                        <Text fontWeight="bold">{userStats.following}</Text>
                      </HStack>
                    </HStack>
                  )}
                </Box>
              </Box>
              <Box w="full">
                <Text mb={4} fontWeight="bold" fontSize="xl" w="full">
                  [GitHub Repositories]
                </Text>
                <Flex alignItems="center" mb={4}>
                  <IoIosInformationCircleOutline color="#666" />

                  <Text fontSize="sm" color="gray.400" ml={2}>
                    Sorted by stars. Top 10 repositories.
                  </Text>
                </Flex>
                {githubData &&
                  githubData.map((repo: any) => (
                    <Box
                      key={repo.name}
                      borderRadius="md"
                      bg="gray.700"
                      p={4}
                      w="full"
                      display="flex"
                      mb={4}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <VStack align="start" gap={2}>
                        <Text fontWeight="bold" fontSize="lg">
                          {repo.name}
                        </Text>
                        <Text mb={4}>
                          {repo.description || 'No description available.'}
                        </Text>
                        <HStack spacing={4}>
                          <Button
                            as="a"
                            href={`https://github.com/${data.prefs.githubUsername}/${repo.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            colorScheme="gray"
                            leftIcon={<AiFillStar />}
                            size="sm"
                            borderRadius="full"
                          >
                            <HStack>
                              <Text>Stars</Text>
                              <Text>{repo.stargazers_count}</Text>
                            </HStack>
                          </Button>
                          <Button
                            as="a"
                            href={`https://github.com/${data.prefs.githubUsername}/${repo.name}/network/members`}
                            target="_blank"
                            rel="noopener noreferrer"
                            colorScheme="blue"
                            leftIcon={<AiFillEye />}
                            size="sm"
                            borderRadius="full"
                          >
                            <HStack>
                              <Text>Watchers</Text>
                              <Text>{repo.watchers_count}</Text>
                            </HStack>
                          </Button>
                          <Button
                            as="a"
                            href={`https://github.com/${data.prefs.githubUsername}/${repo.name}/network/members`}
                            target="_blank"
                            rel="noopener noreferrer"
                            colorScheme="green"
                            leftIcon={<AiOutlineFork />}
                            size="sm"
                            borderRadius="full"
                          >
                            <HStack>
                              <Text>Forks</Text>
                              <Text>{repo.forks_count}</Text>
                            </HStack>
                          </Button>
                          <Button
                            as="a"
                            href={repo.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            colorScheme="teal"
                            leftIcon={<AiOutlineLink />}
                            size="sm"
                            borderRadius="full"
                          >
                            <Text>Live Site</Text>
                          </Button>
                          <Button
                            as="a"
                            href={`https://github.com/${data.prefs.githubUsername}/${repo.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            colorScheme="purple"
                            leftIcon={<AiOutlineGithub />}
                            size="sm"
                            borderRadius="full"
                          >
                            <Text>GitHub</Text>
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  ))}
              </Box>
            </>
          ) : (
            <Box>
              <Text fontWeight="bold" fontSize="xl" mb={4}>
                Github Stats
              </Text>
              <Text mb={4}>user has not added a github account</Text>
            </Box>
          )}
        </VStack>
      )}

      {/* GitHub Repositories */}
    </Layout>
  );
}

export default withAuth(Profile);
