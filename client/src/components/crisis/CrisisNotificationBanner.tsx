
import React from 'react';

const CrisisNotificationBanner: React.FC = () => {
  return (
    <div style={{ backgroundColor: 'red', color: 'white', padding: '10px', textAlign: 'center' }}>
      <strong>Crisis Alert:</strong> A major event is happening in your area. Click here for more information.
    </div>
  );
};

export default CrisisNotificationBanner;