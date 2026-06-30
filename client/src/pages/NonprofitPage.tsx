
import React from 'react';

import FundraisingTab from '../components/nonprofits/FundraisingTab';

import VolunteerMatchingTab from '../components/nonprofits/VolunteerMatchingTab';

import DonationDrivesTab from '../components/nonprofits/DonationDrivesTab';

const NonprofitPage = () => {
  const [activeTab, setActiveTab] = React.useState('fundraising');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Nonprofit Tools</h1>
      <div className="flex border-b">
        <button
          className={`px-4 py-2 ${
            activeTab === 'fundraising'
              ? 'border-b-2 border-blue-500'
              : ''
          }`}
          onClick={() => setActiveTab('fundraising')}
        >
          Fundraising
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'volunteer'
              ? 'border-b-2 border-blue-500'
              : ''
          }`}
          onClick={() => setActiveTab('volunteer')}
        >
          Volunteer Matching
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'drives' ? 'border-b-2 border-blue-500' : ''
          }`}
          onClick={() => setActiveTab('drives')}
        >
          Donation Drives
        </button>
      </div>
      <div className="py-4">
        {activeTab === 'fundraising' && <FundraisingTab />}
        {activeTab === 'volunteer' && <VolunteerMatchingTab />}
        {activeTab === 'drives' && <DonationDrivesTab />}
      </div>
    </div>
  );
};

export default NonprofitPage;