import { ApolloProvider } from '@apollo/client/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { appWithTranslation } from 'next-i18next/pages';
import { useMemo } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { ChatProvider } from '@/contexts/chat-context';
import { getApolloClient } from '@/lib/apollo-client';
import nextI18NextConfig from '../../next-i18next.config.js';
import '@/styles/globals.css';

function App({ Component, pageProps }: AppProps) {
  const client = useMemo(() => getApolloClient(), []);
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <ChatProvider>
        <Head>
          <title>Ucar — Buy and sell cars</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />
          <meta
            name="description"
            content="Ucar is a modern marketplace for buying and selling new and used vehicles."
          />
        </Head>
        <Component {...pageProps} />
        </ChatProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
