import { Box, Center, Flex, Spinner, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const Loader = () => {
  const getRandomJoke = () => {
    const jokes = [
      'Why did the developer go broke? Because he lost his domain in a hackathon!',
      'Why do programmers prefer hackathons? Because they like to "code" their way to success!',
      'What do you call a hackathon that serves donuts? A "code-glazed" event!',
      'Why did the hacker break up with their partner? They weren\'t "encrypt" anymore!',
      'Why did the developer bring a ladder to the hackathon? To "scale" their project!',
      'Why did the coding competition end early? It had a "bug" in the schedule!',
      'What did the hackathon participants say after a successful event? "We nailed it!"',
      'How did the developer prepare for the hackathon? By staying "Java"lized!',
      'Why did the programmer bring a baseball bat to the hackathon? To "code" some home runs!',
      'What did the hackathon organizer say to the participants? "Let\'s hack and roll!"',
    ];
    const randomIndex = Math.floor(Math.random() * jokes.length);
    return jokes[randomIndex];
  };

  const [joke, setJoke] = useState('');

  useEffect(() => {
    setJoke(getRandomJoke());
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Center>
        <Flex direction="column" alignItems="center">
          <Box mb={4}>
            <p className="glitch">
              <span aria-hidden="true">glitch</span>
              glitch
              <span aria-hidden="true">glitch</span>
            </p>
          </Box>
          <Text fontSize="2xl" fontWeight="bold">
            {joke}
          </Text>
        </Flex>
      </Center>
    </div>
  );
};

export default Loader;
