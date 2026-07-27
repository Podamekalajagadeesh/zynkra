import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/useToast';
import { setup2FA, enable2FA, get2FAStatus, disable2FA } from '../lib/api';
import { AuthLayout } from '../components/AuthLayout';
import QRCode from 'qrcode';

export function TwoFactorAuthPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const status = await get2FAStatus();
        setIs2FAEnabled(status.enabled);
      } catch {
        // Backend not available or user not logged in — assume disabled
        setIs2FAEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetch2FAStatus();
  }, []);

  const handleEnable2FA = async () => {
    try {
      const { secret, otpauthUrl } = await setup2FA();
      setSecret(secret);
      setOtpauthUrl(otpauthUrl);
      setQrCode(await QRCode.toDataURL(otpauthUrl));
      addToast('Scan the QR code with your authenticator app', 'info');
    } catch (error) {
      addToast('Failed to set up 2FA', 'error');
    }
  };

  const handleVerify2FA = async () => {
    if (!token) {
      addToast('Please enter the 2FA token', 'error');
      return;
    }
    try {
      await enable2FA({ token });
      setIs2FAEnabled(true);
      setQrCode(null);
      setSecret(null);
      setOtpauthUrl(null);
      setToken('');
      addToast('2FA enabled successfully!', 'success');
    } catch (error) {
      addToast('Invalid 2FA token', 'error');
    }
  };

  const handleDisable2FA = async () => {
    if (!disableToken) {
      addToast('Please enter the 6-digit code from your authenticator app to disable 2FA', 'error');
      return;
    }
    try {
      await disable2FA({ token: disableToken });
      setIs2FAEnabled(false);
      setDisableToken('');
      addToast('2FA disabled successfully', 'success');
    } catch (error) {
      addToast('Invalid token. Please try again.', 'error');
    }
  };

  if (isLoading) {
    return (
      <AuthLayout
        title="Two-Factor Authentication"
        subtitle="Add an extra layer of security to your account."
      >
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Two-Factor Authentication"
      subtitle="Add an extra layer of security to your account."
    >
      {is2FAEnabled ? (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-medium text-green-600">✓ 2FA is enabled on your account.</p>
          </div>
          <div className="border-t pt-6 space-y-4">
            <p className="text-sm text-gray-600">
              To disable two-factor authentication, enter a code from your authenticator app:
            </p>
            <div className="space-y-2">
              <Label htmlFor="disable-token">Authenticator code:</Label>
              <Input
                id="disable-token"
                type="text"
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value)}
                maxLength={6}
                placeholder="123456"
              />
            </div>
            <Button onClick={handleDisable2FA} variant="destructive" className="w-full">
              Disable 2FA
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {!qrCode && (
            <Button onClick={handleEnable2FA} className="w-full">
              Enable 2FA
            </Button>
          )}
          {qrCode && secret && otpauthUrl && (
            <div className="flex flex-col items-center space-y-4">
              <p>Scan this QR code with your authenticator app:</p>
              <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
              <p className="text-sm text-gray-500">Or enter this secret manually:</p>
              <p className="text-lg font-mono bg-gray-100 p-2 rounded">{secret}</p>
              <p className="break-all text-xs text-gray-500">{otpauthUrl}</p>
              <div className="w-full space-y-2">
                <Label htmlFor="token">Enter the 6-digit code from your app:</Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                  placeholder="123456"
                />
              </div>
              <Button onClick={handleVerify2FA} className="w-full">
                Verify & Enable
              </Button>
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  );
}
