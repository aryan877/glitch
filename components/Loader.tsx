import { Center, Spinner, Text } from '@chakra-ui/react';

const Loader = () => {
  return (
    <Center height="100vh">
      <Spinner size="xl" color="green.500" />
      <Text ml={4} fontSize="2xl" fontWeight="bold" color="green.500">
        TStream
      </Text>
    </Center>
  );
};

export default Loader;
