import { Box, Button } from '@chakra-ui/react';
import React, { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

const Notification = ({ message }: { message: string }) => {
  const { hideNotification } = useContext(NotificationContext);

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      p="4"
      bg="white"
      color="gray.500"
      zIndex="9999"
      borderRadius="md"
      m={4}
    >
      <span>{message}</span>
      <Button onClick={hideNotification} ml="4">
        Dismiss
      </Button>
    </Box>
  );
};

export default Notification;
