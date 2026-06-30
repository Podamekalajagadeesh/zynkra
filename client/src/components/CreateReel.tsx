import { useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { createPost } from '../lib/api';
import { Button } from './ui/button';
import { Video as VideoIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReelEffect } from '../lib/types';
import { ReelEffects } from './reels/ReelEffects';

export function CreateReel() {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<ReelEffect | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mediaFile) {
      addToast('Please select a video to upload.', 'error');
      return;
    }

    try {
      const post = await createPost(
        {
          content,
          media: [{ url: '', type: 'video' }],
          postType: 'reel',
        },
        mediaFile,
        selectedEffect?.id
      );
      addToast('Reel created successfully!', 'success');
      navigate(`/post/${post.id}`);
    } catch (error) {
      addToast('Failed to create reel.', 'error');
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Create Reel</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Write a caption..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            <VideoIcon className="mr-2" />
            Select Video
          </Button>
        </div>
        {mediaPreview && (
          <div className="mb-4">
            <video src={mediaPreview} controls className="w-full rounded" />
            <Button
              type="button"
              onClick={handleRemoveMedia}
              variant="destructive"
              className="mt-2"
            >
              Remove Video
            </Button>
          </div>
        )}
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Select Effect</h3>
          <ReelEffects onSelectEffect={setSelectedEffect} />
        </div>
        <Button type="submit">Create Reel</Button>
      </form>
    </div>
  );
}