import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { Databases, ID, Permission, Role, Teams } from 'appwrite';
import randomColor from 'randomcolor';
import { useMemo, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { client } from '../utils/appwriteConfig';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [teamName, setTeamName] = useState('');
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const databases = useMemo(() => new Databases(client), []);
  const createTeamHandler = async () => {
    try {
      // Create the team
      showNotification('Created team');
      const teams = new Teams(client);
      const promise = await teams.create(ID.unique(), teamName);
      await databases.createDocument(
        process.env.NEXT_PUBLIC_DATABASE_ID as string,
        process.env.NEXT_PUBLIC_TEAMS_COLLECTION_ID as string,
        promise.$id,
        {
          bg: randomColor({ luminosity: 'dark' }),
          name: teamName,
        },
        [
          Permission.read(Role.team(promise.$id)),
          Permission.update(Role.team(promise.$id)),
        ]
      );
      queryClient.refetchQueries(['teamsList']);
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleTeamNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTeamName(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      createTeamHandler();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent zIndex="9999" bg="blue.500">
        <ModalHeader>Create New Team</ModalHeader>

        <ModalBody>
          <Text mb={4} color="white" fontSize="sm">
            {`Please enter the name of the team and click "Create" to create the team`}
          </Text>
          <Input
            variant="outline"
            color="white"
            _placeholder={{ color: 'white' }}
            placeholder="Enter team name"
            value={teamName}
            onChange={handleTeamNameChange}
            onKeyDown={handleKeyDown}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant="unstyled"
            mr={4}
            onClick={onClose}
            _hover={{ transform: 'scale(1.05)' }}
          >
            Cancel
          </Button>
          <Button
            bg="white"
            color="gray.800"
            borderRadius="full"
            _hover={{ transform: 'scale(1.05)' }}
            onClick={createTeamHandler}
            isDisabled={teamName.length === 0}
          >
            Create Team
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateTeamModal;
