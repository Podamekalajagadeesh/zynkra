import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useIsPremium } from '../../hooks/useIsPremium';

const AdPreferences = () => {
  const isPremium = useIsPremium();
  const [interestTopics, setInterestTopics] = useState<string[]>([]);
  const [showTargetedAds, setShowTargetedAds] = useState(!isPremium);
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    const fetchAdPreferences = async () => {
      try {
        const { data } = await api.get('/ad-preferences');
        setInterestTopics(Array.isArray(data?.interestTopics) ? data.interestTopics : []);
        setShowTargetedAds(Boolean(data?.showTargetedAds));
      } catch (error) {
        console.error('Error fetching ad preferences:', error);
      }
    };

    fetchAdPreferences();
  }, []);

  const handleUpdate = async () => {
      try {
        await api.put('/ad-preferences', {
          interestTopics,
          showTargetedAds,
        });
      } catch (error) {
        console.error('Error updating ad preferences:', error);
      }
  };

  const addTopic = () => {
    if (newTopic && !interestTopics.includes(newTopic)) {
      setInterestTopics([...interestTopics, newTopic]);
      setNewTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setInterestTopics(interestTopics.filter((topic) => topic !== topicToRemove));
  };

  return (
    <div>
      <h3>Ad Preferences</h3>
      {isPremium ? (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-green-700 dark:text-green-300">🎉 You're a premium subscriber! All ads are automatically disabled for you.</p>
        </div>
      ) : (
      <div>
        <label>
          <input
            type="checkbox"
            checked={showTargetedAds}
            onChange={(e) => setShowTargetedAds(e.target.checked)}
          />
          Show targeted ads
        </label>
      </div>
      )}
      <div>
        <h4>Interest Topics</h4>
        <ul>
          {interestTopics.map((topic) => (
            <li key={topic}>
              {topic}
              <button onClick={() => removeTopic(topic)}>Remove</button>
            </li>
          ))}
        </ul>
        <div>
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Add a topic"
          />
          <button onClick={addTopic}>Add</button>
        </div>
      </div>
      {!isPremium && <button onClick={handleUpdate}>Save Changes</button>}
    </div>
  );
};

export default AdPreferences;