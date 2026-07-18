import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

export function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      const response = await api.get(`/products/${id}`);
      const { name, description, price } = response.data;
      setName(name);
      setDescription(description);
      setPrice(price);
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.patch(`/products/${id}`, { name, description, price: parseFloat(price) });
    navigate('/marketplace/dashboard');
  };

  return (
    <PageShell>
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name">Product Name</label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label htmlFor="price">Price</label>
          <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </PageShell>
  );
}