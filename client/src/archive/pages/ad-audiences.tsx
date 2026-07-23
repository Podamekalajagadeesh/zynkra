
import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { X } from 'lucide-react';

type AdAudience = {
  id: number;
  name: string;
  locations: string[];
  age_range: number[];
  gender: string;
  interests: string[];
};

const AdAudienceForm = ({ adAudience, onSave, onCancel }) => {
  const [name, setName] = useState(adAudience?.name || '');
  const [locations, setLocations] = useState(adAudience?.locations?.join(', ') || '');
  const [age_range, setAgeRange] = useState(adAudience?.age_range?.join('-') || '');
  const [gender, setGender] = useState(adAudience?.gender || 'all');
  const [interests, setInterests] = useState(adAudience?.interests?.join(', ') || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAdAudience = {
      name,
      locations: locations.split(',').map(s => s.trim()),
      age_range: age_range.split('-').map(s => parseInt(s.trim(), 10)),
      gender,
      interests: interests.split(',').map(s => s.trim()),
    };
    onSave(newAdAudience);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onCancel}>
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 dark:bg-dark-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{adAudience ? 'Edit' : 'Create'} Ad Audience</h2>
          <button type="button" onClick={onCancel} className="text-dark-500 dark:text-dark-400">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-dark-700 dark:text-light-100 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border-dark-300 bg-dark-100 p-2 dark:border-dark-600 dark:bg-dark-700"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="locations" className="block text-sm font-medium text-dark-700 dark:text-light-100 mb-2">
              Locations (comma-separated)
            </label>
            <input
              id="locations"
              type="text"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              className="w-full rounded-md border-dark-300 bg-dark-100 p-2 dark:border-dark-600 dark:bg-dark-700"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="age_range" className="block text-sm font-medium text-dark-700 dark:text-light-100 mb-2">
              Age Range (e.g., 18-65)
            </label>
            <input
              id="age_range"
              type="text"
              value={age_range}
              onChange={(e) => setAgeRange(e.target.value)}
              className="w-full rounded-md border-dark-300 bg-dark-100 p-2 dark:border-dark-600 dark:bg-dark-700"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="gender" className="block text-sm font-medium text-dark-700 dark:text-light-100 mb-2">
              Gender
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-md border-dark-300 bg-dark-100 p-2 dark:border-dark-600 dark:bg-dark-700"
            >
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="interests" className="block text-sm font-medium text-dark-700 dark:text-light-100 mb-2">
              Interests (comma-separated)
            </label>
            <input
              id="interests"
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full rounded-md border-dark-300 bg-dark-100 p-2 dark:border-dark-600 dark:bg-dark-700"
            />
          </div>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </form>
      </div>
    </div>
  );
};

export const AdAudiencesPage = () => {
  const [adAudiences, setAdAudiences] = useState<AdAudience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedAdAudience, setSelectedAdAudience] = useState<AdAudience | null>(null);

  const fetchAdAudiences = () => {
    setLoading(true);
    api.get('/ad-audiences')
      .then((response) => {
        setAdAudiences(response.data);
      })
      .catch((err) => {
        console.error('Failed to fetch ad audiences:', err);
        setError('Failed to fetch ad audiences.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdAudiences();
  }, []);

  const handleSave = (adAudience: AdAudience) => {
    const request = selectedAdAudience
      ? api.put(`/ad-audiences/${selectedAdAudience.id}`, adAudience)
      : api.post('/ad-audiences', adAudience);

    request
      .then(() => {
        setShowForm(false);
        setSelectedAdAudience(null);
        fetchAdAudiences();
      })
      .catch((err) => {
        console.error('Failed to save ad audience:', err);
        setError('Failed to save ad audience.');
      });
  };

  const handleDelete = (id: number) => {
    api.delete(`/ad-audiences/${id}`)
      .then(() => {
        fetchAdAudiences();
      })
      .catch((err) => {
        console.error('Failed to delete ad audience:', err);
        setError('Failed to delete ad audience.');
      });
  };

  return (
    <PageShell title="Ad Audiences">
      {showForm && (
        <AdAudienceForm
          adAudience={selectedAdAudience}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setSelectedAdAudience(null);
          }}
        />
      )}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ad Audiences</h2>
            <Button onClick={() => setShowForm(true)}>Create Audience</Button>
          </div>
          <ul>
            {adAudiences.map((adAudience) => (
              <li key={adAudience.id} className="flex justify-between items-center mb-2">
                {adAudience.name}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAdAudience(adAudience);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => handleDelete(adAudience.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageShell>
  );
};