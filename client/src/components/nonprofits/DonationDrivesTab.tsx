import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import CreateDonationDriveForm from './CreateDonationDriveForm';

const DonationDrivesTab = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Donation Drives</h2>
        <Button onClick={() => setIsModalOpen(true)}>Create Drive</Button>
      </div>
      <p>
        This is where the donation drives tool will be displayed. This feature
        is currently under construction.
      </p>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Create Donation Drive</h2>
          <CreateDonationDriveForm />
        </div>
      </Modal>
    </div>
  );
};

export default DonationDrivesTab;