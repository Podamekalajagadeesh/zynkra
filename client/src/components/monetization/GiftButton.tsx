import { useState } from 'react';
import { Gift } from 'lucide-react';
import { GiftModal } from './GiftModal';

export const GiftButton = ({ recipientId, postId }: { recipientId: string, postId?: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
        <Gift size={20} />
        <span>Gift</span>
      </button>
      <GiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipientId={recipientId}
        postId={postId}
      />
    </>
  );
};