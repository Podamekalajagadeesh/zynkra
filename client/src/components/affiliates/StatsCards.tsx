import React from 'react';

interface StatsCardsProps {
  stats: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    totalEarnings: number;
    pendingEarnings: number;
    availableEarnings: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Clicks',
      value: stats.totalClicks.toLocaleString(),
      icon: '👆',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Conversions',
      value: stats.totalConversions.toLocaleString(),
      icon: '✅',
      color: 'bg-green-50 text-green-700',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(2)}%`,
      icon: '📊',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Total Earnings',
      value: `$${stats.totalEarnings.toFixed(2)}`,
      icon: '💰',
      color: 'bg-yellow-50 text-yellow-700',
    },
    {
      title: 'Pending',
      value: `$${stats.pendingEarnings.toFixed(2)}`,
      icon: '⏳',
      color: 'bg-orange-50 text-orange-700',
    },
    {
      title: 'Available to Withdraw',
      value: `$${stats.availableEarnings.toFixed(2)}`,
      icon: '🏦',
      color: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${card.color} flex items-center justify-center text-2xl`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}