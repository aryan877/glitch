import { Center, Spinner, Text } from '@chakra-ui/react';

const Loader = () => {
  return (
    <Center height="100vh">
      <div className="container">
        <p className="glitch">
          <span aria-hidden="true">glitch</span>
          glitch
          <span aria-hidden="true">glitch</span>
        </p>
      </div>
    </Center>
  );
};

export default Loader;
