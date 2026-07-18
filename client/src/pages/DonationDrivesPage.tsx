import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { DonationDrive } from '../types';

const DonationDrivesPage = () => {
  const [drives, setDrives] = useState<DonationDrive[]>([]);

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const response = await api.get('/donation-drives');
        setDrives(response.data);
      } catch (error) {
        console.error('Error fetching donation drives:', error);
      }
    };

    fetchDrives();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Donation Drives</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {drives.map((drive) => (
          <Link to={`/donation-drives/${drive.id}`} key={drive.id}>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold">{drive.title}</h3>
              <p className="text-sm text-gray-600">{drive.location}</p>
              <p className="text-sm text-gray-600">
                Ends on {new Date(drive.endDate).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DonationDrivesPage;