import { useDisclosure } from '@chakra-ui/hooks';
import {
  Box,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Account, Teams } from 'appwrite';
import axios from 'axios';
import { useNotification } from 'context/NotificationContext';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { client } from 'utils/appwriteConfig';
import withAuth from 'utils/withAuth';
import Layout from '../../../../../components/Layout';

const ReactQuillWithNoSSR = dynamic(() => import('react-quill'), {
  ssr: false,
});

const CreateTaskPage: React.FC = () => {
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [taskPriority, setTaskPriority] = useState('');
  const queryClient = useQueryClient();
  const teamsClient = new Teams(client);
  const account = new Account(client);
  const router = useRouter();
  const { id } = router.query;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [prompt, setPrompt] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [inputError, setInputError] = useState('');
  const { showNotification } = useNotification();

  const {
    data: teamMembersData,
    isLoading: teamMembersLoading,
    isError: teamMembersError,
    isSuccess: teamMembersSuccess,
  } = useQuery(
    [`teamMembers-${id}`],
    async () => {
      const response = await teamsClient.listMemberships(id as string);
      return response.memberships;
    },
    { staleTime: 3600000, cacheTime: 3600000 }
  );

  const handleTaskSubmit = async (): Promise<void> => {
    try {
      // Input validation
      if (!taskName || !taskDescription || !assignedTo || !taskPriority) {
        setInputError('Please fill in all fields.');
        return;
      }

      setInputError(''); // Clear input error

      const promise = await account.createJWT();
      const taskData: {
        taskName: string;
        jwt: string;
        taskDescription: string;
        assignee: string;
        taskPriority: string;
        team: string;
      } = {
        taskName: taskName,
        taskDescription: taskDescription,
        jwt: promise.jwt,
        assignee: assignedTo,
        taskPriority: taskPriority,
        team: id as string,
      };
      await axios.post('/api/createtask', taskData);
      queryClient.invalidateQueries([`teamTasks-${id}`]);
      showNotification('Task added');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      // @ts-ignore
      showNotification(error?.response.data.error);
    }
  };

  const handleGenerateDescription = async (): Promise<void> => {
    onOpen();
  };

  const handleModalClose = (): void => {
    setPrompt('');
    setTaskDescription(generatedDescription);
    setGeneratedDescription('');
    onClose();
  };

  const handleModalSubmit = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.post('/api/gettaskdescription', { prompt });
      setLoading(false);
      setGeneratedDescription(response.data.description);
    } catch (error) {
      console.log(error);
      // Handle error
    }
  };

  const modules = {
    toolbar: [['bold', 'italic', 'underline']],
  };

  return (
    <Layout>
      <Box mx="auto" my={8} w="50%">
        <VStack spacing={4}>
          <Text textAlign="center" fontWeight="bold" fontSize="2xl">
            Create Task
          </Text>
          <Input
            placeholder="Task Name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
          <ReactQuillWithNoSSR
            value={taskDescription}
            onChange={setTaskDescription}
            placeholder="Task Description"
            modules={modules}
            style={{ width: '100%' }}
          />

          <Button onClick={handleGenerateDescription}>
            Generate Description with AI
          </Button>

          <Select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Assign"
          >
            {teamMembersData &&
              teamMembersData.map((teamMember) => (
                <option key={teamMember.userId} value={teamMember.userId}>
                  {teamMember.userName}
                </option>
              ))}
          </Select>

          <Select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
            placeholder="Task Priority"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>

          {inputError && <Text color="red">{inputError}</Text>}

          <Button mt={8} colorScheme="whatsapp" onClick={handleTaskSubmit}>
            Create Task
          </Button>
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={handleModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate Description with AI</ModalHeader>
          <ModalBody>
            <Textarea
              placeholder="Enter prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
            {generatedDescription && (
              <Text my={4} fontWeight="bold">
                Generated Description:
              </Text>
            )}
            <Text dangerouslySetInnerHTML={{ __html: generatedDescription }} />
          </ModalBody>
          <ModalFooter>
            <Button
              // disabled={loading}
              isLoading={loading}
              colorScheme="whatsapp"
              onClick={handleModalSubmit}
            >
              Generate
            </Button>
            <Button ml={4} onClick={handleModalClose}>
              Use Response
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default withAuth(CreateTaskPage);
