import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { Switch } from '../ui/switch';

export const NotificationSettings = () => {
  const { activeAccount, setUser } = useAuth();
  const user = activeAccount?.user;

  const handleSettingChange = async (key: string, value: boolean) => {
    if (!user) {
      return;
    }

    const newSettings = {
      ...user.notificationSettings,
      [key]: value,
    };

    try {
      const updatedUser = await api.patch('/users/me/notification-settings', newSettings);
      setUser(updatedUser.data);
    } catch (error) {
      console.error('Failed to update notification settings', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Notification Settings</h3>
      <div className="flex items-center justify-between">
        <label htmlFor="likes-notification">Likes</label>
        <Switch
          id="likes-notification"
          checked={user.notificationSettings?.likes ?? true}
          onCheckedChange={(value) => handleSettingChange('likes', value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="comments-notification">Comments</label>
        <Switch
          id="comments-notification"
          checked={user.notificationSettings?.comments ?? true}
          onCheckedChange={(value) => handleSettingChange('comments', value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="new-followers-notification">New Followers</label>
        <Switch
          id="new-followers-notification"
          checked={user.notificationSettings?.newFollowers ?? true}
          onCheckedChange={(value) => handleSettingChange('newFollowers', value)}
        />
      </div>
    </div>
  );
};