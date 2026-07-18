import React from 'react';
import CreateFundraiserForm from '../../components/nonprofits/CreateFundraiserForm';

const CreateFundraiserPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create a Fundraiser</h1>
      <CreateFundraiserForm />
    </div>
  );
};

export default CreateFundraiserPage;