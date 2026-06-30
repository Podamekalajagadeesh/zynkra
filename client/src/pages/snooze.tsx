import { useEffect, useState } from 'react';
import { getSnoozed, unsnooze } from '../lib/api';

interface SnoozeItem {
  id: string;
  snoozedId: string;
  snoozedType: 'user' | 'group' | 'page';
  snoozeEndDate: string;
}

export const SnoozePage = () => {
  const [snoozedItems, setSnoozedItems] = useState<SnoozeItem[]>([]);

  useEffect(() => {
    getSnoozed().then(setSnoozedItems);
  }, []);

  const handleUnsnooze = async (id: string) => {
    await unsnooze(id);
    setSnoozedItems(snoozedItems.filter((item) => item.id !== id));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Snoozed Items</h1>
      <ul>
        {snoozedItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between p-2 border-b">
            <div>
              <p className="font-semibold">{item.snoozedId}</p>
              <p className="text-sm text-gray-500">{item.snoozedType} - Snoozed until {new Date(item.snoozeEndDate).toLocaleDateString()}</p>
            </div>
            <button onClick={() => handleUnsnooze(item.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Unsnooze
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};