import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ApplyToOpportunityModal } from './ApplyToOpportunityModal';

interface CollabOpportunity {
  id: string;
  title: string;
  description: string;
  budget: number;
  paymentType: 'fixed' | 'commission' | 'hybrid';
  category: string;
  minFollowers: number;
  deadline: string;
  status: string;
  brand: {
    name: string;
    logoUrl?: string;
  };
}

interface OpportunitiesListProps {
  opportunities: CollabOpportunity[];
  onRefresh: () => void;
}

export function OpportunitiesList({ opportunities, onRefresh }: OpportunitiesListProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<CollabOpportunity | null>(null);

  if (opportunities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">🤝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No collab opportunities yet</h3>
        <p className="text-gray-600">Check back later for new brand partnership opportunities.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <div className="space-y-6">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{opportunity.title}</h3>
                    <Badge variant="secondary">{opportunity.category}</Badge>
                    <Badge>${opportunity.budget.toLocaleString()}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">{opportunity.brand.name}</span>
                  </p>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{opportunity.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>Min. followers: {opportunity.minFollowers.toLocaleString()}</span>
                    <span>•</span>
                    <span>Payment: {opportunity.paymentType}</span>
                    <span>•</span>
                    <span>Deadline: {formatDate(opportunity.deadline)}</span>
                  </div>
                </div>
                <Button onClick={() => setSelectedOpportunity(opportunity)}>
                  Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedOpportunity && (
        <ApplyToOpportunityModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onSuccess={() => {
            setSelectedOpportunity(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}