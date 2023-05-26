import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { AppProps } from 'next/app';
import { NotificationProvider } from '../../context/NotificationContext';
import { SidebarProvider } from '../../context/SidebarContext';
import { UserContextProvider } from '../../context/UserContext';
import theme from '../../theme';

export const queryClient = new QueryClient();

function App({ Component, pageProps }: AppProps) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('chakra-ui-color-mode', 'dark');
  }
  return (
    <QueryClientProvider client={queryClient}>
      <CacheProvider>
        <ChakraProvider theme={theme}>
          <SidebarProvider>
            <NotificationProvider>
              <UserContextProvider>
                <Component {...pageProps} />
              </UserContextProvider>
            </NotificationProvider>
          </SidebarProvider>
        </ChakraProvider>
      </CacheProvider>
      {/* <ReactQueryDevtools initialIsOpen /> */}
    </QueryClientProvider>
  );
}

export default App;
