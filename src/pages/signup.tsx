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
import { SIGNUP_MUTATION } from '@/lib/graphql/queries';
import type { User, UserRole } from '@/types';

interface SignupResponse {
  signup: { accessToken: string; user: User };
}

export default function SignupPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [error, setError] = useState<string | null>(null);

  const [signup, { loading }] = useMutation<SignupResponse>(SIGNUP_MUTATION);

  useEffect(() => {
    if (isAuthenticated) router.replace('/mypage');
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await signup({
        variables: {
          input: { name: name.trim(), email: email.trim().toLowerCase(), password, role },
        },
      });
      if (data?.signup?.accessToken && data.signup.user) {
        login(data.signup.accessToken, data.signup.user as User);
        router.push('/mypage');
        return;
      }
      setError('Signup failed. Please try again.');
    } catch (err) {
      setError(getErrorMessage(err, 'Signup failed'));
    }
  }

  return (
    <Layout>
      <Container className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Join Ucar to buy, sell, and follow dealers.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Input
              label="Name"
              name="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Driver"
            />
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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />

            <div className="space-y-1.5">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Account type
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                <option value="USER">Buyer</option>
                <option value="DEALER">Dealer</option>
              </select>
            </div>

            {error && (
              <div className="whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>

            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-zinc-900 hover:underline dark:text-white"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </Container>
    </Layout>
  );
}
