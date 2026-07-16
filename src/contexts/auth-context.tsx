import { useApolloClient, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authStorage } from '@/lib/auth-storage';
import { ME_QUERY } from '@/lib/graphql/queries';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialised, setInitialised] = useState(false);
  const router = useRouter();
  const apollo = useApolloClient();

  useEffect(() => {
    setToken(authStorage.get());
    setInitialised(true);
  }, []);

  const { data, loading, error, refetch } = useQuery<{ me: User }>(
    ME_QUERY,
    {
      skip: !token,
      fetchPolicy: 'network-only',
    },
  );

  useEffect(() => {
    if (data?.me) setUser(data.me as User);
  }, [data]);

  useEffect(() => {
    if (error) {
      authStorage.clear();
      setToken(null);
      setUser(null);
    }
  }, [error]);

  const login = useCallback((newToken: string, newUser: User) => {
    authStorage.set(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setToken(null);
    setUser(null);
    apollo.clearStore().catch(() => {});
    router.push('/');
  }, [apollo, router]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading: !initialised || (!!token && loading && !user),
      isAuthenticated: !!user,
      login,
      logout,
      refresh,
    }),
    [user, initialised, token, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
