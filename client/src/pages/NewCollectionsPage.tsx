
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/useToast';

const NewCollectionPage = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/collections', { name });
      addToast('Collection created!', 'success');
      navigate('/collections');
    } catch (error) {
      addToast('Failed to create collection', 'error');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New Collection</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Collection Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
};

export default NewCollectionPage;