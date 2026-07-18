import { useState, useEffect } from 'react';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/useToast';
import { createPage } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export function CreatePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleCreatePage = async () => {
    try {
      const newPage = await createPage({ name, description });
      addToast('Page created successfully!', 'success');
      navigate(`/pages/${newPage.id}`);
    } catch (error) {
      addToast('Failed to create page', 'error');
    }
  };

  return (
    <PageShell title="Create a New Page">
      <div className="space-y-4">
        <Input
          placeholder="Page Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder="Page Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button onClick={handleCreatePage}>Create Page</Button>
      </div>
    </PageShell>
  );
}