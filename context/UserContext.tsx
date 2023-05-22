import { Account } from 'appwrite';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import Loader from '../components/Loader';
import { client } from '../utils/appwriteConfig';

export interface UserContextData {
  currentUser: any | null;
  loading: boolean;
  setCurrentUser: (user: any | null) => void;
}

export const UserContext = createContext<UserContextData>({
  currentUser: null,
  loading: true,
  setCurrentUser: () => {},
});

export const UserContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<any | null | undefined>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const account = new Account(client);
    setLoading(true);
    account
      .get()
      .then((response) => {
        setCurrentUser(response);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
        setCurrentUser(undefined);
      });
  }, []);

  const handleSetCurrentUser = (user: any | null) => {
    setCurrentUser(user);
  };

  return (
    <UserContext.Provider
      value={{ currentUser, loading, setCurrentUser: handleSetCurrentUser }}
    >
      {loading && <Loader />}
      {loading === false && <>{children}</>}
    </UserContext.Provider>
  );
};
