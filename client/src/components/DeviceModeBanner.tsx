import { useEffect, useMemo, useState } from 'react';
import { detectDeviceCapabilities, type DeviceCapabilityInfo } from '../lib/deviceCapabilities';

export function DeviceModeBanner() {
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

  const badge = useMemo(() => {
    if (device.mode === 'watch') {
      return 'Watch';
    }
    if (device.mode === 'tv') {
      return 'TV';
    }
    if (device.mode === 'tablet') {
      return 'Tablet';
    }
    if (device.mode === 'mobile') {
      return 'Mobile';
    }
    return 'Desktop';
  }, [device.mode]);

  return (
    <div className="mb-4 rounded-2xl border border-primary-200/70 bg-primary-50/80 p-3 text-sm text-primary-900 shadow-sm dark:border-primary-700/60 dark:bg-primary-950/40 dark:text-primary-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{device.label} mode active</div>
          <div className="text-xs opacity-80">{device.description}</div>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] dark:bg-dark-900/60">
          {badge}
        </span>
      </div>
    </div>
  );
}
