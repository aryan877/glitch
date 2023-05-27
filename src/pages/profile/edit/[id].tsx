import { Image } from '@chakra-ui/next-js';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import tinycolor from 'tinycolor2';
import Layout from '../../../../components/Layout';
import withAuth from '../../../../utils/withAuth';

import {
  AiFillEye,
  AiFillStar,
  AiOutlineFork,
  AiOutlineUser,
} from 'react-icons/ai';

function EditProfile() {
  // Dummy repository data
  const repositories = [
    { name: 'Repo 1', forks: 10, stars: 20, watchers: 30 },
    { name: 'Repo 2', forks: 5, stars: 15, watchers: 25 },
    { name: 'Repo 3', forks: 3, stars: 8, watchers: 12 },
  ];

  // Dummy GitHub user data
  const githubUsername = 'aryankumar877';
  const githubFollowers = 100;
  const githubFollowing = 50;
  const website = 'https://example.com';
  const country = 'United States';
  const joinedDate = 'May 2022';

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
        <VStack spacing={4} align="start">
          <Text fontWeight="extrabold" fontSize="6xl">
            Aryan Kumar
          </Text>
          <Text fontWeight="semibold" fontSize="lg">
            aryankumar877@gmail.com
          </Text>
          <HStack spacing={2}>
            <Text>{githubUsername}</Text>
            <Text>•</Text>
            <Text>Country: India</Text>
            <Text>•</Text>
            <Text>Joined: May 2023</Text>
          </HStack>
          <Button
            borderRadius="full"
            bg="white"
            _hover={{ bg: 'white' }}
            color="gray.900"
            px={8}
          >
            Edit
          </Button>
        </VStack>
      </Box>

      {/* About Me and Links */}
      <VStack align="start" px={8} w="full" gap={8} width="80%">
        <Box>
          <Text fontWeight="bold" fontSize="xl" mb={4}>
            About me
          </Text>
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
            facilisis, nisl a lobortis finibus, ligula enim placerat est, non
            feugiat lacus elit non ante. Fusce eu eleifend magna. Vestibulum
            ultrices lacinia eros, sed ullamcorper purus pharetra nec.
          </Text>
        </Box>
        {/* <Box>
          <Text fontWeight="semibold" fontSize="lg">
            Links
          </Text>
        </Box> */}
        <Box>
          <Text fontWeight="bold" fontSize="xl" mb={4}>
            Github Stats
          </Text>
          <Box>
            {/* <Text>Username: {githubUsername}</Text>
            <Text>Followers: {githubFollowers}</Text>
            <Text>Following: {githubFollowing}</Text> */}
            <HStack spacing={2}>
              <Text colorScheme="teal" size="sm">
                Public Repos: 2
              </Text>
              <Text>•</Text>
              <Text colorScheme="green" size="sm">
                Followers: {githubFollowers}
              </Text>
              <Text>•</Text>
              <Text colorScheme="green" size="sm">
                Following: {githubFollowing}
              </Text>
            </HStack>
          </Box>
        </Box>
        <Box w="full">
          <Text mb={4} fontWeight="bold" fontSize="xl" w="full">
            GitHub Repositories
          </Text>
          {repositories.map((repo) => (
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
                <Text fontWeight="semibold" fontSize="lg">
                  {repo.name}
                </Text>
                <Text mb={4}>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Architecto quam pariatur eligendi repellendus maxime illum
                  saepe corporis fugit neque animi molestiae, temporibus,
                  dolorum debitis libero nam delectus placeat enim expedita?
                </Text>
                <HStack spacing={4}>
                  <Button
                    as="a"
                    href={`https://github.com/${githubUsername}/${repo.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    colorScheme="gray"
                    leftIcon={<AiFillStar />}
                    size="sm"
                    borderRadius="full"
                  >
                    Stars: {repo.stars}
                  </Button>
                  <Button
                    as="a"
                    href={`https://github.com/${githubUsername}/${repo.name}/network/members`}
                    target="_blank"
                    rel="noopener noreferrer"
                    colorScheme="blue"
                    leftIcon={<AiFillEye />}
                    size="sm"
                    borderRadius="full"
                  >
                    Watchers: {repo.watchers}
                  </Button>
                  <Button
                    as="a"
                    href={`https://github.com/${githubUsername}/${repo.name}/network/members`}
                    target="_blank"
                    rel="noopener noreferrer"
                    colorScheme="green"
                    leftIcon={<AiOutlineFork />}
                    size="sm"
                    borderRadius="full"
                  >
                    Forks: {repo.forks}
                  </Button>
                </HStack>
              </VStack>
              {/* <Button
                as="a"
                href={`https://github.com/${githubUsername}/${repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
                colorScheme="teal"
                size="sm"
              >
                View
              </Button> */}
            </Box>
          ))}
        </Box>
      </VStack>

      {/* GitHub Repositories */}
    </Layout>
  );
}

export default withAuth(EditProfile);
