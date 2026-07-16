import { CombinedGraphQLErrors } from '@apollo/client/errors';

export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (CombinedGraphQLErrors.is(err)) {
    const msg = err.errors.map((e) => e.message).filter(Boolean).join('\n');
    if (msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
