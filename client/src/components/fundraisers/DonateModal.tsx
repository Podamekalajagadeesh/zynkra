import React, { useState } from 'react';
import api from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundraiserId: string;
}

export const DonateModal = ({ isOpen, onClose, fundraiserId }: DonateModalProps) => {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleDonate = async () => {
    try {
      await api.post(`/fundraisers/${fundraiserId}/donations`, {
        amount: parseFloat(amount),
        message,
      });
      onClose();
      // In a real app, you'd probably want to show a success message
      // and refetch the fundraiser data to update the UI.
    } catch (error) {
      console.error('Error making donation:', error);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-lg font-bold">Make a Donation</h2>
        <div className="space-y-4 my-4">
          <Input placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Textarea placeholder="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleDonate}>Donate</Button>
        </div>
      </div>
    </div>
  );
};