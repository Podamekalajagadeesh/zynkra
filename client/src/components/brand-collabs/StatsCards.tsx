import React from 'react';
import { Card, CardContent } from '../../ui/card';

interface StatsCardsProps {
  stats: {
    totalBrands: number;
    totalOpportunities: number;
    totalApplications: number;
    acceptedApplications: number;
    creatorApplications: number;
    creatorAccepted: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Your Brands',
      value: stats.totalBrands,
      description: 'Registered brands',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Active Opportunities',
      value: stats.totalOpportunities,
      description: 'Collab opportunities created',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      description: 'Applications received',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Accepted Collabs',
      value: stats.acceptedApplications,
      description: 'Successfully partnered',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Your Applications',
      value: stats.creatorApplications,
      description: 'Opportunities you applied to',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Your Accepted Collabs',
      value: stats.creatorAccepted,
      description: 'Collabs you\'ve been selected for',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.bgColor} border-0`}>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
            <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}