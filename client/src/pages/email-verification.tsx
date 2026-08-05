import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, setAuthToken } from '../lib/api';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/button';

export function EmailVerificationPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setError('No verification token found.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setAuthToken(response.data.access_token);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.message || 'An unexpected error occurred.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <AuthLayout
      title={
        status === 'verifying'
          ? 'Verifying your email...'
          : status === 'success'
          ? 'Email Verified!'
          : 'Verification Failed'
      }
      subtitle={
        status === 'verifying'
          ? 'Please wait while we verify your email address.'
          : status === 'success'
          ? 'You can now log in to your account.'
          : 'There was a problem verifying your email.'
      }
    >
      {status === 'error' && (
        <div className="mb-4 text-center text-red-500">{error}</div>
      )}
      {status === 'success' && (
        <div className="text-center">
          <p className="mb-4">Your email has been successfully verified.</p>
          <Button asChild>
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}