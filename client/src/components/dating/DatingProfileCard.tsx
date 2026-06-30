import React from 'react';

const DatingProfileCard = ({ profile, onSwipe }) => {
  return (
    <div>
      <h2>{profile.user.displayName}</h2>
      <p>{profile.bio}</p>
      {/* Display photos, interests, etc. */}
      <button onClick={() => onSwipe(profile.user.id, 'like')}>Like</button>
      <button onClick={() => onSwipe(profile.user.id, 'dislike')}>Dislike</button>
    </div>
  );
};

export default DatingProfileCard;