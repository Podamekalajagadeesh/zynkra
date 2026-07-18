
import React from 'react';
import SafetyCheck from './SafetyCheck';

const CrisisEventDetails: React.FC = () => {
  // In a real application, you would fetch the crisis event details and friends list
  const crisisEventId = 'example-crisis-id';
  const friends = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Peter Jones' },
  ];
  const userId = 'current-user-id'; // In a real app, this would come from auth context

  return (
    <div>
      <h1>Crisis Event Details</h1>
      <p>This is where the details of a single crisis event will be displayed.</p>
      <SafetyCheck crisisEventId={crisisEventId} friends={friends} userId={userId} />
    </div>
  );
};

export default CrisisEventDetails;