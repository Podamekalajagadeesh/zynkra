import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import CreateVolunteerOpportunityForm from './CreateVolunteerOpportunityForm';

const VolunteerMatchingTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Volunteer Opportunities</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          Create Opportunity
        </Button>
      </div>
      <p>
        This is where the volunteer matching tool will be displayed. This
        feature is currently under construction.
      </p>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Create Volunteer Opportunity</h2>
          <CreateVolunteerOpportunityForm />
        </div>
      </Modal>
    </div>
  );
};

export default VolunteerMatchingTab;