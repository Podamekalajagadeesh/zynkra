import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus } from 'lucide-react';
import { CommunityFlair } from '../../lib/types';

interface CreateCommunityFormProps {
  onCreateCommunity: (community: {
    name: string;
    description: string;
    isPrivate: boolean;
    isNsfw: boolean;
    flairs: CommunityFlair[];
    communityType?: 'general' | 'local' | 'professional' | 'fan' | 'other';
    location?: {
      city: string;
      state: string;
      zipCode: string;
      latitude: number;
      longitude: number;
      radius: number;
    };
  }) => void;
}

export const CreateCommunityForm = ({ onCreateCommunity }: CreateCommunityFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isNsfw, setIsNsfw] = useState(false);
  const [flairs, setFlairs] = useState<CommunityFlair[]>([]);
  const [newFlairName, setNewFlairName] = useState('');
  const [newFlairColor, setNewFlairColor] = useState('#3b82f6');
  const [newFlairTextColor, setNewFlairTextColor] = useState('#ffffff');
  const [communityType, setCommunityType] = useState<'general' | 'local' | 'professional' | 'fan' | 'other'>('general');
  // Location fields for local communities
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState(2); // Default 2 mile radius

  const addFlair = () => {
    if (newFlairName.trim()) {
      setFlairs([
        ...flairs,
        {
          id: Date.now().toString(),
          name: newFlairName,
          color: newFlairColor,
          textColor: newFlairTextColor,
        },
      ]);
      setNewFlairName('');
    }
  };

  const removeFlair = (id: string) => {
    setFlairs(flairs.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      // For local communities, get coordinates from zipcode (simplified mock - in real app use geocoding API)
      const location = communityType === 'local' && city && state && zipCode ? {
        city,
        state,
        zipCode,
        latitude: 40.7128, // Mock coordinates - would use geocoding in production
        longitude: -74.0060,
        radius
      } : undefined;

      onCreateCommunity({
        name,
        description,
        isPrivate,
        isNsfw,
        flairs,
        communityType,
        location,
      });
      // Reset form
      setName('');
      setDescription('');
      setIsPrivate(false);
      setIsNsfw(false);
      setFlairs([]);
      setCommunityType('general');
      setCity('');
      setState('');
      setZipCode('');
      setRadius(2);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full mb-4 gap-2">
          <Plus size={16} />
          Create Community
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Community</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Community Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., technology, gaming, cooking"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your community..."
              required
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Private Community</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isNsfw}
                onChange={(e) => setIsNsfw(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">NSFW</span>
            </label>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Add Community Flairs</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newFlairName}
                onChange={(e) => setNewFlairName(e.target.value)}
                placeholder="Flair name"
                className="flex-1"
              />
              <input
                type="color"
                value={newFlairColor}
                onChange={(e) => setNewFlairColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
                title="Background color"
              />
              <input
                type="color"
                value={newFlairTextColor}
                onChange={(e) => setNewFlairTextColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
                title="Text color"
              />
              <Button type="button" onClick={addFlair}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {flairs.map((flair) => (
                <span
                  key={flair.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
                  style={{ backgroundColor: flair.color, color: flair.textColor }}
                >
                  {flair.name}
                  <button
                    type="button"
                    onClick={() => removeFlair(flair.id)}
                    className="ml-1 hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Community Type</label>
            <select 
              value={communityType}
              onChange={(e) => setCommunityType(e.target.value as any)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
            >
              <option value="general">General Community</option>
              <option value="local">Local Neighborhood (Nextdoor-style)</option>
              <option value="professional">Professional Community (LinkedIn-style)</option>
              <option value="fan">Fan/Creator Community</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* Location fields - only show for local communities */}
          {communityType === 'local' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <h4 className="font-medium">Neighborhood Location</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">City</label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">State</label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">ZIP Code</label>
                  <Input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="ZIP Code"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Neighborhood Radius (miles)</label>
                  <Input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    min="1"
                    max="10"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your community will only be visible to users within this radius of your neighborhood.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full">Create Community</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};