import { Box, Button, Grid, Input, Text, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import tinycolor from 'tinycolor2';
import Layout from '../../../../components/Layout';

// Dummy task data with colors
const tasks = [
  {
    id: 1,
    name: 'Task 1',
    color: '#FF6B6B',
    deadline: '2023-06-15',
    assignedTo: 'John Doe',
    details: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    id: 2,
    name: 'Task 2',
    color: '#48BB78',
    deadline: '2023-06-20',
    assignedTo: 'Jane Smith',
    details:
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    id: 3,
    name: 'Task 3',
    color: '#3182CE',
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

  const generateGradient = (color: string) => {
    const gradientColor1 = tinycolor(color).darken(20).toString();
    const gradientColor2 = tinycolor(color).darken(16).toString();
    return `linear-gradient(to bottom right, ${gradientColor1} 0%, ${gradientColor2} 100%)`;
  };

  return (
    <Layout>
      <Box px={8}>
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>
      <Grid templateColumns="repeat(1,1fr)" gap={4} px={8} py={8}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Box
              key={task.id}
              bgGradient={generateGradient(task.color)}
              p={8}
              borderRadius="md"
              boxShadow="sm"
              width="100%"
              color="white"
            >
              <Text fontWeight="semibold" fontSize="xl" mb={2}>
                {task.name}
              </Text>
              <Text fontWeight="bold" mb={2}>
                Deadline: {task.deadline}
              </Text>
              <Text fontWeight="bold" mb={2}>
                Assigned to: {task.assignedTo}
              </Text>
              <Text>{task.details}</Text>
              <Box mt={4}>
                <Button
                  borderRadius="full"
                  bg="transparent"
                  color="white"
                  border="1px solid white"
                  _hover={{ bg: 'white', color: 'gray.900' }}
                  px={4}
                  py={2}
                >
                  Mark Complete
                </Button>
              </Box>
            </Box>
          ))
        ) : (
          <Text>No tasks found.</Text>
        )}
      </Grid>
    </Layout>
  );
}

export default TeamTasks;
