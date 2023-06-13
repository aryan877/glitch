import { useDisclosure } from '@chakra-ui/hooks';
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputRightElement,
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
import { useUser } from 'context/UserContext';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { client } from 'utils/appwriteConfig';
import withAuth from 'utils/withAuth';
import Layout from '../../../../../components/Layout';

const ReactQuillWithNoSSR = dynamic(() => import('react-quill'), {
  ssr: false,
});

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike', 'code'],
    [
      { list: 'ordered' },
      { list: 'bullet' },
      { indent: '-1' },
      { indent: '+1' },
    ],
    ['link'],
  ],
  clipboard: {
    matchVisual: false,
  },
};

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
  const { currentUser } = useUser();
  const [endDate, setEndDate] = useState<Date | null>(null);

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
        setInputError('Please fill in all required fields.');
        return;
      }

      setInputError(''); // Clear input error

      const teamData = await teamsClient.get(id as string);

      const promise = await account.createJWT();
      const taskData: {
        taskName: string;
        jwt: string;
        taskDescription: string;
        assignee: string;
        taskPriority: string;
        team: string;
        deadline: string | null;
        teamName: string;
        sender: string;
      } = {
        taskName: taskName,
        taskDescription: taskDescription,
        jwt: promise.jwt,
        assignee: assignedTo,
        taskPriority: taskPriority,
        team: id as string,
        deadline: endDate ? endDate.toISOString() : null,
        teamName: teamData.name,
        sender: currentUser.$id,
      };
      setLoading(true);
      await axios.post('/api/createtask', taskData);
      queryClient.invalidateQueries([`teamTasks-${id}`]);
      setLoading(false);
      showNotification('Task added');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      showNotification('could not create task, something went wrong');
      setLoading(false);
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

      const text = response.data.description;
      let typedText = '';

      for (let i = 0; i < text.length; i++) {
        typedText += text.charAt(i);
        setGeneratedDescription(typedText);
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
    } catch (error) {
      console.log(error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box maxW="6xl" mx="auto" my={8} w="50%">
        <VStack spacing={4}>
          <Text textAlign="center" fontWeight="bold" fontSize="2xl">
            Create Task
          </Text>
          <InputGroup>
            <InputRightElement
              pointerEvents="none"
              fontSize="sm"
              color="gray.500"
              mx={2}
            >
              {`${taskName.length}/100`}
            </InputRightElement>
            <Input
              placeholder="Task Name"
              _placeholder={{ color: 'gray.500' }}
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </InputGroup>
          <ReactQuillWithNoSSR
            theme="snow"
            value={taskDescription}
            placeholder="Task Description"
            onChange={(value) => {
              setTaskDescription(value);
            }}
            modules={modules}
            style={{ width: '100%' }}
          />

          <Button
            onClick={handleGenerateDescription}
            bgGradient="linear(to-r, violet, indigo)"
            _hover={{ bgGradient: 'linear(to-r, violet, indigo)' }}
            _active={{ bgGradient: 'linear(to-r, violet, indigo)' }}
            borderRadius="full"
          >
            Generate Description with AI
          </Button>

          <VStack w="full" align="start">
            <Text color="gray.500" fontWeight="bold">
              Set Deadline (optional)
            </Text>
            <DatePicker
              enableTabLoop={false}
              selected={endDate}
              onChange={(date: any) => setEndDate(date)}
              showTimeSelect
              timeIntervals={60}
              dateFormat="yyyy-MM-dd hh:mm aa"
              placeholderText="Set Date and Time"
            />
          </VStack>

          <Select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Assign"
            _placeholder={{ color: 'gray.500' }}
          >
            {teamMembersData &&
              teamMembersData.map((teamMember) => (
                <option key={teamMember.userId} value={teamMember.userId}>
                  {teamMember.userName}
                </option>
              ))}
          </Select>

          <Select
            _placeholder={{ color: 'gray.500' }}
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
            placeholder="Task Priority"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>

          {inputError && <Text color="red">{inputError}</Text>}

          <Button
            mt={8}
            colorScheme="whatsapp"
            onClick={handleTaskSubmit}
            isLoading={loading}
            borderRadius="full"
          >
            Create Task
          </Button>
        </VStack>
      </Box>

      <Modal isCentered isOpen={isOpen} onClose={onClose}>
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
              <>
                <Text my={4} fontWeight="bold">
                  Generated Description:
                </Text>
                <div
                  className="bullet-list"
                  dangerouslySetInnerHTML={{ __html: generatedDescription }}
                />
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button borderRadius="full" onClick={handleModalClose}>
              Use Response
            </Button>
            <Button
              ml={4}
              borderRadius="full"
              // disabled={loading}
              isLoading={loading}
              colorScheme="whatsapp"
              onClick={handleModalSubmit}
            >
              Generate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default withAuth(CreateTaskPage);
