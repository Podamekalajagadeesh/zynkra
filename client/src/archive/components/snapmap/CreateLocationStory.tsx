import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useUser } from '../../hooks/useUser';
import { useSocket } from '../../hooks/useSocket';

interface CreateLocationStoryProps {
  open: boolean;
  onClose: () => void;
  userLocation: { latitude: number; longitude: number } | null;
}

export function CreateLocationStory({ open, onClose, userLocation }: CreateLocationStoryProps) {
  const { user } = useUser();
  const { socket } = useSocket();
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !userLocation || !user) return;

    setIsSubmitting(true);
    
    // In a real app, you would upload the image to your storage first
    // For this implementation, we'll create an object URL
    const story = {
      userId: user.user.id,
      username: user.user.username,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      imageUrl: previewUrl,
      caption: caption,
      timestamp: new Date()
    };

    // Emit to socket server
    if (socket) {
      socket.emit('create-location-story', story);
    }

    setIsSubmitting(false);
    setCaption('');
    setImageFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Location Story</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!previewUrl ? (
            <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="story-image-upload"
              />
              <label htmlFor="story-image-upload">
                <Button variant="secondary" className="cursor-pointer">
                  Add Photo
                </Button>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Add a photo to share with your location
              </p>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button 
                variant="secondary" 
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setPreviewUrl(null);
                  setImageFile(null);
                }}
              >
                Change
              </Button>
            </div>
          )}

          <Textarea
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full"
          />

          {userLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>📍</span>
              <span>Sharing your current location</span>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={!imageFile || isSubmitting}
          >
            {isSubmitting ? 'Sharing...' : 'Share Location Story'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}