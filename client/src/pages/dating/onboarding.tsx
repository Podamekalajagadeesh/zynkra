import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';

const DatingOnboardingPage = () => {
  const [formData, setFormData] = useState({
    bio: '',
    interests: [],
    datingPhotos: [],
    gender: '',
    age: 18,
    location: '',
    preferences: {},
  });
  const { post } = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await post('/dating/profile', formData);
    // Redirect to discovery page
  };

  return (
    <div>
      <h1>Dating Onboarding</h1>
      <form onSubmit={handleSubmit}>
        {/* Form fields for bio, interests, etc. */}
        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
};

export default DatingOnboardingPage;