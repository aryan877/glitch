import { Box, Button, Text } from '@chakra-ui/react';
import React, { useContext } from 'react';
import { useNotification } from '../context/NotificationContext';

const Notification = ({ message }: { message: string }) => {
  const { hideNotification } = useNotification();

  return (
    <Box
      position="fixed"
      bottom="10"
      left="50%"
      transform="translateX(-50%)"
      p="4"
      w="200"
      bg="blue.500"
      color="white"
      zIndex="9999"
      borderRadius="md"
      m={4}
      textAlign="center"
    >
      <Text fontSize="lg">{message}</Text>
      <Button
        onClick={hideNotification}
        color="white"
        mt="4"
        colorScheme="whiteAlpha"
      >
        Dismiss
      </Button>
    </Box>
  );
};

export default Notification;
