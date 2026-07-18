import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AuthLayout } from '../components/AuthLayout';
import { API_BASE_URL } from '../lib/api';
import axios from 'axios';

export function ForgotPasswordPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      setIsSubmitted(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred');
        addToast(err.response.data.message || 'Failed to send password reset email', 'error');
      } else {
        setError('An unexpected error occurred');
        addToast('An unexpected error occurred', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
    >
      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      {isSubmitted ? (
        <div className="text-center">
          <p>If an account with that email exists, we've sent a password reset link to your email address.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Password Reset Link'}
          </Button>
        </form>
      )}
      <p className="mt-8 text-center text-sm text-dark-500 dark:text-white/70">
        Remember your password?{' '}
        <Link
          to="/login"
          className="font-medium text-primary-600 dark:text-white hover:underline"
        >
          Log In
        </Link>
      </p>
    </AuthLayout>
  );
}