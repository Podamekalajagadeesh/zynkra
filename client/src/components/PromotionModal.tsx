import { X } from 'lucide-react';
import { useState } from 'react';
import { createSponsoredPost } from '../lib/api';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export function PromotionModal({ isOpen, onClose, postId }: PromotionModalProps) {
  const [budget, setBudget] = useState('');

  if (!isOpen) {
    return null;
  }

  const handlePromote = async () => {
    try {
      await createSponsoredPost(postId, parseFloat(budget));
      onClose();
    } catch (error) {
      console.error('Failed to promote post:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-lg rounded-2xl border border-dark-200 bg-white p-6 shadow-lg dark:border-dark-700 dark:bg-dark-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
            Promote Post
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-dark-600 transition-colors hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-4">
          <div className="mb-4">
            <label htmlFor="budget" className="block text-sm font-medium text-dark-700 dark:text-dark-300">
              Budget (in $)
            </label>
            <input
              type="number"
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="input-field mt-1"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handlePromote}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white"
            >
              Promote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}