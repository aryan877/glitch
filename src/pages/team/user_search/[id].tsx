import {
  Avatar,
  Box,
  Button,
  Center,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  List,
  ListIcon,
  ListItem,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import {
  AiOutlineEye,
  AiOutlineSearch,
  AiOutlineUser,
  AiOutlineUserAdd,
} from 'react-icons/ai';
import { FaSearch } from 'react-icons/fa';
import { useDebounce } from 'usehooks-ts';
import withAuth from 'utils/withAuth';
import Layout from '../../../../components/Layout';

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);

  const fetchSearchResults = async () => {
    if (debouncedSearchTerm.trim() === '') {
      return []; // Return an empty array if the search term is blank
    }
    const response = await axios.post(`/api/getusers/`, {
      search: debouncedSearchTerm,
    });
    return response.data.users;
  };

  const { data: searchResults, isLoading } = useQuery(
    [`searchResults-${debouncedSearchTerm}`],
    () => fetchSearchResults(), // Wrap fetchSearchResults inside an arrow function
    {
      refetchOnWindowFocus: false,
      initialData: [],
    }
  );

  const handleViewProfile = (userId) => {
    console.log(`View profile for user with ID: ${userId}`);
  };

  const handleAddToTeam = (userId) => {
    console.log(`Add user with ID: ${userId} to the team`);
  };

  return (
    <Layout>
      <Box mx={8} mt={-8} p={4} borderRadius="md">
        <VStack spacing={4} align="flex-start">
          <InputGroup>
            <Input
              placeholder="Search users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outline"
              borderColor="gray.400"
              borderRadius="md"
              size="md"
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px blue.500',
              }}
            />
            <InputRightElement width="4.5rem" pointerEvents="none">
              <AiOutlineSearch size="24px" color="gray" />
            </InputRightElement>
          </InputGroup>

          {searchResults.length === 0 ? (
            <Center w="full">
              <Text>No users to show, search for user to show up</Text>
            </Center>
          ) : (
            <List w="full" spacing={2}>
              {isLoading ? (
                <ListItem>Loading...</ListItem>
              ) : (
                searchResults?.map((user) => (
                  <ListItem
                    w="full"
                    key={user.id}
                    bg="gray.700"
                    borderRadius="md"
                    px={4}
                    py={2}
                    display="flex"
                    alignItems="center"
                  >
                    <Avatar size="sm" name={user.name} mr={2} />
                    <Text color="white">{user.name}</Text>
                    <HStack ml="auto" spacing={4}>
                      <Tooltip label="View Profile" hasArrow>
                        <Button
                          leftIcon={<AiOutlineEye />}
                          cursor="pointer"
                          color="white"
                          fontSize="24px"
                          onClick={() => handleViewProfile(user.id)}
                        />
                      </Tooltip>
                      <Tooltip label="Add to Team" hasArrow>
                        <Button
                          leftIcon={<AiOutlineUserAdd />}
                          cursor="pointer"
                          color="white"
                          fontSize="24px"
                          onClick={() => handleAddToTeam(user.id)}
                        />
                      </Tooltip>
                    </HStack>
                  </ListItem>
                ))
              )}
            </List>
          )}
        </VStack>
      </Box>
    </Layout>
  );
};

export default withAuth(UserSearch);
