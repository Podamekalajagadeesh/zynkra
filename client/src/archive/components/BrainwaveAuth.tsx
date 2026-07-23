import axios, { AxiosError } from 'axios';
import { useState, useRef, useEffect, useCallback } from 'react';
import { twMerge } from 'tailwind-merge';
import { Brain, Waves, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

// Types for brainwave data and authentication
interface BrainwavePattern {
  id: string;
  userId: string;
  timestamp: number;
  eegData: number[];
  features: {
    alpha: number;
    beta: number;
    theta: number;
    delta: number;
    gamma: number;
    uniqueFingerprint: number[];
  };
  deviceInfo: {
    type: string;
    model: string;
    firmware: string;
  };
}

interface BrainwaveRegistrationOptions {
  challenge: string;
  userId: string;
  requiredChannels: number;
  samplingRate: number;
}

interface BrainwaveAuthenticationOptions {
  challenge: string;
  userId: string;
  tolerance: number;
  timeout: number;
}

interface BrainwaveAuthProps {
  onSuccess: (data: { message: string } | { access_token: string }) => void;
  onError: (error: string) => void;
  email?: string;
  mode: 'register' | 'login';
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  children?: React.ReactNode;
}

// Simulated EEG device connection (in production, this would connect to real EEG hardware)
class SimulatedEEGDevice {
  private channels: number = 8;
  private samplingRate: number = 256;
  private isConnected: boolean = false;
  private uniquePattern: number[] = [];

  constructor() {
    // Generate a unique "brain pattern" for this session
    this.generateUniquePattern();
  }

  private generateUniquePattern(): void {
    // Create a unique 128-dimensional fingerprint that represents the user's brain pattern
    this.uniquePattern = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
    // Add some coherence to make it biologically plausible
    for (let i = 1; i < this.uniquePattern.length; i++) {
      this.uniquePattern[i] = this.uniquePattern[i-1] * 0.8 + this.uniquePattern[i] * 0.2;
    }
  }

  async connect(): Promise<boolean> {
    // Simulate device connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.isConnected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  isDeviceConnected(): boolean {
    return this.isConnected;
  }

  getUniqueFingerprint(): number[] {
    // Add slight noise to each capture to simulate real-world variance
    return this.uniquePattern.map(value => {
      const noise = (Math.random() - 0.5) * 0.1;
      return Math.max(-1, Math.min(1, value + noise));
    });
  }

  getCurrentWaveform(): number[] {
    // Generate real-time EEG-like data
    return Array.from({ length: this.channels }, () => {
      const alpha = Math.sin(Date.now() / 1000) * 0.3;
      const beta = Math.sin(Date.now() / 500) * 0.2;
      const theta = Math.sin(Date.now() / 2000) * 0.15;
      const noise = (Math.random() - 0.5) * 0.1;
      return alpha + beta + theta + noise;
    });
  }

  extractFeatures(eegData: number[]): BrainwavePattern['features'] {
    // Calculate frequency band powers
    const alpha = this.calculateBandPower(eegData, 8, 13);
    const beta = this.calculateBandPower(eegData, 13, 30);
    const theta = this.calculateBandPower(eegData, 4, 8);
    const delta = this.calculateBandPower(eegData, 0.5, 4);
    const gamma = this.calculateBandPower(eegData, 30, 100);

    return {
      alpha,
      beta,
      theta,
      delta,
      gamma,
      uniqueFingerprint: this.getUniqueFingerprint()
    };
  }

  private calculateBandPower(eegData: number[], minFreq: number, maxFreq: number): number {
    // Simulate frequency band power calculation
    const bandPower = eegData.reduce((sum, val) => sum + Math.abs(val), 0) / eegData.length;
    const bandWeight = (maxFreq - minFreq) / 100;
    return bandPower * bandWeight;
  }

  getDeviceInfo(): BrainwavePattern['deviceInfo'] {
    return {
      type: 'consumer-eeg-headset',
      model: 'NeuralSync Pro',
      firmware: '2.4.1'
    };
  }
}

// Cosine similarity for pattern matching
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

const BrainwaveAuth = ({ 
  onSuccess, 
  onError, 
  email, 
  mode, 
  className, 
  variant,
  children 
}: BrainwaveAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'scanning' | 'verifying' | 'success'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<number>(0);
  
  const eegDeviceRef = useRef<SimulatedEEGDevice | null>(null);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (eegDeviceRef.current) {
        eegDeviceRef.current.disconnect();
      }
    };
  }, []);

  // Update live waveform
  useEffect(() => {
    if (status === 'scanning' && eegDeviceRef.current) {
      waveformIntervalRef.current = setInterval(() => {
        const waveform = eegDeviceRef.current!.getCurrentWaveform();
        setLiveWaveform(waveform);
        // Update connection quality based on signal stability
        const stability = waveform.reduce((acc, val, i, arr) => {
          if (i === 0) return 1;
          return acc + (1 - Math.min(1, Math.abs(val - arr[i-1]) * 5));
        }, 0) / waveform.length;
        setConnectionQuality(stability * 100);
      }, 50);
    } else {
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
    }
  }, [status]);

  const handleRegistration = async () => {
    setIsLoading(true);
    setError(null);
    setStatus('connecting');
    
    try {
      // Initialize EEG device
      eegDeviceRef.current = new SimulatedEEGDevice();
      const connected = await eegDeviceRef.current.connect();
      
      if (!connected) {
        throw new Error('Failed to connect to brainwave headset. Please ensure your NeuralSync Pro device is paired.');
      }

      setStatus('scanning');
      
      // Start progress simulation for the scan
      setScanProgress(0);
      progressIntervalRef.current = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            return 100;
          }
          return prev + 2;
        });
      }, 100);

      // Wait for scan to complete
      await new Promise(resolve => setTimeout(resolve, 5000));

      setStatus('verifying');
      
      // Get registration options from server
      const { data: options }: { data: BrainwaveRegistrationOptions } = await axios.post('/auth/brainwave/registration', { email });
      
      // Collect brainwave data
      const eegData = Array.from({ length: 1024 }, () => Math.random() * 2 - 1);
      const features = eegDeviceRef.current.extractFeatures(eegData);
      
      // Create registration payload
      const brainwavePattern: BrainwavePattern = {
        id: crypto.randomUUID(),
        userId: options.userId,
        timestamp: Date.now(),
        eegData: eegData.slice(0, 100), // Send sample only
        features,
        deviceInfo: eegDeviceRef.current.getDeviceInfo()
      };

      // Verify registration with server
      await axios.post('/auth/brainwave/registration/verify', brainwavePattern);
      
      setStatus('success');
      onSuccess({ message: 'Brainwave authentication registered successfully!' });
      
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof AxiosError && err.response?.data?.message 
        ? err.response.data.message 
        : err instanceof Error ? err.message : 'Brainwave registration failed';
      setError(errorMessage);
      onError(errorMessage);
      setStatus('idle');
    } finally {
      setIsLoading(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  const handleLogin = async () => {
    if (!email) {
      const emailError = 'Email is required for brainwave login.';
      setError(emailError);
      onError(emailError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('connecting');

    try {
      // Initialize EEG device
      eegDeviceRef.current = new SimulatedEEGDevice();
      const connected = await eegDeviceRef.current.connect();
      
      if (!connected) {
        throw new Error('Failed to connect to brainwave headset. Please ensure your device is powered on and paired.');
      }

      setStatus('scanning');
      
      // Start progress simulation
      setScanProgress(0);
      progressIntervalRef.current = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            return 100;
          }
          return prev + 3;
        });
      }, 80);

      // Simulate scanning time
      await new Promise(resolve => setTimeout(resolve, 3500));

      setStatus('verifying');
      
      // Get authentication options from server
      const { data: options }: { data: BrainwaveAuthenticationOptions } = await axios.post('/auth/brainwave/authentication', { email });
      
      // Capture current brainwave pattern
      const eegData = Array.from({ length: 1024 }, () => Math.random() * 2 - 1);
      const features = eegDeviceRef.current.extractFeatures(eegData);
      
      // Create authentication payload
      const authPayload = {
        challenge: options.challenge,
        timestamp: Date.now(),
        features: {
          ...features,
          capturedAt: new Date().toISOString()
        },
        deviceInfo: eegDeviceRef.current.getDeviceInfo()
      };

      // Verify with server (server will compare stored pattern with captured pattern)
      const { data } = await axios.post('/auth/brainwave/authentication/verify', authPayload);
      
      setStatus('success');
      onSuccess(data);
      
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof AxiosError && err.response?.data?.message 
        ? err.response.data.message 
        : err instanceof Error ? err.message : 'Brainwave authentication failed';
      setError(errorMessage);
      onError(errorMessage);
      setStatus('idle');
    } finally {
      setIsLoading(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  };

  const resolvedClassName = twMerge(
    variant === 'outline'
      ? 'inline-flex w-full items-center justify-center rounded-xl border border-dark-200 bg-white/90 px-4 py-3 font-medium text-dark-900 shadow-sm transition-colors hover:bg-dark-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-700 dark:bg-dark-800 dark:text-white dark:hover:bg-dark-700'
      : 'inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-cyan-500 px-4 py-3 font-medium text-white shadow-lg shadow-primary-500/20 transition-colors hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50',
    className,
  );

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'scanning':
      case 'connecting':
      case 'verifying':
        return <Waves className="w-5 h-5 animate-pulse text-blue-500" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting to your neural headset...';
      case 'scanning':
        return `Capturing your unique brain pattern... ${scanProgress}%`;
      case 'verifying':
        return 'Verifying your neural signature...';
      case 'success':
        return 'Brainwave authentication successful!';
      default:
        return mode === 'register' ? 'Register with Brainwave' : 'Login with Brainwave';
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={mode === 'register' ? handleRegistration : handleLogin}
        disabled={isLoading || status !== 'idle'}
        className={resolvedClassName}
      >
        <span className="flex items-center gap-2">
          {getStatusIcon()}
          {children || getStatusMessage()}
        </span>
      </button>
      
      {/* Live scanning visualization */}
      {(status === 'scanning' || status === 'verifying') && (
        <div className="space-y-3 rounded-xl border border-dark-200 dark:border-dark-700 p-4 bg-dark-50/50 dark:bg-dark-800/50">
          {/* Progress bar */}
          <div className="w-full bg-dark-200 dark:bg-dark-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-600 to-cyan-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          
          {/* Connection quality indicator */}
          {status === 'scanning' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-600 dark:text-dark-400">Signal quality</span>
              <span className={connectionQuality > 80 ? 'text-green-500' : connectionQuality > 50 ? 'text-yellow-500' : 'text-red-500'}>
                {connectionQuality.toFixed(0)}%
              </span>
            </div>
          )}
          
          {/* Live waveform visualization */}
          <div className="h-16 flex items-center justify-center bg-dark-100 dark:bg-dark-900 rounded-lg overflow-hidden">
            <div className="flex items-end gap-0.5 h-12 px-2">
              {liveWaveform.map((value, index) => (
                <div
                  key={index}
                  className="w-1 bg-gradient-to-t from-primary-600 to-cyan-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.abs(value) * 100}%` }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-dark-500 dark:text-dark-400">
            <Shield className="w-3 h-3" />
            <span>Your brain pattern is encrypted and never stored in plaintext</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-600 dark:text-green-400">Your unique neural signature has been verified.</p>
        </div>
      )}
    </div>
  );
};

export default BrainwaveAuth;