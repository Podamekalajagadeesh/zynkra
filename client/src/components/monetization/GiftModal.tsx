import { useEffect, useState } from 'react';
import { getGifts, sendGift } from '../../lib/api';

export const GiftModal = ({ isOpen, onClose, recipientId, postId }: { isOpen: boolean, onClose: () => void, recipientId: string, postId?: string }) => {
  const [gifts, setGifts] = useState<any[]>([]);
  const [selectedGift, setSelectedGift] = useState<any | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      getGifts().then(setGifts);
    }
  }, [isOpen]);

  const handleSendGift = async () => {
    if (selectedGift) {
      await sendGift(recipientId, selectedGift.id, postId, message);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Send a KakaoTalk-style Digital Gift</h2>
        <p className="text-sm text-gray-500 mb-6">Popular in South Korea & SEA - send virtual gifts to your friends directly in chat!</p>
        <div className="grid grid-cols-4 gap-4 my-4">
          {gifts.map(gift => (
            <div key={gift.id} onClick={() => setSelectedGift(gift)} className={`p-3 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 ${selectedGift?.id === gift.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
              <img src={gift.imageUrl} alt={gift.name} className="w-16 h-16 mx-auto object-contain" />
              <p className="text-sm font-medium text-center mt-2">{gift.name}</p>
              <p className="text-xs text-gray-500 text-center">{gift.cost} coins</p>
            </div>
          ))}
        </div>
        {selectedGift && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-sm font-semibold text-purple-800">Selected: {selectedGift.name} ({selectedGift.cost} coins)</p>
          </div>
        )}
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Add an optional personal message with your gift..." className="w-full border rounded-lg p-3 mt-4 focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={2} />
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium">Cancel</button>
          <button onClick={handleSendGift} disabled={!selectedGift} className="px-5 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Send Gift</button>
        </div>
      </div>
    </div>
  );
};