import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import {
  api,
  login,
  reactivateAndLogin,
  setAuthToken,
  getProfile,
  API_BASE_URL,
  verify2FA,
  recoverAccount,
  getRecoveryOptions,
  requestTrustedContactRecovery,
  verifyTrustedContactRecovery,
  resendVerification,
  requestMagicLink,
} from '../lib/api';
import { isRemembered, setRememberMe } from '../lib/auth-storage';
import axios from 'axios';

import { AuthLayout } from '../components/AuthLayout';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

const WebAuthn = lazy(() => import('../components/WebAuthn'));

export function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { addAccount } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [reactivationRequired, setReactivationRequired] = useState(false);
  const [token, setToken] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [trustedContactEmail, setTrustedContactEmail] = useState('');
  const [trustedContactCode, setTrustedContactCode] = useState('');
  const [recoveryOptions, setRecoveryOptions] = useState<{ trustedContacts: string[] } | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [rememberMe, setRememberMeState] = useState<boolean>(() => isRemembered());
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkMessage, setMagicLinkMessage] = useState('');

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMeState(checked);
    setRememberMe(checked);
  };

  const handleSendMagicLink = async () => {
    setError(null);
    setMagicLinkMessage('');
    if (!identifier || !identifier.includes('@')) {
      setError('Enter your email address above to receive a sign-in link.');
      return;
    }
    setIsSendingMagicLink(true);
    try {
      const res = await requestMagicLink({ email: identifier });
      setMagicLinkMessage(res.message || 'Check your email for your sign-in link.');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to send sign-in link.');
      } else {
        setError('Failed to send sign-in link.');
      }
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const isEmail = identifier.includes('@');
      const loginData = {
        [isEmail ? 'email' : 'username']: identifier,
        password,
        rememberMe,
      };
      const response = await login(loginData);

      if (response.reactivationRequired) {
        setReactivationRequired(true);
        setError(response.message);
        setIsLoading(false);
        return;
      }

      if (response.loginApprovalRequired) {
        setError(response.message || 'This login requires approval before access is granted.');
        addToast(response.message || 'Login approval required.', 'warning');
        setIsLoading(false);
        return;
      }

      if (response.twoFactorEnabled) {
        setShow2FA(true);
        setTempToken(response.tempToken);
        setIsLoading(false);
      } else {
        const { access_token } = response;
        setAuthToken(access_token);
        const user = await getProfile();
        await addAccount({ user, token: access_token });
        addToast('Logged in successfully!', 'success');
        navigate('/');
      }
    } catch (err) {
      setIsLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred');
        addToast(err.response.data.message || 'Login failed', 'error');
      } else {
        setError('An unexpected error occurred');
        addToast('An unexpected error occurred', 'error');
      }
    }
  };

  const handleReactivate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isEmail = identifier.includes('@');
      const response = await reactivateAndLogin({
        [isEmail ? 'email' : 'username']: identifier,
        password,
        rememberMe,
      });
      if (response.twoFactorEnabled) {
        setTempToken(response.tempToken);
        setShow2FA(true);
        setReactivationRequired(false);
        return;
      }
      setAuthToken(response.access_token);
      const user = await getProfile();
      await addAccount({ user, token: response.access_token });
      addToast('Account reactivated successfully!', 'success');
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Account reactivation failed');
      } else {
        setError('Account reactivation failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

    const handleVerifyCode = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!identifier || !identifier.includes('@')) {
        setError('Enter the email you used to sign up in the field above first.');
        return;
      }
      if (!verifyCode || verifyCode.length !== 6) {
        setError('Please enter the 6-digit code sent to your email');
        return;
      }
      setIsVerifying(true);
      try {
        const response = await api.post('/auth/verify-code', { email: identifier, code: verifyCode });
        const { access_token } = response.data;
        setAuthToken(access_token);
        const user = await getProfile();
        await addAccount({ user, token: access_token });
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

    const handleResendVerification = async () => {
      setError(null);
      if (!identifier || !identifier.includes('@')) {
        setError('Please enter the email you used to sign up in the Email or Username field.');
        return;
      }
      setIsResending(true);
      try {
        const resp = await resendVerification({ email: identifier });
        addToast(resp.message || 'Verification email sent', 'info');
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data.message || 'Failed to resend verification email');
          addToast(err.response.data.message || 'Failed to resend verification email', 'error');
        } else {
          setError('Failed to resend verification email');
          addToast('Failed to resend verification email', 'error');
        }
      } finally {
        setIsResending(false);
      }
    };

  const handle2FALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Please enter your 2FA token');
      return;
    }
    setIsLoading(true);
    try {
      const loginData = {
        tempToken,
        token,
        rememberMe,
      };
      const { access_token } = await verify2FA(loginData);
      setAuthToken(access_token);
      const user = await getProfile();
      await addAccount({ user, token: access_token });
      addToast('Logged in successfully!', 'success');
      navigate('/');
    } catch (err) {
      setIsLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred');
        addToast(err.response.data.message || '2FA verification failed', 'error');
      } else {
        setError('An unexpected error occurred');
        addToast('An unexpected error occurred', 'error');
      }
    }
  };

  const handleRecoveryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recoveryIdentifier || !recoveryCode) {
      setError('Please enter your username/email and recovery code');
      return;
    }

    setIsLoading(true);
    try {
      const { access_token } = await recoverAccount({
        identifier: recoveryIdentifier,
        recoveryCode,
      });
      setAuthToken(access_token);
      const user = await getProfile();
      await addAccount({ user, token: access_token });
      addToast('Recovery code accepted. You are signed in.', 'success');
      navigate('/');
    } catch (err) {
      setIsLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred');
        addToast(err.response.data.message || 'Account recovery failed', 'error');
      } else {
        setError('An unexpected error occurred');
        addToast('An unexpected error occurred', 'error');
      }
    }
  };

  const handleLoadRecoveryOptions = async () => {
    if (!recoveryIdentifier) {
      setError('Enter your email or username first.');
      return;
    }

    try {
      const response = await getRecoveryOptions(recoveryIdentifier);
      setRecoveryOptions({
        trustedContacts: response.methods.trustedContacts,
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to load recovery options.');
      } else {
        setError('Failed to load recovery options.');
      }
    }
  };

  const handleRequestTrustedRecoveryCode = async () => {
    if (!recoveryIdentifier || !trustedContactEmail) {
      setError('Enter your account identifier and trusted contact email.');
      return;
    }

    try {
      const response = await requestTrustedContactRecovery({
        identifier: recoveryIdentifier,
        contactEmail: trustedContactEmail,
      });
      addToast(response.message, 'info');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to request contact recovery code.');
      } else {
        setError('Failed to request contact recovery code.');
      }
    }
  };

  const handleTrustedContactRecoveryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recoveryIdentifier || !trustedContactEmail || !trustedContactCode) {
      setError('Please enter your account, trusted contact email, and code.');
      return;
    }

    setIsLoading(true);
    try {
      const { access_token } = await verifyTrustedContactRecovery({
        identifier: recoveryIdentifier,
        contactEmail: trustedContactEmail,
        code: trustedContactCode,
      });
      setAuthToken(access_token);
      const user = await getProfile();
      await addAccount({ user, token: access_token });
      addToast('Trusted contact recovery successful. You are signed in.', 'success');
      navigate('/');
    } catch (err) {
      setIsLoading(false);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred');
        addToast(err.response.data.message || 'Trusted contact recovery failed', 'error');
      } else {
        setError('An unexpected error occurred');
        addToast('An unexpected error occurred', 'error');
      }
    }
  };

  const handleWalletLogin = async (provider: 'metamask' | 'walletconnect') => {
    setError(null);
    setIsLoading(true);
    try {
      const { walletService } = await import('../services/wallet');
      const { accessToken } = await walletService.connectWallet(provider);
      if (accessToken) {
        setAuthToken(accessToken);
        const user = await getProfile();
        await addAccount({ user, token: accessToken });
        addToast(`Logged in with ${provider}!`, 'success');
        navigate('/');
      } else {
        setError('Wallet login failed: No access token received.');
        addToast('Wallet login failed: No access token received.', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      console.error(`Wallet login error (${provider}):`, err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'An error occurred during wallet login.');
        addToast(err.response.data.message, 'error');
      } else if (err instanceof Error) {
        setError(err.message);
        addToast(err.message, 'error');
      } else {
        setError('An unexpected error occurred during wallet login.');
        addToast('An unexpected error occurred during wallet login.', 'error');
      }
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Choose your preferred sign-in method to access your account."
    >
      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          <div>{error}</div>
          {typeof error === 'string' && error.toLowerCase().includes('verify') ? (
            <div className="mt-3 space-y-3">
              <form onSubmit={handleVerifyCode} className="flex items-center gap-2">
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="text-center tracking-[4px]"
                />
                <Button type="submit" variant="primary" size="sm" disabled={isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </Button>
              </form>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={isResending}>
                  {isResending ? 'Resending...' : 'Resend verification email'}
                </Button>
                <div className="text-xs text-dark-500 dark:text-dark-300">Make sure your email is entered above.</div>
              </div>
            </div>
          ) : null}
        </div>
      )}
      
      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="passkey">Passkey</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
        </TabsList>
        <TabsContent value="password">
          {show2FA ? (
            <form onSubmit={handle2FALogin} className="space-y-4">
              <input type="hidden" value={tempToken} readOnly />
              <div className="space-y-2">
                <Label htmlFor="token">Two-Factor Authentication Code</Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  placeholder="Enter your 6-digit code"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStandardLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Username</Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="you@example.com or zynkra"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => handleRememberMeChange(e.target.checked)}
                    className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                  />
                  Remember me
                </label>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>
              {reactivationRequired && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={handleReactivate}
                  disabled={isLoading}
                >
                  {isLoading ? 'Reactivating...' : 'Reactivate account'}
                </Button>
              )}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowMagicLink((v) => !v)}
                  className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  {showMagicLink ? 'Hide' : 'Email me a sign-in link instead'}
                </button>
              </div>
              {showMagicLink && (
                <div className="space-y-2 rounded-xl border border-dark-200 bg-dark-50/50 p-4 dark:border-dark-700 dark:bg-dark-800/40">
                  <Label htmlFor="magic-link-email">Sign in with email link</Label>
                  <Input
                    id="magic-link-email"
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={handleSendMagicLink}
                    disabled={isSendingMagicLink}
                  >
                    {isSendingMagicLink ? 'Sending...' : 'Send sign-in link'}
                  </Button>
                  {magicLinkMessage && (
                    <p className="text-sm text-green-600 dark:text-green-400">{magicLinkMessage}</p>
                  )}
                </div>
              )}
            </form>
          )}
        </TabsContent>
        <TabsContent value="recovery">
          <form onSubmit={handleRecoveryLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-identifier">Email or Username</Label>
              <Input
                id="recovery-identifier"
                type="text"
                value={recoveryIdentifier}
                onChange={(e) => setRecoveryIdentifier(e.target.value)}
                required
                placeholder="you@example.com or zynkra"
              />
              <Button type="button" variant="outline" className="w-full" onClick={handleLoadRecoveryOptions}>
                Check Recovery Options
              </Button>
              {recoveryOptions?.trustedContacts?.length ? (
                <p className="text-xs text-dark-500 dark:text-dark-300">
                  Trusted contacts: {recoveryOptions.trustedContacts.join(', ')}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="recovery-code">Recovery Code</Label>
              <Input
                id="recovery-code"
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                required
                placeholder="XXXX-XXXX"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Recovering...' : 'Recover Account'}
            </Button>
          </form>
          <div className="my-4 border-t border-dark-200 dark:border-dark-700" />
          <form onSubmit={handleTrustedContactRecoveryLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trusted-contact-email">Trusted Contact Email</Label>
              <Input
                id="trusted-contact-email"
                type="email"
                value={trustedContactEmail}
                onChange={(e) => setTrustedContactEmail(e.target.value)}
                placeholder="trusted@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trusted-contact-code">Trusted Contact Code</Label>
              <Input
                id="trusted-contact-code"
                type="text"
                value={trustedContactCode}
                onChange={(e) => setTrustedContactCode(e.target.value)}
                placeholder="ABC123"
              />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={handleRequestTrustedRecoveryCode}>
              Send Code To Trusted Contact
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Recover With Trusted Contact'}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="passkey">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passkey-email">Email</Label>
              <Input
                id="passkey-email"
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Enter email to find your passkey"
              />
            </div>
            <Suspense
              fallback={
                <Button className="w-full" variant="outline" disabled>
                  Loading...
                </Button>
              }
            >
              <WebAuthn
                mode="login"
                email={identifier}
                rememberMe={rememberMe}
                onSuccess={async (data) => {
                  if ('access_token' in data) {
                    setAuthToken(data.access_token);
                    const user = await getProfile();
                    addAccount({ user, token: data.access_token });
                    addToast('Logged in with Passkey!', 'success');
                    navigate('/');
                  }
                }}
                onError={(err) => {
                  setError(err);
                  addToast(err, 'error');
                }}
                className="w-full"
                variant="outline"
              >
                Sign in with Passkey
              </WebAuthn>
              <WebAuthn
                mode="login"
                biometric
                email={identifier}
                rememberMe={rememberMe}
                onSuccess={async (data) => {
                  if ('access_token' in data) {
                    setAuthToken(data.access_token);
                    const user = await getProfile();
                    addAccount({ user, token: data.access_token });
                    addToast('Logged in with Face ID / Fingerprint!', 'success');
                    navigate('/');
                  }
                }}
                onError={(err) => {
                  setError(err);
                  addToast(err, 'error');
                }}
                className="w-full"
                variant="outline"
              >
                Sign in with Face ID / Fingerprint
              </WebAuthn>
            </Suspense>
          </div>
        </TabsContent>
        <TabsContent value="wallet">
          <div className="space-y-3">
            <Button
              onClick={() =>
                (window.location.href = `${API_BASE_URL}/auth/google`)
              }
              className="w-full"
              variant="outline"
            >
              Sign in with Google
            </Button>
            <Button
              onClick={() => handleWalletLogin('metamask')}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              Sign in with MetaMask
            </Button>
            <Button
              onClick={() => handleWalletLogin('walletconnect')}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              Sign in with WalletConnect
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      <p className="mt-8 text-center text-sm text-dark-500 dark:text-white/70">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-medium text-primary-600 dark:text-white hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}