import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  Spacer,
  Text,
} from '@chakra-ui/react';
import { Account } from 'appwrite';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { client } from '../utils/appwriteConfig';

const Navbar = () => {
  const { currentUser, loading, setCurrentUser } = useContext(UserContext);

  const handleLogOut = () => {
    const account = new Account(client);
    const promise = account.deleteSession('current');
    promise.then(
      function (response) {
        setCurrentUser(undefined);
      },
      function (error) {
        console.log(error); // Failure
      }
    );
  };

  return (
    <Flex
      justifyContent="flex-end"
      px={8}
      py={4}
      align="center"
      bg="gray.900"
      color="white"
      w="full"
    >
      <HStack gap={8}>
        <HStack gap={2}>
          <Avatar name="user" src="/avatar-image.jpg" size="md" />
          <Text ml={2} fontWeight="bold">
            {currentUser?.name}
          </Text>
        </HStack>
        <Button
          bg="white"
          colorScheme="whiteAlpha"
          borderRadius="full"
          _hover={{ bg: 'white' }}
          onClick={handleLogOut}
        >
          Logout
        </Button>
      </HStack>
      {/* Add your additional navbar items here */}
    </Flex>
  );
};

export default Navbar;
