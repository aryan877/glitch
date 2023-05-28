import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Account, Avatars, Databases, Storage } from 'appwrite';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useMemo } from 'react';
import { BsBellFill } from 'react-icons/bs';
import { FiArrowLeft } from 'react-icons/fi';
import tinycolor from 'tinycolor2';
import { UserContext, useUser } from '../context/UserContext';
import { client } from '../utils/appwriteConfig';
const Navbar = ({ flexWidth }: { flexWidth: number }) => {
  const { currentUser, loading, setCurrentUser } = useUser();
  const storage = useMemo(() => new Storage(client), []);
  const avatars: any = useMemo(() => new Avatars(client), []);
  const router = useRouter();
  const { id } = router.query;
  const darkButtonRoutes = useMemo(
    () => ['/team/[id]', '/profile/[id]', '/profile/edit/[id]'],
    []
  );
  const databases = useMemo(() => new Databases(client), []);
  const { data: teamPreference = { bg: '', description: '', name: '' } } =
    useQuery(
      [`teamPreferences-${id}`],
      async () => {
        try {
          const response = await databases.getDocument(
            process.env.NEXT_PUBLIC_DATABASE_ID as string,
            process.env.NEXT_PUBLIC_TEAMS_COLLECTION_ID as string,
            id as string
          );
          return response;
        } catch (error) {
          console.error('Error fetching team preferences:', error);
          throw error;
        }
      },
      {
        staleTime: 3600000,
        cacheTime: 3600000,
      }
    );

  const {
    data: result = '',
    isLoading: resultLoading,
    isError: resultError,
  } = useQuery(
    [`teamProfileImage-${id}`, teamPreference],
    async () => {
      try {
        const promise = await storage.getFile(
          process.env.NEXT_PUBLIC_TEAM_PROFILE_BUCKET_ID as string,
          id as string
        );
        const timestamp = Date.now(); // Get the current timestamp
        const imageUrl = storage.getFilePreview(
          process.env.NEXT_PUBLIC_TEAM_PROFILE_BUCKET_ID as string,
          id as string
        );
        console.log(imageUrl);
        return `${imageUrl.toString()}&timestamp=${timestamp}`;
      } catch (error) {
        const result = avatars.getInitials(
          teamPreference.name as string,
          240,
          240,
          tinycolor(teamPreference.bg).lighten(20).toHex()
        );
        return result.toString();
      }
    },
    {
      staleTime: 3600000,
      cacheTime: 3600000,
    }
  );

  const isDarkButtonRoute = useMemo(() => {
    return darkButtonRoutes.some((route) => router.pathname.startsWith(route));
  }, [darkButtonRoutes, router.pathname]);

  const handleLogOut = () => {
    const account = new Account(client);
    const promise = account.deleteSession('current');
    promise.then(
      function (response) {
        setCurrentUser(undefined);
      },
      function (error) {
        console.log(error);
      }
    );
  };

  const goBack = () => {
    router.back();
  };

  return (
    <Flex
      justifyContent="space-between"
      pr={4}
      align="center"
      bg={isDarkButtonRoute ? 'transparent' : 'gray.800'}
      color="white"
      h="16"
      w={`calc(100% - ${flexWidth}px)`}
      right="0"
      zIndex="9999999"
      pos="fixed"
    >
      <HStack>
        {router.pathname !== '/' && (
          <Tooltip label="Go Back" color="white">
            <IconButton
              ml={8}
              aria-label="Go Back"
              icon={<FiArrowLeft />}
              onClick={goBack}
              bg="gray.800"
              _hover={{ bg: 'gray.700' }}
              _active={{ bg: 'gray.700' }}
              borderRadius="full"
              color="white"
            />
          </Tooltip>
        )}
        {router.pathname.startsWith('/team/chat/[id]') && (
          <Link href={`/team/${id}`}>
            <HStack ml={4}>
              <Avatar
                borderWidth={2}
                borderColor={teamPreference.bg}
                h="10"
                w="10"
                src={result}
                mr={2}
              />
              <Text color="white">Team {teamPreference?.name}</Text>
            </HStack>
          </Link>
        )}
      </HStack>
      {!isDarkButtonRoute && <Spacer />}
      <HStack gap={4}>
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="notifications"
            icon={
              <Flex position="relative">
                <BsBellFill size="24px" />
                {21 > 0 && (
                  <Box
                    position="absolute"
                    top="0px"
                    right="-4px"
                    px={2}
                    py={1}
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                    transform="translate(50%, -50%)"
                  >
                    2
                  </Box>
                )}
              </Flex>
            }
            bg="gray.800"
            _hover={{ bg: 'gray.700' }}
            _active={{ bg: 'gray.700' }}
            variant="outline"
            border="none"
            size="md"
            borderRadius="full"
          />
          <MenuList p={2} border="none" borderRadius="md">
            <MenuItem borderRadius="md">
              <Image
                src="/notification_logo.svg"
                alt="notification logo"
                h="10"
                mr={2}
              ></Image>
              Av joined Team Blockwave
            </MenuItem>
            <MenuItem borderRadius="md">
              <Image
                src="/notification_logo.svg"
                alt="notification logo"
                h="10"
                mr={2}
              ></Image>
              John completed his assigned task in Blockwave
            </MenuItem>

            <MenuItem borderRadius="md">
              {' '}
              <Image
                src="/notification_logo.svg"
                alt="notification logo"
                h="10"
                mr={2}
              ></Image>
              A task was assigned to you
            </MenuItem>
          </MenuList>
        </Menu>
        <Menu>
          <MenuButton
            as={Button}
            borderRadius="full"
            bg={!isDarkButtonRoute ? 'transparent' : 'gray.800'}
            variant="styled"
            colorScheme="gray"
          >
            <HStack gap={2}>
              <Avatar name="aryan" size="sm" />
              <Text ml={4} fontWeight="bold" color="white">
                {currentUser?.name}
              </Text>
            </HStack>
          </MenuButton>
          <MenuList p={2} border="none" borderRadius="md">
            <Link href={`/profile/${currentUser.$id}`}>
              <MenuItem borderRadius="md">Profile</MenuItem>
            </Link>
            <MenuItem onClick={handleLogOut} borderRadius="md">
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

export default Navbar;
