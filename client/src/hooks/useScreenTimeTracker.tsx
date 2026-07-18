import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAppPreferences } from '../contexts/PreferencesContext';

export function useScreenTimeTracker() {
  const { screenTimeEnabled, dailyScreenTimeLimit } = useAppPreferences();
  const [todayScreenTime, setTodayScreenTime] = useState<number>(0);
  const [hasShownReminder, setHasShownReminder] = useState<boolean>(false);

  // Get today's date string in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load saved screen time from localStorage on mount
  useEffect(() => {
    if (!screenTimeEnabled) return;

    const today = getTodayString();
    const savedData = localStorage.getItem('zynkra_screen_time_tracking');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.date === today) {
          setTodayScreenTime(parsed.minutes || 0);
          setHasShownReminder(parsed.hasShownReminder || false);
        } else {
          // Reset for new day
          localStorage.setItem('zynkra_screen_time_tracking', JSON.stringify({
            date: today,
            minutes: 0,
            hasShownReminder: false
          }));
          setTodayScreenTime(0);
          setHasShownReminder(false);
        }
      } catch (error) {
        console.error('Failed to parse screen time data', error);
      }
    } else {
      // Initialize for first use
      localStorage.setItem('zynkra_screen_time_tracking', JSON.stringify({
        date: today,
        minutes: 0,
        hasShownReminder: false
      }));
    }
  }, [screenTimeEnabled]);

  // Track time spent on the app
  useEffect(() => {
    if (!screenTimeEnabled) return;

    const interval = setInterval(() => {
      setTodayScreenTime(prev => {
        const newTime = prev + 1;
        const today = getTodayString();
        localStorage.setItem('zynkra_screen_time_tracking', JSON.stringify({
          date: today,
          minutes: newTime,
          hasShownReminder: hasShownReminder
        }));
        return newTime;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [screenTimeEnabled, hasShownReminder]);

  // Check if we've reached the limit and show reminder
  useEffect(() => {
    if (!screenTimeEnabled || hasShownReminder) return;

    if (todayScreenTime >= dailyScreenTimeLimit) {
      toast.warning(`You've reached your daily screen time limit of ${dailyScreenTimeLimit} minutes. Consider taking a break!`, {
        duration: 10000,
        id: 'screen-time-limit',
      });
      setHasShownReminder(true);
      localStorage.setItem('zynkra_screen_time_tracking', JSON.stringify({
        date: getTodayString(),
        minutes: todayScreenTime,
        hasShownReminder: true
      }));
    }
  }, [todayScreenTime, dailyScreenTimeLimit, screenTimeEnabled, hasShownReminder]);

  return {
    todayScreenTime,
    dailyScreenTimeLimit,
    remainingTime: Math.max(0, dailyScreenTimeLimit - todayScreenTime),
    isLimitReached: todayScreenTime >= dailyScreenTimeLimit
  };
}