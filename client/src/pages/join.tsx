import { Box, Heading, Text } from '@chakra-ui/react';
import { Teams } from 'appwrite';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { client } from '../../utils/appwriteConfig';

const JoinTeamPage = () => {
  const router = useRouter();
  const { membershipId, userId, secret, teamId } = router.query;
  const [error, setError] = useState('');
  const { fetchAccount, currentUser } = useUser();
  const [info, setInfo] = useState('Joining Team...');
  const [joinExecuted, setJoinExecuted] = useState(false); // Flag to track if joinTeam has been executed

  useEffect(() => {
    const joinTeam = async () => {
      if (!joinExecuted && membershipId && userId && secret && teamId) {
        setJoinExecuted(true); // Set the flag to true to prevent further execution

        const teams = new Teams(client);

        try {
          const response = await teams.updateMembershipStatus(
            teamId as string,
            membershipId as string,
            userId as string,
            secret as string
          );

          setInfo('Team joined successfully.');
          fetchAccount();
        } catch (error) {
          console.error(error); // Log the error for debugging
          setError('Failed to join the team. Please try again.'); // Set the error message
          setInfo('');
        }
      }
    };

    joinTeam(); // Call the joinTeam function
  }, [membershipId, userId, secret, teamId, joinExecuted, fetchAccount]);

  useEffect(() => {
    if (currentUser) {
      router.push(`/team/${teamId}`);
    }
  }, [currentUser, router, teamId]);

  return (
    <Box p={4}>
      {info && (
        <Heading mt={8} textAlign="center">
          {info}
        </Heading>
      )}
      {error && (
        <Box
          mt={4}
          textAlign="center"
          py={2}
          px={4}
          bg="red.500"
          color="white"
          borderRadius="md"
        >
          <Text>{error}</Text>
        </Box>
      )}
    </Box>
  );
};

export default JoinTeamPage;
