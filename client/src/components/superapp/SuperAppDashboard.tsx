import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { MobilePayments } from './MobilePayments';
import { UtilityBillPayments } from './UtilityBillPayments';
import { RideHailing } from './RideHailing';
import { Wallet, Receipt, Car } from 'lucide-react';

export function SuperAppDashboard() {
  const [activeTab, setActiveTab] = useState('payments');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Super App Services</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Access payments, utilities, and transportation all in one place
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Wallet size={16} />
            <span className="hidden sm:inline">Mobile Payments</span>
            <span className="sm:hidden">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="bills" className="flex items-center gap-2">
            <Receipt size={16} />
            <span className="hidden sm:inline">Utility Bills</span>
            <span className="sm:hidden">Bills</span>
          </TabsTrigger>
          <TabsTrigger value="rides" className="flex items-center gap-2">
            <Car size={16} />
            <span className="hidden sm:inline">Ride-Hailing</span>
            <span className="sm:hidden">Rides</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-0">
          <MobilePayments />
        </TabsContent>

        <TabsContent value="bills" className="mt-0">
          <UtilityBillPayments />
        </TabsContent>

        <TabsContent value="rides" className="mt-0">
          <RideHailing />
        </TabsContent>
      </Tabs>
    </div>
  );
}