import { useState, lazy, Suspense, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { signUp, getCaptcha, API_BASE_URL } from '../lib/api';
import { api, setAuthToken } from '../lib/api';
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
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [captcha, setCaptcha] = useState<{ id: string; expression: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSignedUp && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [isSignedUp]);

  const refreshCaptcha = useCallback(async () => {
    setIsCaptchaLoading(true);
    setCaptchaAnswer('');
    try {
      const challenge = await getCaptcha();
      setCaptcha(challenge);
    } catch {
      setCaptcha(null);
    } finally {
      setIsCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter the 6-digit code sent to your email');
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const response = await api.post('/auth/verify-code', { email, code: verifyCode });
      const { access_token } = response.data;
      setAuthToken(access_token);
      addToast('Email verified! You are now logged in.', 'success');
      navigate('/');
    } catch (err) {
      setIsVerifying(false);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Verification failed');
        addToast(err.response.data.message || 'Verification failed', 'error');
      } else {
        setError('An unexpected error occurred');
        addToast('An unexpected error occurred', 'error');
      }
    }
  };

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
    const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
    if (password.length < 8 || classes < 3) {
      setError('Password must be at least 8 characters and include at least 3 of: lowercase, uppercase, number, symbol.');
      return;
    }
    if (!captcha || !captchaAnswer) {
      setError('Please solve the CAPTCHA before signing up.');
      return;
    }
    setIsLoading(true);
    try {
      await signUp({
        username,
        email,
        password,
        birthDate,
        captchaId: captcha.id,
        captchaAnswer,
        inviteCode: inviteCode || undefined,
      });
      addToast('Verification code sent to your email!', 'success');
      setIsSignedUp(true);
    } catch (err) {
      setIsLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred');
        addToast(err.response.data.message || 'Sign up failed', 'error');
        if (err.response.status === 400 && captcha) {
          refreshCaptcha();
        }
      } else {
        setError('An unexpected error occurred');
        addToast('An unexpected error occurred', 'error');
      }
    }
  };

  if (isSignedUp) {
    return (
      <AuthLayout
        title="Verify your email"
        subtitle={`Enter the 6-digit code sent to ${email}`}
      >
        {error && (
          <p className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </p>
        )}
        <form onSubmit={handleVerifyCode}>
          <div className="mb-6 space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              ref={codeInputRef}
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              placeholder="000000"
              className="text-center text-2xl tracking-[8px]"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-dark-500 dark:text-white/70">
          Check your email for the 6-digit code.
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
        <div className="mb-4 space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <PasswordStrengthMeter password={password} />
        </div>
        <div className="mb-4 space-y-2">
          <Label htmlFor="birthDate">Date of Birth</Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />
          <p className="text-xs text-dark-500 dark:text-white/50">
            You must be at least 13 years old to register.
          </p>
        </div>
        <div className="mb-4 space-y-2">
          <Label htmlFor="inviteCode">Invite Code (optional)</Label>
          <Input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="XXXX-XXXX"
          />
        </div>
        <div className="mb-6 space-y-2">
          <Label htmlFor="captchaAnswer">Security Check</Label>
          <div className="flex items-center gap-3 rounded-2xl border border-dark-200 px-4 py-3 dark:border-dark-700">
            <span className="text-lg font-semibold text-dark-700 dark:text-white">
              {isCaptchaLoading ? '…' : captcha ? captcha.expression : 'Unavailable'}
            </span>
            <span className="text-sm text-dark-500 dark:text-dark-400">=</span>
            <Input
              id="captchaAnswer"
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value.replace(/\D/g, '').slice(0, 3))}
              required
              disabled={isCaptchaLoading || !captcha}
              placeholder="?"
              className="w-20 text-center"
            />
            <button
              type="button"
              onClick={refreshCaptcha}
              disabled={isCaptchaLoading}
              className="ml-auto text-sm font-medium text-blue-600 hover:underline disabled:text-dark-400 dark:text-blue-400"
            >
              {isCaptchaLoading ? 'Loading…' : 'New puzzle'}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
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