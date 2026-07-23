import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { VolunteerOpportunity } from '../types';

const VolunteerOpportunitiesPage = () => {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await api.get('/volunteer-opportunities');
        setOpportunities(response.data);
      } catch (error) {
        console.error('Error fetching volunteer opportunities:', error);
      }
    };

    fetchOpportunities();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Volunteer Opportunities</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {opportunities.map((opportunity) => (
          <Link to={`/volunteer-opportunities/${opportunity.id}`} key={opportunity.id}>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold">{opportunity.title}</h3>
              <p className="text-sm text-gray-600">{opportunity.location}</p>
              <p className="text-sm text-gray-600">
                {new Date(opportunity.date).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default VolunteerOpportunitiesPage;