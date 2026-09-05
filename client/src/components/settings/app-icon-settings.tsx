import { Palette, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { updateAccountPreferences } from '../../lib/api';
import { useAppPreferences } from '../../contexts/PreferencesContext';
import { useIsPremium } from '../../hooks/useIsPremium';
import { APP_ICON_OPTIONS, AppIconPreference } from '../../lib/preferences';
import { toast } from 'sonner';

export function AppIconSettings() {
  const { appIcon, setAppIcon } = useAppPreferences();
  const isPremium = useIsPremium();

  const handleIconSelect = (newIcon: AppIconPreference) => {
    const iconOption = APP_ICON_OPTIONS.find(option => option.value === newIcon);
    
    if (iconOption?.creatorCurated && !isPremium) {
      toast.error('Creator-curated icons require a premium subscription.');
      return;
    }

    setAppIcon(newIcon);
    void updateAccountPreferences({ appIcon: newIcon }).catch(() => {
      toast.error('Failed to save app icon preference.');
    });
    toast.success(`App icon changed to ${iconOption?.label}.`);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/85 p-4 dark:border-dark-700 dark:bg-dark-900/70">
      <div className="flex items-center gap-2 text-sm font-semibold text-dark-900 dark:text-white">
        <Palette size={16} />
        App Icon
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {APP_ICON_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={appIcon === option.value ? 'primary' : 'secondary'}
            onClick={() => handleIconSelect(option.value as AppIconPreference)}
            className="relative flex flex-col items-center gap-1 p-3"
            disabled={option.creatorCurated && !isPremium}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xs font-bold mb-1 ${
              option.value === 'default' ? 'bg-blue-500' :
              option.value === 'neon' ? 'bg-purple-500' :
              option.value === 'ocean' ? 'bg-cyan-500' :
              option.value === 'sunset' ? 'bg-orange-500' :
              option.value === 'creator-classic' ? 'bg-gray-700' :
              option.value === 'creator-vibrant' ? 'bg-pink-500' :
              'bg-slate-400'
            }`}>
              Z
            </div>
            <span className="text-xs">{option.label}</span>
            {option.creatorCurated && (
              <div className="absolute top-2 right-2">
                <Lock size={12} className={isPremium ? 'text-green-400' : 'text-yellow-500'} />
              </div>
            )}
          </Button>
        ))}
      </div>
      <p className="text-xs text-dark-500 dark:text-dark-400">
        Swap default app icons for creator-curated designs. Creator-curated icons require a premium subscription.
      </p>
    </div>
  );
}