import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getProfile, setAuthToken, verifyMagicLink } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/button';

export function VerifyLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addAccount } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setError('No sign-in link found in the URL.');
      return;
    }

    const verify = async () => {
      try {
        const { access_token } = await verifyMagicLink({ token });
        setAuthToken(access_token);
        const user = await getProfile();
        await addAccount({ user, token: access_token });
        setStatus('success');
        navigate('/');
      } catch (err: any) {
        setStatus('error');
        setError(err?.response?.data?.message || 'This sign-in link is invalid or has expired.');
      }
    };

    verify();
  }, [searchParams, navigate, addAccount]);

  return (
    <AuthLayout
      title={
        status === 'verifying'
          ? 'Signing you in...'
          : status === 'success'
            ? 'Signed in!'
            : 'Link Invalid or Expired'
      }
      subtitle={
        status === 'verifying'
          ? 'Please wait while we sign you in.'
          : status === 'success'
            ? 'You are now signed in.'
            : 'Request a new sign-in link to try again.'
      }
    >
      {status === 'error' && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <Button asChild variant="secondary" className="w-full">
            <Link to="/login">Back to Login</Link>
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
