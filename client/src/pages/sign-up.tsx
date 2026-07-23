import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { signUp, API_BASE_URL } from '../lib/api';
import axios from 'axios';

const WebAuthn = lazy(() => import('../components/WebAuthn'));

export function SignUpPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const [isSignedUp, setIsSignedUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setIsLoading(true);
    try {
      await signUp({ username, email, password });
      addToast('Account created! Please check your email for a verification link.', 'success');
      setIsSignedUp(true);
    } catch (err) {
      setIsLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred');
        addToast(err.response.data.message || 'Sign up failed', 'error');
      } else {
        setError('An unexpected error occurred');
        addToast('An unexpected error occurred', 'error');
      }
    }
  };

  if (isSignedUp) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent a verification link to your email address."
      >
        <p className="text-center">
          Please check your inbox and follow the link to complete your registration.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Build your identity with email, wallet, or passkey access from the start."
    >
      {error && (
        <p className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4 space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="e.g. zynkra"
          />
        </div>
        <div className="mb-4 space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="mb-6 space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>
      
      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-dark-200 dark:border-dark-700"></div>
        <span className="mx-4 text-sm text-dark-500 dark:text-dark-400">or</span>
        <div className="flex-grow border-t border-dark-200 dark:border-dark-700"></div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => (window.location.href = `${API_BASE_URL}/auth/google`)}
          className="w-full"
          variant="outline"
        >
          Sign up with Google
        </Button>
        <Suspense fallback={<Button className="w-full" variant="outline" disabled>Loading passkey...</Button>}>
          <WebAuthn
            mode="register"
            onSuccess={() => {
              addToast('Passkey registered successfully!', 'success');
              navigate('/login?passkey=success');
            }}
            onError={(err) => {
              setError(err);
              addToast(err, 'error');
            }}
            className="w-full"
            variant="outline"
          >
            Register with Passkey
          </WebAuthn>
        </Suspense>
      </div>

      <p className="mt-8 text-center text-sm text-dark-500 dark:text-white/70">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 dark:text-white hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}