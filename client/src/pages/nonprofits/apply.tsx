
import React from 'react';
import { NonprofitApplicationForm } from '../../components/nonprofits/NonprofitApplicationForm';
import { PageShell } from '../../components/PageShell';

const ApplyForNonprofitPage: React.FC = () => {
  return (
    <PageShell>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Apply for Nonprofit Status</h1>
        <p className="mb-8">
          Fill out the form below to apply for nonprofit status for your
          organization.
        </p>
        <NonprofitApplicationForm />
      </div>
    </PageShell>
  );
};

export default ApplyForNonprofitPage;