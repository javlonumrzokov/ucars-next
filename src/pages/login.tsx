import { useMutation } from '@apollo/client/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import { useAuth } from '@/contexts/auth-context';
import { getErrorMessage } from '@/lib/apollo-error';
import { LOGIN_MUTATION } from '@/lib/graphql/queries';
import type { User } from '@/types';

interface LoginResponse {
  login: { accessToken: string; user: User };
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [loginMutation, { loading }] =
    useMutation<LoginResponse>(LOGIN_MUTATION);

  useEffect(() => {
    if (isAuthenticated) {
      const next = (router.query.next as string) || '/mypage';
      router.replace(next);
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await loginMutation({
        variables: {
          input: { email: email.trim().toLowerCase(), password },
        },
      });
      if (data?.login?.accessToken && data.login.user) {
        login(data.login.accessToken, data.login.user as User);
        const next = (router.query.next as string) || '/mypage';
        router.push(next);
        return;
      }
      setError('Login failed. Please try again.');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    }
  }

  return (
    <Layout>
      <Container className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Log in to continue to Ucar.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <PasswordInput
              label="Password"
              name="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error && (
              <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Log in
            </Button>

            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-zinc-900 hover:underline dark:text-white"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </Container>
    </Layout>
  );
}
