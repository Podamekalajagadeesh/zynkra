import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface CollabApplication {
  id: string;
  pitch: string;
  proposedRate: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: string;
  opportunity: {
    title: string;
    brand: {
      name: string;
    };
  };
}

interface MyApplicationsListProps {
  applications: CollabApplication[];
}

export function MyApplicationsList({ applications }: MyApplicationsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
        <p className="text-gray-600">Start applying to brand collaboration opportunities to grow your partnerships.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Card key={application.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{application.opportunity.title}</h3>
                <p className="text-sm text-gray-600">{application.opportunity.brand.name}</p>
                <p className="text-sm text-gray-700 mt-2 line-clamp-2">{application.pitch}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span>Proposed rate: ${application.proposedRate.toLocaleString()}</span>
                  <span>Applied: {formatDate(application.appliedAt)}</span>
                </div>
              </div>
              <Badge className={getStatusColor(application.status)}>
                {application.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}