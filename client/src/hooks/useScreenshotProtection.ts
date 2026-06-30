import { useEffect, useCallback, useRef } from 'react';
import { useToast } from './useToast';
import { ScreenshotProtectionLevel, ScreenshotProtectionSettings } from '../lib/types';

interface UseScreenshotProtectionProps {
  enabled: boolean;
  level: ScreenshotProtectionLevel;
  contentTitle?: string;
  onScreenshotDetected?: () => void;
}

export const useScreenshotProtection = ({
  enabled,
  level,
  contentTitle = 'this content',
  onScreenshotDetected,
}: UseScreenshotProtectionProps) => {
  const { addToast } = useToast();
  const protectionRef = useRef<HTMLDivElement>(null);
  const hasWarned = useRef(false);

  // Handle keydown events to prevent screenshot shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || level === ScreenshotProtectionLevel.NONE) return;

    // Common screenshot shortcuts
    const isScreenshotShortcut = 
      // Windows: Win+Shift+S
      (e.metaKey && e.shiftKey && e.key === 's') ||
      // Mac: Cmd+Shift+4 or Cmd+Shift+5
      (e.ctrlKey && e.shiftKey && (e.key === '4' || e.key === '5')) ||
      // PrintScreen key
      e.key === 'PrintScreen' ||
      // Alt+PrtScn
      (e.altKey && e.key === 'PrintScreen');

    if (isScreenshotShortcut) {
      e.preventDefault();
      handleScreenshotAttempt();
    }
  }, [enabled, level, contentTitle]);

  // Handle copy events
  const handleCopy = useCallback((e: ClipboardEvent) => {
    if (!enabled || level === ScreenshotProtectionLevel.NONE) return;
    
    if (protectionRef.current && protectionRef.current.contains(document.activeElement)) {
      e.preventDefault();
      handleScreenshotAttempt();
    }
  }, [enabled, level]);

  const handleScreenshotAttempt = useCallback(() => {
    if (hasWarned.current && level === ScreenshotProtectionLevel.WARNING_ONLY) return;
    
    hasWarned.current = true;
    
    if (level === ScreenshotProtectionLevel.BLOCK_ALL || level === ScreenshotProtectionLevel.WARNING_ONLY) {
      addToast(`Screenshot detected! ${contentTitle} is protected and cannot be screenshotted.`, 'warning');
      
      if (onScreenshotDetected) {
        onScreenshotDetected();
      }

      // Reset warning flag after some time for warning-only mode
      if (level === ScreenshotProtectionLevel.WARNING_ONLY) {
        setTimeout(() => {
          hasWarned.current = false;
        }, 5000);
      }
    }
  }, [level, contentTitle, addToast, onScreenshotDetected]);

  // Apply visual protection to prevent easy screenshots
  const applyVisualProtection = useCallback(() => {
    if (!protectionRef.current || !enabled || level !== ScreenshotProtectionLevel.BLOCK_ALL) return;

    const element = protectionRef.current;
    
    // Add CSS to prevent screen recording/capturing
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.msUserSelect = 'none';
    
    // Add subtle noise overlay that makes screenshots hard to read but still looks okay to the human eye
    const noiseOverlay = document.createElement('div');
    noiseOverlay.className = 'screenshot-protection-noise';
    noiseOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      opacity: 0.02;
      z-index: 1000;
    `;
    
    if (!element.querySelector('.screenshot-protection-noise')) {
      element.style.position = 'relative';
      element.appendChild(noiseOverlay);
    }
  }, [enabled, level]);

  // Listen for visibility change which could indicate a screenshot/screen recording
  const handleVisibilityChange = useCallback(() => {
    if (!enabled || level === ScreenshotProtectionLevel.NONE) return;
    
    if (document.visibilityState === 'hidden') {
      // Page is hidden, could be a screenshot or screen recording
      handleScreenshotAttempt();
    }
  }, [enabled, level, handleScreenshotAttempt]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    applyVisualProtection();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, handleKeyDown, handleCopy, handleVisibilityChange, applyVisualProtection]);

  return { protectionRef };
};

// Helper function to check if content should be protected based on user settings
export const shouldProtectContent = (
  userSettings: ScreenshotProtectionSettings | undefined,
  contentType: 'dms' | 'posts' | 'stories' | 'profile',
  isSensitiveContent: boolean = false
): boolean => {
  if (!userSettings?.enabled) return false;
  if (userSettings.level === ScreenshotProtectionLevel.NONE) return false;
  
  // Always protect sensitive content regardless of specific settings
  if (isSensitiveContent) return true;
  
  switch (contentType) {
    case 'dms':
      return userSettings.applyToDms;
    case 'posts':
      return userSettings.applyToPosts;
    case 'stories':
      return userSettings.applyToStories;
    case 'profile':
      return userSettings.applyToProfile;
    default:
      return false;
  }
};

// Default settings for new users
export const defaultScreenshotProtectionSettings: ScreenshotProtectionSettings = {
  enabled: false,
  level: ScreenshotProtectionLevel.WARNING_ONLY,
  applyToDms: true,
  applyToPosts: true,
  applyToStories: true,
  applyToProfile: false,
};