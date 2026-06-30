import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { UserProfile } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/useToast';
import { useIsPremium } from '../hooks/useIsPremium';
import { Plus, Trash2, X } from 'lucide-react';

interface CustomAudience {
  id: string;
  name: string;
  userIds: string[];
}

export function CustomAudiencesSettings() {
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [customAudiences, setCustomAudiences] = useState<CustomAudience[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAudienceName, setNewAudienceName] = useState('');
  const [editingAudience, setEditingAudience] = useState<CustomAudience | null>(null);
  const { addToast } = useToast();
  const isPremium = useIsPremium();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [followersRes, audiencesRes] = await Promise.all([
          api.get('/users/me/followers'),
          api.get('/users/me/custom-audiences'),
        ]);
        setFollowers(followersRes.data);
        setCustomAudiences(audiencesRes.data);
      } catch (error) {
        addToast('Failed to fetch data. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (isPremium) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [addToast, isPremium]);

  const handleCreateAudience = async () => {
    if (!newAudienceName.trim()) {
      addToast('Please enter an audience name', 'error');
      return;
    }

    try {
      const newAudience: CustomAudience = {
        id: crypto.randomUUID(),
        name: newAudienceName.trim(),
        userIds: [],
      };
      
      await api.post('/users/me/custom-audiences', { name: newAudience.name });
      setCustomAudiences([...customAudiences, newAudience]);
      setNewAudienceName('');
      addToast('Custom audience created successfully', 'success');
    } catch (error) {
      addToast('Failed to create custom audience. Please try again.', 'error');
    }
  };

  const handleDeleteAudience = async (audienceId: string) => {
    const originalAudiences = [...customAudiences];
    try {
      await api.delete(`/users/me/custom-audiences/${audienceId}`);
      setCustomAudiences(customAudiences.filter(a => a.id !== audienceId));
      addToast('Custom audience deleted', 'success');
    } catch (error) {
      setCustomAudiences(originalAudiences);
      addToast('Failed to delete custom audience. Please try again.', 'error');
    }
  };

  const handleToggleUserInAudience = (userId: string) => {
    if (!editingAudience) return;

    const isInAudience = editingAudience.userIds.includes(userId);
    const updatedUserIds = isInAudience
      ? editingAudience.userIds.filter(id => id !== userId)
      : [...editingAudience.userIds, userId];
    
    const updatedAudience = { ...editingAudience, userIds: updatedUserIds };
    setEditingAudience(updatedAudience);
  };

  const handleSaveAudience = async () => {
    if (!editingAudience) return;
    
    const originalAudiences = [...customAudiences];
    try {
      await api.put(`/users/me/custom-audiences/${editingAudience.id}`, { 
        name: editingAudience.name,
        userIds: editingAudience.userIds 
      });
      setCustomAudiences(customAudiences.map(a => 
        a.id === editingAudience.id ? editingAudience : a
      ));
      setEditingAudience(null);
      addToast('Custom audience updated successfully', 'success');
    } catch (error) {
      setCustomAudiences(originalAudiences);
      addToast('Failed to update custom audience. Please try again.', 'error');
    }
  };

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Custom Audiences</h1>
        <div className="p-6 border rounded-lg bg-gray-50 dark:bg-dark-700">
          <p className="text-center text-dark-500 dark:text-dark-400">
            Unlimited custom audience lists are a premium feature. Upgrade to access this feature.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto py-8">Loading...</div>;
  }

  if (editingAudience) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Edit {editingAudience.name}</h1>
          <button onClick={() => setEditingAudience(null)} className="text-dark-500">
            <X size={24} />
          </button>
        </div>
        
        <Input
          value={editingAudience.name}
          onChange={(e) => setEditingAudience({ ...editingAudience, name: e.target.value })}
          className="mb-6"
        />

        <div className="space-y-4 mb-6">
          {followers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-sm text-dark-500 dark:text-dark-400">{user.displayName}</p>
                </div>
              </div>
              <Button
                variant={editingAudience.userIds.includes(user.id) ? 'secondary' : 'primary'}
                onClick={() => handleToggleUserInAudience(user.id)}
              >
                {editingAudience.userIds.includes(user.id) ? 'Remove' : 'Add'}
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={handleSaveAudience}>Save Audience</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Custom Audiences</h1>
      <p className="text-dark-500 dark:text-dark-400 mb-6">
        Create unlimited custom audience lists to share your stories with specific groups of people.
      </p>

      {/* Create new audience */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="New audience name"
          value={newAudienceName}
          onChange={(e) => setNewAudienceName(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleCreateAudience}>
          <Plus size={16} className="mr-2" />
          Create
        </Button>
      </div>

      {/* List of existing audiences */}
      <div className="space-y-4">
        {customAudiences.map((audience) => (
          <div key={audience.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-semibold">{audience.name}</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">
                {audience.userIds.length} members
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditingAudience(audience)}>
                Edit
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteAudience(audience.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}

        {customAudiences.length === 0 && (
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-dark-700 text-center">
            <p className="text-dark-500 dark:text-dark-400">No custom audiences yet. Create your first one above!</p>
          </div>
        )}
      </div>
    </div>
  );
}