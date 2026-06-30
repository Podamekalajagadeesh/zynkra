import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import { Fundraiser } from '../../types';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { DonateModal } from '../../components/fundraisers/DonateModal';

const FundraiserPage = () => {
  const { id } = useParams<{ id: string }>();
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  useEffect(() => {
    const fetchFundraiser = async () => {
      try {
        const response = await api.get(`/fundraisers/${id}`);
        setFundraiser(response.data);
      } catch (error) {
        console.error('Error fetching fundraiser:', error);
      }
    };

    fetchFundraiser();
  }, [id]);

  if (!fundraiser) {
    return <div>Loading...</div>;
  }

  const progress = (fundraiser.currentAmount / fundraiser.goalAmount) * 100;

  return (
    <div className="container mx-auto p-4">
      <img src={fundraiser.coverImageUrl} alt={fundraiser.title} className="w-full h-96 object-cover rounded-lg mb-4" />
      <h1 className="text-3xl font-bold mb-2">{fundraiser.title}</h1>
      <p className="text-gray-600 mb-4">Organized by {fundraiser.organizer.displayName}</p>

      <div className="mb-4">
        <Progress value={progress} />
        <p className="text-sm text-gray-600 mt-2">
          ${fundraiser.currentAmount} raised of ${fundraiser.goalAmount}
        </p>
      </div>

      <p className="mb-4">{fundraiser.description}</p>

      <Button onClick={() => setIsDonateModalOpen(true)}>Donate Now</Button>

      <DonateModal
        isOpen={isDonateModalOpen}
        onClose={() => setIsDonateModalOpen(false)}
        fundraiserId={fundraiser.id}
      />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Donations</h2>
        <ul>
          {fundraiser.donations.map((donation) => (
            <li key={donation.id} className="mb-2">
              <p>
                <strong>{donation.donor.displayName}</strong> donated ${donation.amount}
              </p>
              {donation.message && <p className="text-gray-600">"{donation.message}"</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FundraiserPage;