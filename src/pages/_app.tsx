import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
import { UserContextProvider } from '../../context/UserContext';
import theme from '../../theme';
function App({ Component, pageProps }: AppProps) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('chakra-ui-color-mode', 'dark');
  }

  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        {/* Wrap the App component with the UserContextProvider */}
        <UserContextProvider>
          <Component {...pageProps} />
        </UserContextProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}

export default App;
