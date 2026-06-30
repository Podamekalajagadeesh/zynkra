import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Fundraiser } from '../types';
import { Button } from '../components/ui/button';

const FundraisersDiscoveryPage = () => {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);

  useEffect(() => {
    const fetchFundraisers = async () => {
      try {
        const response = await api.get('/fundraisers');
        setFundraisers(response.data);
      } catch (error) {
        console.error('Error fetching fundraisers:', error);
      }
    };

    fetchFundraisers();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Fundraisers</h1>
        <Link to="/fundraisers/create">
          <Button>Create Fundraiser</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fundraisers.map((fundraiser) => (
          <Link to={`/fundraisers/${fundraiser.id}`} key={fundraiser.id}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img src={fundraiser.coverImageUrl} alt={fundraiser.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold">{fundraiser.title}</h3>
                <p className="text-sm text-gray-600">
                  ${fundraiser.currentAmount} raised of ${fundraiser.goalAmount}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FundraisersDiscoveryPage;