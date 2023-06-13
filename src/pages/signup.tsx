import { Link } from '@chakra-ui/next-js';
import {
  Box,
  Button,
  chakra,
  Divider,
  extendTheme,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  GlobalStyle,
  Input,
  LightMode,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Account, ID } from 'appwrite';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import Layout from '../../components/Layout';
import { useNotification } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import { client } from '../../utils/appwriteConfig';
const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { setCurrentUser, currentUser } = useUser();
  const { showNotification } = useNotification();
  useEffect(() => {
    if (currentUser) {
      router.replace('/');
    }
  }, [currentUser, router]);

  const handleSignUp = () => {
    const account = new Account(client);

    account
      .create(ID.unique(), email, password, username)
      .then(function (response) {
        showNotification('Account created successfully!');
        // Redirect to the login page
        router.push('/login');
      })
      .catch(function (error) {
        console.error(error);
        setError(error.message); // Set the error message
      });
  };

  const handleGithubSignup = () => {
    const account = new Account(client);
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://glitch.zone'
        : 'http://localhost:3000';

    account.createOAuth2Session('github', baseUrl, `${baseUrl}/login`);
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
      bg="white"
      color="gray.800"
    >
      <LightMode>
        <GlobalStyle />
        <chakra.h1 fontSize="4xl" mb={8} fontWeight="bold" textAlign="center">
          Sign Up
        </chakra.h1>
        <Button
          mb={4}
          w="full"
          fontSize="lg"
          borderRadius="md"
          borderWidth={2}
          onClick={handleGithubSignup}
        >
          <FaGithub style={{ marginRight: '0.5em' }} />
          Sign up with Github
        </Button>
        <Flex align="center" justify="center" my={4}>
          <Divider flex="1" />
          <Text mx={2} fontWeight="bold" fontSize="sm">
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
            autoComplete="on"
            focusBorderColor="green.900"
            _autofill={{
              textFillColor: '#000',
              boxShadow: '0 0 0px 1000px #fff inset',
              transition: 'background-color 5000s ease-in-out 0s',
            }}
          />
        </FormControl>

        <FormControl id="password" mb={6}>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="on"
            focusBorderColor="green.900"
            _autofill={{
              textFillColor: '#000',
              boxShadow: '0 0 0px 1000px #fff inset',
              transition: 'background-color 5000s ease-in-out 0s',
            }}
          />
        </FormControl>

        <FormControl id="username" mb={6}>
          <FormLabel>Username</FormLabel>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="on"
            focusBorderColor="green.900"
            _autofill={{
              textFillColor: '#000',
              boxShadow: '0 0 0px 1000px #fff inset',
              transition: 'background-color 5000s ease-in-out 0s',
            }}
          />
        </FormControl>

        <Button
          colorScheme="whatsapp"
          onClick={handleSignUp}
          mb={4}
          w="full"
          fontSize="lg"
          borderRadius="md"
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
          <Text color="gray.500">Already have an account?</Text>
          <Link href="/login">
            <Button variant="link" colorScheme="white">
              Log in
            </Button>
          </Link>
        </Stack>
      </LightMode>
    </Box>
  );
};

export default SignUpPage;
