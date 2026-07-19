import React from 'react';
import { Heart, X, MapPin } from 'lucide-react';

interface DatingProfileCardProps {
  profile: {
    bio: string;
    interests: string[];
    age: number | null;
    location: string | null;
    user: { id: string; displayName?: string | null; username?: string | null };
  };
  onSwipe: (userId: string, type: 'like' | 'dislike') => void;
}

const DatingProfileCard = ({ profile, onSwipe }: DatingProfileCardProps) => {
  const name = profile.user.displayName || profile.user.username || 'Anonymous';

  return (
    <div className="rounded-2xl border border-dark-200 bg-white p-6 shadow-sm dark:border-dark-700 dark:bg-dark-800">
      <div className="flex items-baseline gap-2">
        <h2 className="text-xl font-semibold">{name}</h2>
        {profile.age && <span className="text-lg text-dark-500">{profile.age}</span>}
      </div>
      {profile.location && (
        <p className="mt-1 flex items-center gap-1 text-sm text-dark-500">
          <MapPin size={14} />
          {profile.location}
        </p>
      )}
      {profile.bio && <p className="mt-3 text-sm whitespace-pre-wrap">{profile.bio}</p>}
      {profile.interests?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-dark-100 px-3 py-1 text-xs text-dark-600 dark:bg-dark-700 dark:text-dark-300"
            >
              {interest}
            </span>
          ))}
        </div>
      )}
      <div className="mt-5 flex justify-center gap-4">
        <button
          onClick={() => onSwipe(profile.user.id, 'dislike')}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-dark-200 text-dark-500 transition-colors hover:bg-dark-100 dark:border-dark-700 dark:hover:bg-dark-700"
          aria-label="Pass"
        >
          <X size={22} />
        </button>
        <button
          onClick={() => onSwipe(profile.user.id, 'like')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-500 text-white transition-colors hover:bg-pink-600"
          aria-label="Like"
        >
          <Heart size={22} />
        </button>
      </div>
    </div>
  );
};

export default DatingProfileCard;
