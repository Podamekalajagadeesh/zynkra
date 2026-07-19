import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const INTEREST_OPTIONS = [
  'Music', 'Movies', 'Travel', 'Fitness', 'Food', 'Art',
  'Gaming', 'Reading', 'Outdoors', 'Tech', 'Sports', 'Pets',
];

const DatingOnboardingPage = () => {
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState(18);
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { get, post } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    // Prefill when editing an existing dating profile.
    get('/dating/profile')
      .then((profile) => {
        if (!profile) return;
        setBio(profile.bio ?? '');
        setGender(profile.gender ?? '');
        setAge(profile.age ?? 18);
        setLocation(profile.location ?? '');
        setInterests(profile.interests ?? []);
      })
      .catch(() => {});
  }, [get]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await post('/dating/profile', { bio, gender, age, location, interests });
      navigate('/dating/discover');
    } catch (error) {
      console.error('Failed to save dating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dating Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="dating-bio">Bio</label>
          <textarea
            id="dating-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Tell potential matches about yourself"
            className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="dating-gender">Gender</label>
            <select
              id="dating-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
            >
              <option value="">Prefer not to say</option>
              <option value="woman">Woman</option>
              <option value="man">Man</option>
              <option value="nonbinary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="dating-age">Age</label>
            <input
              id="dating-age"
              type="number"
              min={18}
              max={120}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="dating-location">Location</label>
          <input
            id="dating-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City"
            className="w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm dark:border-dark-700 dark:bg-dark-900"
          />
        </div>

        <div>
          <span className="block text-sm font-medium mb-2">Interests</span>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                  interests.includes(interest)
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'border-dark-200 text-dark-600 hover:bg-dark-100 dark:border-dark-700 dark:text-dark-300 dark:hover:bg-dark-800'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-primary-500 py-3 font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default DatingOnboardingPage;
