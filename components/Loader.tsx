import { Box, Center, Flex, Spinner, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

const Loader = () => {
  const getRandomQuote = () => {
    const quotes = [
      'The only way to do great work is to love what you do. - Steve Jobs',
      'Success is not the key to happiness. Happiness is the key to success. - Albert Schweitzer',
      'The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt',
      "Believe you can and you're halfway there. - Theodore Roosevelt",
      'The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt',
      'In the middle of every difficulty lies opportunity. - Albert Einstein',
      "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
      'The best way to predict the future is to create it. - Peter Drucker',
      'Success usually comes to those who are too busy to be looking for it. - Henry David Thoreau',
      'The harder I work, the luckier I get. - Samuel Goldwyn',
      'Success is not final, failure is not fatal: It is the courage to continue that counts. - Winston Churchill',
      "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
      'The only place where success comes before work is in the dictionary. - Vidal Sassoon',
      'The best revenge is massive success. - Frank Sinatra',
      'The secret of success is to know something nobody else knows. - Aristotle Onassis',
      "Success is not the absence of failure; it's the persistence through failure. - Aisha Tyler",
      'The secret to success is to know who to blame for your failures. - Larry Wall',
      "Don't aim for success if you want it; just do what you love and believe in, and it will come naturally. - David Frost",
      "Opportunities don't happen. You create them. - Chris Grosser",
      'The road to success and the road to failure are almost exactly the same. - Colin R. Davis',
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  };

  const [quote, setQuote] = useState('');

  useEffect(() => {
    setQuote(getRandomQuote());
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
            {quote}
          </Text>
        </Flex>
      </Center>
    </div>
  );
};

export default Loader;
