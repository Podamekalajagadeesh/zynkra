import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const CreateFundraiserForm = () => {
  const history = useHistory();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/fundraisers', {
        title,
        description,
        goalAmount: parseFloat(goalAmount),
        endDate: new Date(endDate),
        coverImageUrl,
      });
      history.push(`/fundraisers/${response.data.id}`);
    } catch (error) {
      console.error('Error creating fundraiser:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        placeholder="Goal Amount"
        type="number"
        value={goalAmount}
        onChange={(e) => setGoalAmount(e.target.value)}
      />
      <Input
        placeholder="End Date"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
      <Input
        placeholder="Cover Image URL"
        value={coverImageUrl}
        onChange={(e) => setCoverImageUrl(e.target.value)}
      />
      <Button type="submit">Create Fundraiser</Button>
    </form>
  );
};

export default CreateFundraiserForm;