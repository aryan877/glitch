import {
  Box,
  Button,
  chakra,
  FormControl,
  FormLabel,
  Input,
  Text,
} from '@chakra-ui/react';
import { Account, Client } from 'appwrite';
import axios from 'axios';
import { useState } from 'react';
import { client } from 'utils/appwriteConfig';

const account = new Account(client);

const PasswordRecoveryPage = () => {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://appwrite-five.vercel.app'
      : 'http://localhost:3000';

  const handlePasswordRecovery = () => {
    const promise = account.createRecovery(
      email,
      `${baseUrl}/password_recovery_confirmation/`
    );

    promise
      .then((response) => {
        console.log(response); // Success
        setIsEmailSent(true);
        setError('');
      })
      .catch((error) => {
        console.log(error); // Failure
        setIsEmailSent(false);
        setError(
          'Failed to send the password recovery email. Please try again.'
        );
      });
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
        Password Recovery
      </chakra.h1>
      {isEmailSent ? (
        <Text my={4} textAlign="center" color="green.500">
          Password recovery email has been sent to your email address.
        </Text>
      ) : (
        <>
          <FormControl id="email" mb={4}>
            <FormLabel>Email address</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          {error && (
            <Text my={4} textAlign="center" color="red.500">
              {error}
            </Text>
          )}
          <Button
            colorScheme="whatsapp"
            onClick={handlePasswordRecovery}
            mb={4}
            w="full"
            fontSize="lg"
            borderRadius="md"
            fontWeight="bold"
          >
            Recover Password
          </Button>
        </>
      )}
    </Box>
  );
};

export default PasswordRecoveryPage;
