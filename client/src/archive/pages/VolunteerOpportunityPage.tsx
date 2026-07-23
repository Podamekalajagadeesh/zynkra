import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { VolunteerOpportunity } from '../types';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';

const VolunteerOpportunityPage = () => {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<VolunteerOpportunity | null>(
    null
  );
  const { addToast } = useToast();

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const response = await api.get(`/volunteer-opportunities/${id}`);
        setOpportunity(response.data);
      } catch (error) {
        console.error('Error fetching volunteer opportunity:', error);
        addToast('Failed to load volunteer opportunity', 'error');
      }
    };

    fetchOpportunity();
  }, [id, addToast]);

  const handleApply = async () => {
    try {
      await api.post(`/volunteer-opportunities/${id}/apply`);
      addToast('Successfully applied to volunteer opportunity!', 'success');
    } catch (error) {
      console.error('Error applying to volunteer opportunity:', error);
      addToast('Failed to apply. Please try again.', 'error');
    }
  };

  if (!opportunity) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{opportunity.title}</h1>
      <p className="mb-4">{opportunity.description}</p>
      <p className="mb-4">{opportunity.location}</p>
      <p className="mb-4">
        {new Date(opportunity.date).toLocaleDateString()}
      </p>
      <Button onClick={handleApply}>Apply</Button>
    </div>
  );
};

export default VolunteerOpportunityPage;