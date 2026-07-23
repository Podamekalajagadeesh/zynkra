import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMarketplaceListing } from '../../lib/api';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/useToast';

export function CreateListingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createMarketplaceListing({
        title,
        description,
        price: parseFloat(price),
        location,
        imageUrls,
      });
      toast({ title: 'Listing created successfully!' });
      navigate('/marketplace');
    } catch (error) {
      toast({ title: 'Error creating listing', description: 'Please try again.' });
    }
  };

  return (
    <PageShell>
      <h1 className="text-2xl font-bold mb-4">Create a New Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <Input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <Input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        {/* Basic image URL input for now, can be replaced with a file uploader */}
        <Input
          placeholder="Image URL"
          onChange={(e) => setImageUrls([e.target.value])}
        />
        <Button type="submit">Create Listing</Button>
      </form>
    </PageShell>
  );
}