import {
  Box,
  Button,
  Divider,
  Flex,
  Image,
  Input,
  Text,
  Textarea,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Account, Avatars, Locale, Storage } from 'appwrite';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import tinycolor from 'tinycolor2';
import EditTeamDataModal from '../../../../components/EditTeamDataModal';
import EditUserImageModal from '../../../../components/EditUserImageModal';
import Layout from '../../../../components/Layout';
import { useNotification } from '../../../../context/NotificationContext';
import { client } from '../../../../utils/appwriteConfig';
import withAuth from '../../../../utils/withAuth';

function EditProfile() {
  const { showNotification } = useNotification();
  const locale = useMemo(() => new Locale(client), []);
  const storage = useMemo(() => new Storage(client), []);
  const avatars: any = useMemo(() => new Avatars(client), []);
  const account = useMemo(() => new Account(client), []);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = router.query;
  const {
    isOpen: isEditUserModalOpen,
    onOpen: openEditUserModal,
    onClose: closeEditUserModal,
  } = useDisclosure();

  const handleNameUpdate = async () => {
    // Update name logic
    try {
      const response = await account.updateName(username);
      showNotification('Name updated');
      queryClient.refetchQueries([`userData-${id}`]);
    } catch (error) {
      showNotification('updation failed');
    }
  };

  const handleAboutUpdate = async () => {
    try {
      // Update bio logic
      const updatedPrefs = {
        ...data.prefs,
        bio: bio,
      };

      const response = await account.updatePrefs(updatedPrefs);
      showNotification('Bio updated');
      queryClient.refetchQueries([`userData-${id}`]);
    } catch (error) {
      showNotification('Updation failed');
    }
  };
  const {
    data: userCountryData,
    isLoading: isUserCountryLoading,
    isError: isUserCountryError,
    error: userCountryError,
  } = useQuery(
    [`userCountry-${id}`, id],
    async () => {
      // Your query logic here
      const response = await locale.get();
      return response.country;
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
    }
  );

  const handleCountryUpdate = async () => {
    // Update country logic
    try {
      // Update bio logic
      const updatedPrefs = {
        ...data.prefs,
        country: userCountryData,
      };

      const response = await account.updatePrefs(updatedPrefs);
      showNotification('Country updated');
      queryClient.refetchQueries([`userData-${id}`]);
    } catch (error) {
      showNotification('Updation failed');
    }
  };

  const handleGithubUpdate = async () => {
    try {
      // Update bio logic
      const updatedPrefs = {
        ...data.prefs,
        githubUsername: githubUsername,
      };
      const response = await account.updatePrefs(updatedPrefs);
      showNotification('Github updated');
      queryClient.refetchQueries([`userData-${id}`]);
    } catch (error) {
      showNotification('Updation failed');
    }
  };

  const [username, setUsername] = useState<string>('');
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');

  const { data, isLoading, isError, error, isSuccess } = useQuery(
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

  useEffect(() => {
    if (data && isSuccess) {
      setUsername(data.name);
      setGithubUsername(data.prefs.githubUsername);
      setBio(data.prefs.bio);
    }
  }, [data, isSuccess]);

  return (
    <Layout>
      {/* Profile Header */}
      {isEditUserModalOpen && data && (
        <EditUserImageModal
          isOpen={isEditUserModalOpen}
          onClose={closeEditUserModal}
          userProfileImage={result}
          prefs={data.prefs}
        />
      )}
      {data && (
        <Box
          w="full"
          py={8}
          px={8}
          display="flex"
          flexDirection="row"
          bgGradient={`linear(to bottom,${data.prefs.profileColor}, gray.800)`}
          mt={-32}
          backgroundSize="cover"
          pt={32}
          pos="relative"
        >
          {
            <Image
              bgGradient={`linear-gradient(to bottom right, ${
                data.prefs.profileColor
              } 0%, ${tinycolor(data.prefs.profileColor)
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
          }
          <Box
            onClick={openEditUserModal}
            pos="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            opacity="0"
            cursor="pointer"
            _hover={{
              bg: 'rgba(0,0,0, 0.4)',
              opacity: '1',
            }}
            // borderRadius="full"
          >
            <Flex
              transform="translate(-50%, -50%)"
              pos="absolute"
              top="50%"
              left="50%"
              textAlign="center"
              justifyContent="center"
              direction="column"
            >
              <AiFillEdit color="white" style={{ fontSize: '48px' }} />
              <Text>Edit</Text>
            </Flex>
          </Box>
          {/* <VStack spacing={4} align="start"></VStack> */}
        </Box>
      )}

      {/* About Me and Links */}
      {data && (
        <VStack align="start" px={8} gap={4} w="full">
          <Box bg="gray.700" w="full" p={4} borderRadius="md">
            <Text fontWeight="bold" fontSize="xl"></Text>
            <Input
              placeholder="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
            <Button
              mt={4}
              borderRadius="full"
              bg="white"
              _hover={{ bg: 'white' }}
              color="gray.900"
              px={8}
              onClick={handleNameUpdate}
            >
              Update
            </Button>
          </Box>

          <Box bg="gray.700" w="full" p={4} borderRadius="md">
            <Text fontWeight="bold" fontSize="xl">
              About me
            </Text>
            <Textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
              }}
            />
            <Button
              mt={4}
              borderRadius="full"
              bg="white"
              _hover={{ bg: 'white' }}
              color="gray.900"
              px={8}
              onClick={handleAboutUpdate}
            >
              Update
            </Button>
          </Box>

          <Box bg="gray.700" w="full" p={4} borderRadius="md">
            <Text fontWeight="bold" fontSize="xl">
              Country
            </Text>
            {/* <Input defaultValue="India" /> */}
            <Button
              mt={4}
              borderRadius="full"
              bg="white"
              _hover={{ bg: 'white' }}
              color="gray.900"
              px={8}
              onClick={handleCountryUpdate}
            >
              Set Country
            </Button>
          </Box>
          <Box bg="gray.700" w="full" p={4} borderRadius="md">
            <Text fontWeight="bold" fontSize="xl">
              Connect GitHub
            </Text>
            <Input
              placeholder="github username"
              value={githubUsername}
              onChange={(e) => {
                setGithubUsername(e.target.value);
              }}
            />
            <Button
              mt={4}
              borderRadius="full"
              bg="white"
              _hover={{ bg: 'white' }}
              color="gray.900"
              px={8}
              onClick={handleGithubUpdate}
            >
              Add
            </Button>
          </Box>
        </VStack>
      )}
    </Layout>
  );
}

export default withAuth(EditProfile);
