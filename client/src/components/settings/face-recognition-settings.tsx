import { useState } from 'react';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { api } from '../../lib/api';

export function FaceRecognitionSettings() {
  const [faceRecognitionEnabled, setFaceRecognitionEnabled] = useState(false);

  const handleFaceRecognitionToggle = async () => {
            try {
              await api.patch('/users/me/face-recognition', {
                isFaceRecognitionEnabled: !faceRecognitionEnabled,
              });
              setFaceRecognitionEnabled(!faceRecognitionEnabled);
              toast.success('Face recognition setting updated.');
            } catch (error) {
              console.error('Failed to update face recognition setting', error);
              toast.error('Failed to update face recognition setting.');
            }
          };

  return (
    <div className="surface-soft rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-lg">Face Recognition</p>
          <p className="text-sm text-dark-500 dark:text-dark-400">
            Allow us to use face recognition to identify you in photos and videos.
          </p>
        </div>
        <Switch
          checked={faceRecognitionEnabled}
          onCheckedChange={handleFaceRecognitionToggle}
        />
      </div>
    </div>
  );
}