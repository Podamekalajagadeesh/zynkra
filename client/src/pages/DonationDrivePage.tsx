import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { DonationDrive } from '../types';

const DonationDrivePage = () => {
  const { id } = useParams<{ id: string }>();
  const [drive, setDrive] = useState<DonationDrive | null>(null);

  useEffect(() => {
    const fetchDrive = async () => {
      try {
        const response = await api.get(`/donation-drives/${id}`);
        setDrive(response.data);
      } catch (error) {
        console.error('Error fetching donation drive:', error);
      }
    };

    fetchDrive();
  }, [id]);

  if (!drive) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{drive.title}</h1>
      <p className="mb-4">{drive.description}</p>
      <p className="mb-4">{drive.location}</p>
      <p className="mb-4">
        Ends on {new Date(drive.endDate).toLocaleDateString()}
      </p>
    </div>
  );
};

export default DonationDrivePage;