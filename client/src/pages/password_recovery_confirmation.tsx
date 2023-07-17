import {
  Box,
  Button,
  chakra,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
} from '@chakra-ui/react';
import { Account, Client } from 'appwrite';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { client } from 'utils/appwriteConfig';

const account = new Account(client);

const PasswordResetPage = () => {
  const router = useRouter();
  const { userId, secret } = router.query;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordReset = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const promise = account.updateRecovery(
      userId as string,
      secret as string,
      password,
      password
    );

    promise
      .then((response) => {
        console.log(response); // Success
        setIsResetSuccessful(true);
        setError('');
      })
      .catch((error) => {
        console.log(error); // Failure
        setIsResetSuccessful(false);
        setError('Failed to reset the password. Something went wrong.');
      });
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <Box
      maxW="xl"
      mx="auto"
      px={24}
      py={8}
      mt={12}
      borderRadius="md"
      boxShadow="md"
      bg="black"
    >
      <chakra.h1 fontSize="4xl" mb={8} fontWeight="bold" textAlign="center">
        Password Reset
      </chakra.h1>
      {isResetSuccessful ? (
        <>
          <Text my={4} textAlign="center" color="green.500">
            Password reset successfully! You can now log in using your new
            password.
          </Text>
          <Button
            colorScheme="whatsapp"
            onClick={handleLogin}
            mb={4}
            w="full"
            fontSize="lg"
            borderRadius="md"
            fontWeight="bold"
          >
            Log In
          </Button>
        </>
      ) : (
        <>
          <FormControl id="password" mb={4}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <FormControl id="confirmPassword" mb={6}>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormControl>
          {error && (
            <Text my={4} textAlign="center" color="red.500">
              {error}
            </Text>
          )}
          <Button
            colorScheme="whatsapp"
            onClick={handlePasswordReset}
            mb={4}
            w="full"
            fontSize="lg"
            borderRadius="md"
            fontWeight="bold"
          >
            Reset Password
          </Button>
        </>
      )}
    </Box>
  );
};

export default PasswordResetPage;
