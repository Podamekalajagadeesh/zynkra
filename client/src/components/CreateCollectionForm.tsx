
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CreateCollectionFormProps {
  onCreate: (name: string) => void;
}

export const CreateCollectionForm = ({
  onCreate,
}: CreateCollectionFormProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New collection name"
      />
      <Button type="submit">Create</Button>
    </form>
  );
};