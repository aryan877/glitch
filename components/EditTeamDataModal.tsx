import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Account,
  Databases,
  ID,
  Models,
  Permission,
  Role,
  Storage,
  Teams,
} from 'appwrite';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useCallback, useContext, useState } from 'react';
import Cropper from 'react-easy-crop';
import { AiFillEdit } from 'react-icons/ai';
import { useNotification } from '../context/NotificationContext';
import { client } from '../utils/appwriteConfig';
import getCroppedImg from './cropImage.js';
// Example theme color picker library import
import { HuePicker } from 'react-color';
import { useDropzone } from 'react-dropzone';
import { FiArrowLeft } from 'react-icons/fi';

import { useMemo } from 'react';
interface EditTeamDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamProfileImage: string;
  teamName: string;
  teamDescription: string;
  teamThemeColor: string;
  defaultRole: string;
}

const EditTeamDataModal: React.FC<EditTeamDataModalProps> = ({
  isOpen,
  onClose,
  teamProfileImage,
  teamThemeColor,
  teamDescription,
  teamName,
  defaultRole,
}) => {
  const [name, setName] = useState<string>(teamName);
  const [description, setDescription] = useState<string>(teamDescription);
  const [themeColor, setThemeColor] = useState<string>(teamThemeColor); // Initial theme color
  const [teamDefaultRole, setTeamDefaultRole] = useState<string>(defaultRole);
  const router = useRouter();
  const { id } = router.query;
  const { showNotification } = useNotification();
  const databases = useMemo(() => new Databases(client), []);
  const account = useMemo(() => new Account(client), []);
  const storage = useMemo(() => new Storage(client), []);
  const teamsClient = useMemo(() => new Teams(client), []);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    teamProfileImage
  );
  const queryClient = useQueryClient();
  const [cropMode, setCropMode] = useState<boolean>(false);
  const onDrop = (acceptedFiles: any) => {
    if (acceptedFiles) {
      const file = acceptedFiles[0];
      if (file) {
        setFile(file);
        setImageUrl(URL.createObjectURL(file));
        setCropMode(true);
      }
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragAccept,
    isDragReject,
    isDragActive,
  } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
  });

  const handleTeamNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleTeamDescriptionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDescription(event.target.value);
  };

  const handleThemeColorChange = (color: any) => {
    setThemeColor(color.hex);
  };

  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedArea, setCroppedArea] = useState<any>(null);

  const handleCrop = async () => {
    setCropMode(false);
    const { file, url } = await getCroppedImg(imageUrl, croppedArea);
    setImageUrl(url);
    setFile(file);
  };
  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedArea(croppedAreaPixels);
    },
    []
  );
  const handleSavePreferences = async () => {
    try {
      if (file) {
        const reader = new FileReader();

        reader.onload = async (event) => {
          const binaryFile = event.target?.result;

          if (binaryFile instanceof ArrayBuffer) {
            const blob = new Blob([binaryFile]);
            const convertedFile = new File([blob], file.name, {
              type: file.type,
            });
            setLoading(true);
            const response = await storage.createFile(
              process.env.NEXT_PUBLIC_TEAM_PROFILE_BUCKET_ID as string,
              ID.unique(),
              convertedFile,
              [
                Permission.read(Role.team(id as string)),
                Permission.update(Role.team(id as string)),
                Permission.delete(Role.team(id as string)),
              ]
            );

            const currentDocument = await databases.getDocument(
              process.env.NEXT_PUBLIC_DATABASE_ID as string,
              process.env.NEXT_PUBLIC_TEAMS_COLLECTION_ID as string,
              id as string
            );

            if (currentDocument.teamImage) {
              await storage.deleteFile(
                process.env.NEXT_PUBLIC_TEAM_PROFILE_BUCKET_ID as string,
                currentDocument.teamImage
              );
            }

            const updatedDocument = await databases.updateDocument(
              process.env.NEXT_PUBLIC_DATABASE_ID as string,
              process.env.NEXT_PUBLIC_TEAMS_COLLECTION_ID as string,
              id as string,
              {
                bg: themeColor,
                description: description,
                name: name,
                defaultRole: teamDefaultRole,
                teamImage: response.$id,
              }
            );

            const promise = await account.createJWT();

            await axios.post('/api/updateteamname', {
              jwt: promise.jwt,
              team: id,
              name,
            });

            queryClient.setQueryData(
              [`teamPreferences-${id}`],
              updatedDocument
            );

            queryClient.removeQueries({ queryKey: ['teamPreferencesData'] });
            onClose();
          }
        };

        reader.readAsArrayBuffer(file);
      } else {
        setLoading(true);
        const updatedDocument = await databases.updateDocument(
          process.env.NEXT_PUBLIC_DATABASE_ID as string,
          process.env.NEXT_PUBLIC_TEAMS_COLLECTION_ID as string,
          id as string,
          {
            bg: themeColor,
            description: description,
            name: name,
            defaultRole: teamDefaultRole,
          }
        );

        const promise = await account.createJWT();

        await axios.post('/api/updateteamname', {
          jwt: promise.jwt,
          team: id,
          name,
        });

        queryClient.setQueryData([`teamPreferences-${id}`], updatedDocument);

        queryClient.removeQueries({ queryKey: ['teamPreferencesData'] });
        onClose();
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error saving preferences:', error);
      onClose();
    }
  };

  const handleTeamDefaultRoleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTeamDefaultRole(event.target.value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxH="80vh" overflowY="auto" zIndex="9999" bg="gray.700">
        <ModalHeader>Team Preferences</ModalHeader>
        <ModalBody>
          {cropMode ? (
            <>
              <Button
                onClick={() => {
                  setCropMode(false);
                }}
                w="fit-content"
              >
                <FiArrowLeft />
              </Button>
              <Box
                w="full"
                mt={2}
                bg="gray.900"
                justifyContent="center"
                borderWidth={1}
                alignItems="center"
                cursor="pointer"
                pos="relative"
                minH="200"
                h="200"
              >
                <Box pos="absolute" top="0" left="0" right="0" bottom="0">
                  <Cropper
                    image={imageUrl}
                    crop={crop}
                    zoom={zoom}
                    cropShape="rect"
                    aspect={1 / 1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </Box>
              </Box>
              <Slider
                aria-label="zoom"
                colorScheme="blue"
                value={zoom}
                min={1}
                max={3}
                mt={4}
                step={0.1}
                onChange={(val) => {
                  setZoom(val);
                }}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </>
          ) : (
            <VStack align="flex-start" spacing={4}>
              <Input
                variant="outline"
                color="white"
                placeholder="Team name"
                value={name}
                type="text"
                autoComplete="on"
                onChange={handleTeamNameChange}
              />
              <Input
                variant="outline"
                color="white"
                placeholder="Team description"
                value={description}
                type="text"
                autoComplete="on"
                onChange={handleTeamDescriptionChange}
              />
              <Input
                variant="outline"
                color="white"
                placeholder="Default Role"
                value={teamDefaultRole}
                type="text"
                autoComplete="on"
                onChange={handleTeamDefaultRoleChange}
              />
              <Box py={4}>
                {/* @ts-ignore */}
                <HuePicker
                  color={themeColor}
                  onChange={handleThemeColorChange}
                />
              </Box>
              <Box display="flex" alignItems="center">
                <Text color="white" mr={2}>
                  Theme Color:{' '}
                </Text>
                <Box
                  width={8}
                  height={8}
                  bg={themeColor}
                  borderRadius="md"
                  border="1px solid white"
                />
                <Text color="white" ml={2}>
                  {themeColor}
                </Text>
              </Box>
              <Box
                {...getRootProps()}
                mt={4}
                bg="gray.500"
                borderEndWidth="1"
                // borderRadius="md"
                justifyContent="center"
                borderWidth={1}
                // borderRadius="full"
                borderStyle={isDragActive ? 'dashed' : 'solid'}
                borderColor={
                  isDragAccept
                    ? 'blue.200'
                    : isDragReject
                    ? 'red.500'
                    : 'gray.400'
                }
                alignItems="center"
                cursor="pointer"
                minW="100"
                minH="100"
                // p={4}
                position="relative"
              >
                {imageUrl && (
                  <Image
                    // borderRadius="full"
                    boxShadow="xl"
                    width="100"
                    height="100"
                    src={imageUrl}
                    alt=""
                  />
                )}
                <Box
                  pos="absolute"
                  top="0"
                  left="0"
                  right="0"
                  bottom="0"
                  opacity="0"
                  _hover={{
                    bg: 'rgba(0,0,0, 0.4)',
                    opacity: '1',
                  }}
                  // borderRadius="full"
                >
                  <Flex
                    transform="translate(-50%, -50%)"
                    pos="absolute"
                    top="50%"
                    left="50%"
                    textAlign="center"
                    justifyContent="center"
                    direction="column"
                  >
                    <AiFillEdit color="white" style={{ fontSize: '48px' }} />
                    <Text>Change</Text>
                  </Flex>
                </Box>
                <input
                  type="file"
                  {...getInputProps()}
                  accept="image/*"
                  placeholder="Choose an image"
                />
              </Box>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          {cropMode ? (
            <Button
              bg="white"
              color="gray.800"
              borderRadius="full"
              _hover={{ transform: 'scale(1.05)' }}
              onClick={handleCrop}
            >
              Apply
            </Button>
          ) : (
            <>
              {' '}
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
                onClick={handleSavePreferences}
                isLoading={loading}
              >
                Save
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditTeamDataModal;
