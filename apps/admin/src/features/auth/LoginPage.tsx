import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/inputs';
import { login } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useSession } from '@/lib/session';

interface LoginValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const status = useSession((state) => state.status);
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>();

  if (status === 'authenticated') {
    const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search}` : '/'} replace />;
  }

  const submit = handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (error) {
      setError('root', { message: errorMessage(error) });
    }
  });

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold">
          Portfolio <span className="text-accent-text">Admin</span>
        </h1>
        <p className="mt-1 mb-6 text-muted">Sign in to manage your site.</p>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              autoFocus
              aria-invalid={Boolean(errors.email)}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <p
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-danger"
            >
              {errors.root.message}
            </p>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  );
}
