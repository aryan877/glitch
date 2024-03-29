import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { AppProps } from 'next/app';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { NotificationProvider } from '../../context/NotificationContext';
import { SidebarProvider } from '../../context/SidebarContext';
import { UserContextProvider } from '../../context/UserContext';
import '../../styles/styles.css';
import theme from '../../theme';
const queryClient = new QueryClient();

// If loading a variable font, you don't need to specify the font weight
const nunito = Plus_Jakarta_Sans({ subsets: ['latin'] });
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
                <main className={nunito.className}>
                  {/* @ts-ignore// */}
                  <Component {...pageProps} />
                </main>
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
