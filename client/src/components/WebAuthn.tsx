import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import axios, { AxiosError } from 'axios';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { api } from '../lib/api';

interface WebAuthnProps {
  onSuccess: (data: { message: string } | { access_token: string }) => void;
  onError: (error: string) => void;
  email?: string;
  mode: 'register' | 'login';
  biometric?: boolean;
  rememberMe?: boolean;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  children?: React.ReactNode;
}

const WebAuthn = ({ onSuccess, onError, email, mode, biometric, rememberMe, className, variant, children }: WebAuthnProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: options } = await api.post('/auth/webauthn/registration');
      const attestation = await startRegistration(options);
      await api.post('/auth/webauthn/registration/verify', attestation);
      onSuccess({ message: 'Registration successful!' });
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof AxiosError && err.response
          ? err.response.data.message
          : 'Registration failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email) {
      const emailError = 'Email is required for passkey login.';
      setError(emailError);
      onError(emailError);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: options } = await api.post('/auth/webauthn/authentication', {
        email,
        biometric: biometric || undefined,
      });
      const assertion = await startAuthentication(options);
      const verifyBody = rememberMe ? { ...assertion, rememberMe: true } : assertion;
      const { data } = await api.post('/auth/webauthn/authentication/verify', verifyBody);
      onSuccess(data);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof AxiosError && err.response
          ? err.response.data.message
          : 'Login failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resolvedClassName = twMerge(
    variant === 'outline'
      ? 'inline-flex w-full items-center justify-center rounded-xl border border-dark-200 bg-white/90 px-4 py-3 font-medium text-dark-900 shadow-sm transition-colors hover:bg-dark-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-700 dark:bg-dark-800 dark:text-white dark:hover:bg-dark-700'
      : 'inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-cyan-500 px-4 py-3 font-medium text-white shadow-lg shadow-primary-500/20 transition-colors hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50',
    className,
  );

  return (
    <div>
      {mode === 'register' && (
        <button onClick={handleRegister} disabled={isLoading} className={resolvedClassName}>
          {isLoading ? 'Registering...' : children || 'Register with Passkey'}
        </button>
      )}
      {mode === 'login' && (
        <button onClick={handleLogin} disabled={isLoading} className={resolvedClassName}>
          {isLoading
            ? 'Logging in...'
            : children || (biometric ? 'Sign in with Face ID / Fingerprint' : 'Login with Passkey')}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default WebAuthn;