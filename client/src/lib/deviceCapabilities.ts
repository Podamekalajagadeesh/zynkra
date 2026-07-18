export type DeviceMode = 'mobile' | 'tablet' | 'desktop' | 'tv' | 'watch';

export interface DeviceCapabilityInfo {
  mode: DeviceMode;
  isTouch: boolean;
  isElectron: boolean;
  isCompact: boolean;
  label: string;
  description: string;
}

export interface DeviceCapabilityInput {
  userAgent?: string;
  width?: number;
  height?: number;
  hasTouch?: boolean;
  isElectron?: boolean;
}

function normalizeUserAgent(userAgent?: string): string {
  return (userAgent || '').toLowerCase();
}

export function detectDeviceCapabilities(input: DeviceCapabilityInput = {}): DeviceCapabilityInfo {
  const userAgent = normalizeUserAgent(input.userAgent);
  const width = input.width ?? 1280;
  const height = input.height ?? 720;
  const isTouch = input.hasTouch ?? false;
  const isElectron = input.isElectron ?? false;

  const isSmartwatch = /watch|wear os|wearos|galaxy watch|apple watch/i.test(userAgent) || (width <= 220 && height <= 220);
  const isSmartTv = /tv|android tv|google tv|roku|apple tv|fire tv|webos|tizen/i.test(userAgent) || (width >= 1920 && height <= 1080 && !isTouch);
  const isTablet = /ipad|tablet|tab/i.test(userAgent) || (width >= 768 && width < 1200);
  const isMobile = /iphone|android|mobile/i.test(userAgent) || (width < 768);

  let mode: DeviceMode = 'desktop';
  let label = 'Desktop';
  let description = 'Optimized for a full desktop experience with keyboard and mouse interactions.';
  let isCompact = false;

  if (isSmartwatch) {
    mode = 'watch';
    label = 'Smartwatch';
    description = 'A compact, glanceable interface for quick checks and one-tap actions.';
    isCompact = true;
  } else if (isSmartTv) {
    mode = 'tv';
    label = 'Smart TV';
    description = 'A large-format, remote-friendly experience with big controls and simple navigation.';
    isCompact = false;
  } else if (isTablet) {
    mode = 'tablet';
    label = 'Tablet';
    description = 'A touch-first layout designed for larger handheld screens and split views.';
    isCompact = false;
  } else if (isMobile) {
    mode = 'mobile';
    label = 'Mobile';
    description = 'A streamlined app experience tuned for thumb navigation and small screens.';
    isCompact = true;
  }

  return {
    mode,
    isTouch: isTouch || mode === 'tablet' || mode === 'mobile' || mode === 'watch',
    isElectron,
    isCompact,
    label,
    description,
  };
}

export function getDeviceCapabilities(): DeviceCapabilityInfo {
  if (typeof window === 'undefined') {
    return detectDeviceCapabilities();
  }

  return detectDeviceCapabilities({
    userAgent: window.navigator.userAgent,
    width: window.innerWidth,
    height: window.innerHeight,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isElectron: typeof window !== 'undefined' && Boolean((window as Window & { electron?: unknown }).electron),
  });
}
