import {
  Avatar,
  Box,
  Button,
  Center,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  List,
  ListIcon,
  ListItem,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Account, Avatars, Storage } from 'appwrite';
import axios from 'axios';
import { useNotification } from 'context/NotificationContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import {
  AiOutlineEye,
  AiOutlineSearch,
  AiOutlineUser,
  AiOutlineUserAdd,
} from 'react-icons/ai';
import { FaSearch } from 'react-icons/fa';
import tinycolor from 'tinycolor2';
import { useDebounce } from 'usehooks-ts';
import { client } from 'utils/appwriteConfig';
import withAuth from 'utils/withAuth';
import Layout from '../../../../components/Layout';

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);
  const avatars = useMemo(() => new Avatars(client), []);
  const storage = useMemo(() => new Storage(client), []);
  const queryClient = useQueryClient();
  const account = useMemo(() => new Account(client), []);
  const [userLoading, setUserLoading] = useState({});

  const router = useRouter();
  const { showNotification } = useNotification();
  const { id } = router.query;
  const fetchSearchResults = async () => {
    if (debouncedSearchTerm.trim() === '') {
      return []; // Return an empty array if the search term is blank
    }
    const response = await axios.post(`/api/getusers/`, {
      search: debouncedSearchTerm,
    });
    return response.data.users;
  };

  const { data: searchResults, isLoading } = useQuery(
    [`searchResults-${debouncedSearchTerm}`],
    () => fetchSearchResults(), // Wrap fetchSearchResults inside an arrow function
    {
      refetchOnWindowFocus: false,
      initialData: [],
    }
  );

  const {
    data: searchedUsersProfileImages,
    isLoading: isLoadingSearchedUsersProfileImages,
    isError: isErrorSearchedUsersProfileImages,
    isSuccess: isSuccessSearchedUsersProfileImages,
  } = useQuery(
    [`searchedUserProfileImages`, searchResults],
    async () => {
      console.log(searchResults);
      const userImageUrls: { [key: string]: string } = {};
      for (const user of searchResults) {
        try {
          const profileImageId = user?.prefs.profileImageId;
          if (profileImageId) {
            const imageUrl = storage.getFilePreview(
              process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
              profileImageId
            );
            userImageUrls[user.$id] = imageUrl.toString();
          } else {
            throw new Error('no profile image id');
          }
        } catch (error) {
          // const prefs = userResponse?.data?.prefs;
          const result = avatars.getInitials(
            user.name as string,
            240,
            240,
            tinycolor(user?.prefs?.profileColor).lighten(20).toHex()
          );
          userImageUrls[user.$id] = result.toString();
        }
      }

      return userImageUrls;
    },
    {
      // staleTime: 3600000, cacheTime: 3600000
    }
  );

  const handleAddToTeam = async (userEmail: string) => {
    try {
      setUserLoading((prevState) => ({ ...prevState, [userEmail]: true }));
      const promise = await account.createJWT();
      await axios.post('/api/addtoteam', {
        jwt: promise.jwt,
        team: id as string,
        userEmail,
      });
      showNotification('user added to team');
      queryClient.invalidateQueries([`teamMembers-${id}`]);
      router.replace(`/team/${id}`);
    } catch (error) {
      showNotification('could not add user, something went wrong');
    } finally {
      setUserLoading((prevState) => ({ ...prevState, [userEmail]: false }));
    }
  };

  return (
    <Layout>
      <Box mx={8} mt={-8} p={4} borderRadius="md">
        <VStack spacing={4} align="flex-start">
          <InputGroup>
            <Input
              placeholder="Search users"
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

          {searchResults.length === 0 ? (
            <Center w="full">
              <Text>No users to show, search for user to show up</Text>
            </Center>
          ) : (
            <List w="full" spacing={2}>
              {isLoading ? (
                <ListItem>Loading...</ListItem>
              ) : (
                searchResults?.map((user) => (
                  <ListItem
                    w="full"
                    key={user.$id}
                    bg="gray.700"
                    borderRadius="md"
                    px={4}
                    py={2}
                    display="flex"
                    alignItems="center"
                  >
                    <Link href={`/profile/${user.$id}`}>
                      <HStack spacing={2}>
                        {searchedUsersProfileImages && (
                          <Avatar
                            size="sm"
                            src={searchedUsersProfileImages[user.$id]}
                            name={user.name}
                            mr={2}
                          />
                        )}
                        <Text color="white">{user.name}</Text>
                      </HStack>
                    </Link>
                    <HStack ml="auto" spacing={4}>
                      <Tooltip
                        bg="gray.900"
                        color="white"
                        label="View Profile"
                        hasArrow
                      >
                        <Link href={`/profile/${user.$id}`}>
                          <Button
                            leftIcon={<AiOutlineEye />}
                            cursor="pointer"
                            color="white"
                            fontSize="24px"
                          />
                        </Link>
                      </Tooltip>
                      <Tooltip
                        bg="gray.900"
                        color="white"
                        label="Add to Team"
                        hasArrow
                      >
                        <Button
                          leftIcon={<AiOutlineUserAdd />}
                          cursor="pointer"
                          color="white"
                          fontSize="24px"
                          isLoading={userLoading[user.email]}
                          onClick={() => handleAddToTeam(user.email)}
                        />
                      </Tooltip>
                    </HStack>
                  </ListItem>
                ))
              )}
            </List>
          )}
        </VStack>
      </Box>
    </Layout>
  );
};

export default withAuth(UserSearch);
