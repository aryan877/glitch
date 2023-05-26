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
  fetchAccount: () => void;
}

export const UserContext = createContext<UserContextData>({
  currentUser: null,
  loading: true,
  setCurrentUser: () => {},
  fetchAccount: () => {},
});

export const UserContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<any | null | undefined>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccount = () => {
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
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleSetCurrentUser = (user: any | null) => {
    setCurrentUser(user);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        loading,
        setCurrentUser: handleSetCurrentUser,
        fetchAccount,
      }}
    >
      {loading && <Loader />}
      {loading === false && <>{children}</>}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextData => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserContextProvider');
  }
  return context;
};
