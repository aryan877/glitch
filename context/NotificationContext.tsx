import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import Notification from '../components/Notification';

interface NotificationContextData {
  showNotification: (message: string) => void;
  hideNotification: () => void;
}

export const NotificationContext = createContext<NotificationContextData>({
  showNotification: () => {},
  hideNotification: () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(hideNotification, 4000); // Hide notification after 4 seconds
      return () => clearTimeout(timer); // Clear the timer if component unmounts or notification changes
    }
  }, [notification]);

  return (
    <NotificationContext.Provider
      value={{ showNotification, hideNotification }}
    >
      {children}
      {notification && <Notification message={notification} />}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextData => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};
