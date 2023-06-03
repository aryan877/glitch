import { Image } from '@chakra-ui/next-js';
import {
  Box,
  Button,
  Divider,
  Flex,
  Input,
  Text,
  Textarea,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Account, Avatars, Locale, Storage } from 'appwrite';
import axios from 'axios';
import { isEmpty } from 'lodash';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import tinycolor from 'tinycolor2';
import EditTeamDataModal from '../../../../components/EditTeamDataModal';
import EditUserImageModal from '../../../../components/EditUserImageModal';
import Layout from '../../../../components/Layout';
import { client } from '../../../../utils/appwriteConfig';
import withAuth from '../../../../utils/withAuth';

function EditProfile() {
  // Dummy GitHub user data
  // const [githubUsername, setGithubUsername] = useState('aryankumar877');
  // const [website, setWebsite] = useState('https://example.com');
  // const [country, setCountry] = useState('United States');

  const locale = useMemo(() => new Locale(client), []);
  const storage = useMemo(() => new Storage(client), []);
  const avatars: any = useMemo(() => new Avatars(client), []);
  const account = useMemo(() => new Account(client), []);
  const router = useRouter();
  const { id } = router.query;
  const {
    isOpen: isEditUserModalOpen,
    onOpen: openEditUserModal,
    onClose: closeEditUserModal,
  } = useDisclosure();

  const handleNameUpdate = async () => {
    // Update name logic
    const response = await account.updateName('[NAME]');
  };

  const handleAboutUpdate = () => {
    // Update about logic
    console.log('About updated');
  };

  const handleEmailUpdate = () => {
    // Update email logic
    console.log('Email updated');
  };

  const handleCountryUpdate = () => {
    // Update country logic
    console.log('Country updated');
  };

  const handleGithubUpdate = () => {
    // Update GitHub logic
    console.log('GitHub updated');
  };

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

  const [username, setUsername] = useState<string>('');
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');

  useEffect(() => {
    if (data && isSuccess) {
      setUsername(data.name);
      setGithubUsername(data.prefs.githubUsername);
      setBio(data.prefs.bio);
    }
  }, [data, isSuccess]);

  const {
    data: result = '',
    isLoading: resultLoading,
    isError: resultError,
  } = useQuery(
    [`userProfileImage-${id}`, data],
    async () => {
      try {
        const promise = await storage.getFile(
          process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
          id as string
        );
        const timestamp = Date.now(); // Get the current timestamp
        const imageUrl = storage.getFilePreview(
          process.env.NEXT_PUBLIC_USER_PROFILE_BUCKET_ID as string,
          id as string
        );

        return `${imageUrl.toString()}&timestamp=${timestamp}`;
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
    { staleTime: 600000, cacheTime: 600000 }
  );

  return (
    <Layout>
      {/* Profile Header */}
      {isEditUserModalOpen && data && (
        <EditUserImageModal
          isOpen={isEditUserModalOpen}
          onClose={closeEditUserModal}
          userProfileImage={result}
          userThemeColor={data.prefs.profileColor}
          // teamName={teamPreference?.name}
          // teamThemeColor={teamPreference?.bg}
          // teamProfileImage={result}
          // teamDescription={teamPreference?.description}
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
            <Text fontWeight="bold" fontSize="xl">
              UserName
            </Text>
            <Input placeholder="username" defaultValue={username} />
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
              defaultValue={bio}
              placeholder="Write something about yourself"
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
              Add GitHub
            </Text>
            <Input
              placeholder="github username"
              defaultValue={githubUsername}
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
