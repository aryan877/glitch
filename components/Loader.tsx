import { Box, Center, Flex, Spinner, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const Loader = () => {
  const getRandomMessage = () => {
    const messages = [
      'Glitching into the unknown',
      'Embracing the beauty of glitches',
      'Unveiling hidden digital anomalies',
      'Dancing with pixelated glitches',
      'Discovering the art within the error',
      'Creating glitchy wonders',
      'Navigating through the digital distortion',
      'Transforming glitches into art',
      'Unleashing the power of glitched pixels',
      'Embodying the spirit of the glitch',
      'Exploring the glitched dimensions',
      'Embracing imperfections in the matrix',
      'Harnessing the energy of digital glitches',
      'Unlocking the secrets of the glitched code',
      'Transcending the boundaries of the error',
      'Illuminating glitches with creativity',
      'Redefining reality through glitches',
      'Embracing the serendipity of glitches',
      'Unraveling the mysteries of digital imperfections',
      'Creating harmony within the glitched chaos',
    ];
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  };

  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(getRandomMessage());
  }, []);

  return (
    <Center h="100vh">
      <Flex direction="column" alignItems="center">
        <Box mb={4}>
          <p className="glitch">
            <span aria-hidden="true">glitch</span>
            glitch
            <span aria-hidden="true">glitch</span>
          </p>
        </Box>
        <Text size="2xl" fontWeight="bold">
          {message}
        </Text>
      </Flex>
    </Center>
  );
};

export default Loader;
