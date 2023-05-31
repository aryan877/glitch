import { Image } from '@chakra-ui/next-js';
import {
  Box,
  Button,
  Divider,
  Input,
  Text,
  Textarea,
  VStack
} from '@chakra-ui/react';
import React, { useState } from 'react';
import tinycolor from 'tinycolor2';
import Layout from '../../../../components/Layout';
import withAuth from '../../../../utils/withAuth';

function EditProfile() {
  // Dummy repository data
  const repositories = [
    { name: 'Repo 1', forks: 10, stars: 20, watchers: 30 },
    { name: 'Repo 2', forks: 5, stars: 15, watchers: 25 },
    { name: 'Repo 3', forks: 3, stars: 8, watchers: 12 },
  ];

  // Dummy GitHub user data
  const [githubUsername, setGithubUsername] = useState('aryankumar877');
  const [website, setWebsite] = useState('https://example.com');
  const [country, setCountry] = useState('United States');

  const handleNameUpdate = () => {
    // Update name logic
    console.log('Name updated');
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

  return (
    <Layout>
      {/* Profile Header */}
      <Box
        w="full"
        py={8}
        px={8}
        display="flex"
        flexDirection="row"
        bgGradient="linear(to bottom, gray.300, gray.800)"
        mt={-32}
        backgroundSize="cover"
        pt={32}
      >
        <Image
          bgGradient={`linear-gradient(to bottom right, gray.700 0%, ${tinycolor(
            'gray.700'
          )
            .complement()
            .lighten(20)
            .toString()} 100%)`}
          src="/bg.jpeg"
          width="240"
          boxShadow="xl"
          borderRadius="full"
          height="240"
          alt="team profile"
          mr={8}
        />
        {/* <VStack spacing={4} align="start"></VStack> */}
      </Box>

      {/* About Me and Links */}
      <VStack align="start" px={8} gap={4} w="full">
        <Box bg="gray.700" w="full" p={4} borderRadius="md">
          <Text fontWeight="bold" fontSize="xl">
            Name
          </Text>
          <Input defaultValue="Aryan Kumar" />
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
          <Textarea defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam facilisis, nisl a lobortis finibus, ligula enim placerat est, non feugiat lacus elit non ante. Fusce eu eleifend magna. Vestibulum ultrices lacinia eros, sed ullamcorper purus pharetra nec." />
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
            Email
          </Text>
          <Input defaultValue="aryankumar877@gmail.com"  />
          <Button
            mt={4}
            borderRadius="full"
            bg="white"
            _hover={{ bg: 'white' }}
            color="gray.900"
            px={8}
            onClick={handleEmailUpdate}
          >
            Update
          </Button>
        </Box>

        <Box bg="gray.700" w="full" p={4} borderRadius="md">
          <Text fontWeight="bold" fontSize="xl">
            Country
          </Text>
          <Input
            defaultValue={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="country"
          />
          <Button
            mt={4}
            borderRadius="full"
            bg="white"
            _hover={{ bg: 'white' }}
            color="gray.900"
            px={8}
            onClick={handleCountryUpdate}
          >
            Update
          </Button>
        </Box>

        <Box bg="gray.700" w="full" p={4} borderRadius="md">
          <Text fontWeight="bold" fontSize="xl">
            Add GitHub
          </Text>
          <Input placeholder="github username" />
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
    </Layout>
  );
}

export default withAuth(EditProfile);
