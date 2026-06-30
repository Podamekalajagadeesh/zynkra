import React from 'react';
import PageShell from '../components/PageShell';
import DigitalTwinPersona from '../components/digital-twin/DigitalTwinPersona';

const DigitalTwinPage: React.FC = () => {
  return (
    <PageShell>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-950 dark:to-gray-90">
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Digital Twin Personas</h1>
            <p className="text-xl text-muted-foreground">
              Lifelike AI replicas of yourself that represent you in social spaces when you're unavailable, aligned with your values.
            </p>
          </div>
          <DigitalTwinPersona />
        </div>
      </div>
    </PageShell>
  );
};

export default DigitalTwinPage;