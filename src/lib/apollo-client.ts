import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { authStorage } from './auth-storage';

const httpLink = new HttpLink({
  uri:
    process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql',
});

const authLink = new SetContextLink((prev) => {
  const token = authStorage.get();
  return {
    ...prev,
    headers: {
      ...(prev.headers ?? {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

let client: ApolloClient | null = null;

export function getApolloClient() {
  if (client) return client;
  client = new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
  return client;
}
