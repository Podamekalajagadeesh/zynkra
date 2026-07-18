import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { detectDeviceCapabilities, type DeviceCapabilityInfo } from '../lib/deviceCapabilities';

interface DeviceShellProps {
  children: ReactNode;
}

export function DeviceShell({ children }: DeviceShellProps) {
  const [device, setDevice] = useState<DeviceCapabilityInfo>(() => detectDeviceCapabilities());

  useEffect(() => {
    const update = () => setDevice(detectDeviceCapabilities({
      userAgent: window.navigator.userAgent,
      width: window.innerWidth,
      height: window.innerHeight,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isElectron: Boolean((window as Window & { electron?: unknown }).electron),
    }));

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const shellClassName = useMemo(() => {
    if (device.mode === 'watch') {
      return 'mx-auto max-w-[320px] rounded-[32px] border border-dark-300 bg-dark-950 p-3 shadow-2xl dark:border-dark-700';
    }
    if (device.mode === 'tv') {
      return 'mx-auto max-w-6xl rounded-[32px] border border-dark-300 bg-gradient-to-br from-dark-950 to-dark-800 p-6 shadow-2xl dark:border-dark-700';
    }
    if (device.mode === 'tablet') {
      return 'mx-auto max-w-4xl rounded-[28px] border border-dark-300 bg-white/85 p-4 shadow-2xl dark:border-dark-700 dark:bg-dark-900/80';
    }
    if (device.mode === 'mobile') {
      return 'mx-auto max-w-[420px] rounded-[28px] border border-dark-300 bg-white/90 p-3 shadow-2xl dark:border-dark-700 dark:bg-dark-900/80';
    }
    return 'mx-auto max-w-6xl rounded-[24px] border border-dark-300 bg-white/80 p-4 shadow-2xl dark:border-dark-700 dark:bg-dark-900/80';
  }, [device.mode]);

  return <div className={shellClassName}>{children}</div>;
}
