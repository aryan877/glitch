import { Box, Input, Text, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import Layout from '../../../../components/Layout';

// Dummy task data
const tasks = [
  {
    id: 1,
    name: 'Task 1',
    deadline: '2023-06-15',
    assignedTo: 'John Doe',
    details: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    id: 2,
    name: 'Task 2',
    deadline: '2023-06-20',
    assignedTo: 'Jane Smith',
    details:
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    id: 3,
    name: 'Task 3',
    deadline: '2023-06-25',
    assignedTo: 'Mike Johnson',
    details:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  },
];

function TeamTasks() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks based on search query
  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <Box px={8}>
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>
      <VStack spacing={4} px={8} py={4} align="start">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Box
              key={task.id}
              bg="gray.700"
              p={4}
              borderRadius="md"
              boxShadow="sm"
              width="100%"
            >
              <Text fontWeight="semibold" fontSize="xl" mb={2}>
                {task.name}
              </Text>
              <Text fontWeight="bold" color="gray.200" mb={2}>
                Deadline: {task.deadline}
              </Text>
              <Text fontWeight="bold" color="gray.200" mb={2}>
                Assigned to: {task.assignedTo}
              </Text>
              <Text>{task.details}</Text>
              <Box mt={4}>
                <Text
                  as="button"
                  color="blue.500"
                  fontWeight="bold"
                  textDecoration="underline"
                >
                  Mark Complete
                </Text>
              </Box>
            </Box>
          ))
        ) : (
          <Text>No tasks found.</Text>
        )}
      </VStack>
    </Layout>
  );
}

export default TeamTasks;
