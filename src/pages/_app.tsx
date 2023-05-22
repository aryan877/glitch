import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
import { NotificationProvider } from '../../context/NotificationContext';
import { UserContextProvider } from '../../context/UserContext';
import theme from '../../theme';

function App({ Component, pageProps }: AppProps) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('chakra-ui-color-mode', 'dark');
  }

  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <NotificationProvider>
          <UserContextProvider>
            <Component {...pageProps} />
          </UserContextProvider>
        </NotificationProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}

export default App;
