import { Link } from '@chakra-ui/next-js';
import {
  Box,
  Button,
  chakra,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Account, ID } from 'appwrite';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { UserContext } from '../../context/UserContext';
import { client } from '../../utils/appwriteConfig';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { setCurrentUser, currentUser } = useContext(UserContext);

  useEffect(() => {
    if (currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  const handleSignUp = () => {
    const account = new Account(client);

    const result = account.create(ID.unique(), email, password, username);

    result.then(
      function (response) {
        account.get().then((accountResponse) => {
          setCurrentUser(accountResponse);
          router.push('/');
        });
        // Clear input fields and error message
      },
      function (error) {
        console.log(error);
        setError(error.message); // Set the error message
      }
    );
  };

  const handleGithubSignup = () => {
    const account = new Account(client);
    account.createOAuth2Session(
      'github',
      'http://localhost:3000',
      'http://localhost:3000/login'
    );
  };

  return (
    <Box
      maxW="xl"
      mx="auto"
      my={12}
      px={24}
      py={8}
      borderRadius="md"
      boxShadow="md"
      bg="gray.700"
    >
      <chakra.h1 fontSize="4xl" mb={8} fontWeight="bold" textAlign="center">
        Sign Up
      </chakra.h1>
      <Button
        colorScheme="transparent"
        mb={4}
        w="full"
        borderRadius="full"
        color="green.500"
        borderWidth="1px"
        borderColor="green.500"
        onClick={handleGithubSignup}
      >
        <FaGithub style={{ marginRight: '0.5em' }} />
        Sign up with Github
      </Button>
      <Flex align="center" justify="center" my={4}>
        <Divider flex="1" />
        <Text mx={2} color="gray.300" fontWeight="bold" fontSize="sm">
          or
        </Text>
        <Divider flex="1" />
      </Flex>
      <FormControl id="email" mb={4}>
        <FormLabel>Email address</FormLabel>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormControl>
      <FormControl id="password" mb={6}>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormControl>
      <FormControl id="username" mb={6}>
        <FormLabel>Username</FormLabel>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </FormControl>
      <Button
        colorScheme="whatsapp"
        onClick={handleSignUp}
        mb={4}
        w="full"
        borderRadius="full"
        fontWeight="bold"
      >
        Sign Up
      </Button>
      {error && (
        <Text my={4} textAlign="center" color="red.500">
          {error}
        </Text>
      )}
      <Stack direction="row" spacing={2} my={8} justifyContent="center">
        <Text color="gray.300">Already have an account?</Text>
        <Link href="/login">
          <Button variant="link" colorScheme="white">
            Log in
          </Button>
        </Link>
      </Stack>
    </Box>
  );
};

export default SignUpPage;
