import {
  Box,
  Button,
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ID, Models, Permission, Role, Storage } from 'appwrite';
import { useRouter } from 'next/router';
import React, { useCallback, useMemo, useState } from 'react';
import { AiOutlineFile } from 'react-icons/ai';
import { useUser } from '../context/UserContext';
import { client } from '../utils/appwriteConfig';

interface TaskNoteFileSenderProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | undefined;
  sendFileMessage: (fileId: string) => void;
}

const TaskNoteFileSender: React.FC<TaskNoteFileSenderProps> = ({
  isOpen,
  onClose,
  file,
  sendFileMessage,
}) => {
  const storage = useMemo(() => new Storage(client), []);
  const [loading, setLoading] = useState<boolean>(false);
  const { currentUser } = useUser();
  const formatFileSize = useCallback((fileSizeInBytes: number): string => {
    const units = ['bytes', 'KB', 'MB', 'GB'];
    let size = fileSizeInBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }, []);

  const router = useRouter();
  const { id } = router.query;

  const sendFileMessageHandler = async () => {
    try {
      let response: Models.File | undefined;
      if (file) {
        const binaryFile = await new Promise<ArrayBuffer | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) =>
            resolve(event.target?.result as ArrayBuffer | null);
          reader.readAsArrayBuffer(file);
        });

        if (binaryFile instanceof ArrayBuffer) {
          const blob = new Blob([binaryFile]);
          const convertedFile = new File([blob], file.name, {
            type: file.type,
          });
          setLoading(true);

          let permissions = [
            Permission.read(Role.team(id as string)),
            Permission.update(Role.user(currentUser.$id as string)),
            Permission.delete(Role.user(currentUser.$id as string)),
          ];
          response = await storage.createFile(
            process.env.NEXT_PUBLIC_TASK_NOTES_FILES_BUCKET_ID as string,
            ID.unique(),
            convertedFile,
            permissions
          );
          onClose();
        }
      }
      if (response && response.$id) {
        sendFileMessage(response.$id as string);
      }
    } catch (error) {
      // Handle error
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxH="80vh" overflowY="auto" zIndex="99" bg="gray.700">
        <ModalHeader>Send File</ModalHeader>
        <ModalBody color="white">
          <Flex alignItems="center" mb={4}>
            <Box borderRadius="md" p={2} bg="whatsapp.500" color="white" mr={4}>
              <Icon as={AiOutlineFile} boxSize={6} />
            </Box>
            <VStack align="start">
              {file && <Text fontSize="xl">{file.name}</Text>}
              {file && (
                <Text fontSize="xl" color="whatsapp.500">
                  {formatFileSize(file.size)}
                </Text>
              )}
            </VStack>
          </Flex>
          <Button
            onClick={sendFileMessageHandler}
            variant="solid"
            colorScheme="whatsapp"
            size="lg"
            w="full"
            disabled={loading}
          >
            {loading ? 'Uploading file...' : 'Send'}
          </Button>
        </ModalBody>
        <ModalFooter></ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TaskNoteFileSender;
