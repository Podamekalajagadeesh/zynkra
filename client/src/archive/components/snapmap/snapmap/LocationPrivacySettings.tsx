// @ts-nocheck
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { useUser } from '../../hooks/useUser';
import { useSocket } from '../../hooks/useSocket';

interface LocationPrivacySettingsProps {
  open: boolean;
  onClose: () => void;
  currentSettings: LocationPrivacy;
  onSettingsChange: (settings: LocationPrivacy) => void;
}

export interface LocationPrivacy {
  shareWith: 'all_friends' | 'selected_friends' | 'no_one';
  selectedFriendIds: string[];
  ghostMode: boolean;
  expireAfter: '1hour' | '4hours' | '24hours' | 'until_turned_off';
}

export function LocationPrivacySettings({ 
  open, 
  onClose, 
  currentSettings,
  onSettingsChange 
}: LocationPrivacySettingsProps) {
  const { user } = useUser();
  const { socket } = useSocket();
  const [settings, setSettings] = useState<LocationPrivacy>(currentSettings);

  const handleSave = () => {
    onSettingsChange(settings);
    if (socket && user) {
      socket.emit('update-location-privacy', {
        userId: user.user.id,
        privacy: settings
      });
    }
    onClose();
  };

  const updateSettings = (key: keyof LocationPrivacy, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Location Privacy Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ghost Mode */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Ghost Mode</Label>
              <p className="text-sm text-gray-500">Hide your location from everyone</p>
            </div>
            <Switch
              checked={settings.ghostMode}
              onCheckedChange={(checked) => updateSettings('ghostMode', checked)}
            />
          </div>

          {/* Share with */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Share my location with</Label>
            
            <div className="space-y-2">
              {[
                { value: 'all_friends', label: 'All friends', description: 'Everyone you follow can see your location' },
                { value: 'selected_friends', label: 'Selected friends only', description: 'Only specific friends can see your location' },
                { value: 'no_one', label: 'No one', description: 'Hide your location from everyone except you' }
              ].map(option => (
                <label 
                  key={option.value}
                  className={`flex items-start p-3 rounded-lg border cursor-pointer ${
                    settings.shareWith === option.value ? 'border-blue-500 bg-blue-50' : 'border-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="shareWith"
                    value={option.value}
                    checked={settings.shareWith === option.value}
                    onChange={(e) => updateSettings('shareWith', e.target.value)}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Location sharing expires</Label>
            <select
              value={settings.expireAfter}
              onChange={(e) => updateSettings('expireAfter', e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="1hour">1 hour</option>
              <option value="4hours">4 hours</option>
              <option value="24hours">24 hours</option>
              <option value="until_turned_off">Until I turn it off</option>
            </select>
          </div>

          <Button className="w-full" onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}