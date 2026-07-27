import { useState, useRef, useEffect } from 'react';
import { Post } from '../../lib/types';
import { API_BASE_URL } from '../../lib/api';

interface ShortsPlayerProps {
  shorts: Post[];
}

const ShortsPlayer = ({ shorts }: ShortsPlayerProps) => {
  const [currentShort, setCurrentShort] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (videoRefs.current[currentShort]) {
      videoRefs.current[currentShort]?.play();
    }
  }, [currentShort]);

  const handleScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    const nextShort = currentShort + (event.deltaY > 0 ? 1 : -1);
    if (nextShort >= 0 && nextShort < shorts.length) {
      if (videoRefs.current[currentShort]) {
        videoRefs.current[currentShort]?.pause();
      }
      setCurrentShort(nextShort);
    }
  };

  return (
    <div
      className="relative h-[calc(100vh-120px)] w-full snap-y snap-mandatory overflow-y-scroll"
      onWheel={handleScroll}
    >
      {shorts.map((short, index) => (
        <div
          key={short.id}
          className="flex h-full w-full snap-start items-center justify-center"
        >
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            src={`${API_BASE_URL}${short.videoUrl || short.media?.[0]?.url || ''}`}
            className="h-full w-auto"
            loop
            muted={false}
          />
        </div>
      ))}
    </div>
  );
};

export default ShortsPlayer;