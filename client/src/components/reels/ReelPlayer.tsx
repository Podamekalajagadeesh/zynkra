import { Post, UserProfile } from '../../lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Share2 } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { getProfile, shareReel, trackReelView } from '../../lib/api';
import { useEffect, useRef, useState } from 'react';
import { InsightsModal } from './InsightsModal';

interface ReelPlayerProps {
  reel: Post;
}

export function ReelPlayer({ reel }: ReelPlayerProps) {
  const { toast } = useToast();
  const [viewTracked, setViewTracked] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    getProfile().then(setUser);
  }, []);

  if (!reel.videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <p>This post is not a reel.</p>
      </div>
    );
  }

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime > 3 && !viewTracked) {
      trackReelView(reel.id);
      setViewTracked(true);
    }
  };

  const handleShare = async () => {
    try {
      await shareReel(reel.id);
      const reelUrl = `${window.location.origin}/reel/${reel.id}`;
      navigator.clipboard.writeText(reelUrl);
      toast({
        title: 'Link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to share reel',
        variant: 'destructive',
      });
    }
  };

  const isAuthor = user?.id === reel.user.id;

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="w-full h-full object-contain"
        autoPlay
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
      />
      <div className="absolute bottom-0 left-0 p-4 text-white bg-gradient-to-t from-black/50 to-transparent w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={reel.author.profilePhoto} />
              <AvatarFallback>{reel.author.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <p className="font-semibold">{reel.author.displayName}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthor && <InsightsModal reelId={reel.id} />}
            <button onClick={handleShare} className="p-2">
              <Share2 />
            </button>
          </div>
        </div>
        <p className="mt-2">{reel.content}</p>
      </div>
    </div>
  );
}