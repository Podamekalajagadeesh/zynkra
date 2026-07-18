import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Zap, Droplets, Wifi, Tv, Phone, Car, Building2, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useToast } from '../../hooks/useToast';

interface Bill {
  id: string;
  type: 'electricity' | 'water' | 'internet' | 'cable' | 'mobile' | 'gas';
  provider: string;
  accountNumber: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
}

interface SavedBill {
  id: string;
  type: string;
  provider: string;
  accountNumber: string;
  nickname: string;
}

const billTypeIcons: Record<string, React.ReactNode> = {
  electricity: <Zap className="text-yellow-500" size={24} />,
  water: <Droplets className="text-blue-500" size={24} />,
  internet: <Wifi className="text-green-500" size={24} />,
  cable: <Tv className="text-purple-500" size={24} />,
  mobile: <Phone className="text-orange-500" size={24} />,
  gas: <Car className="text-red-500" size={24} />
};

const billTypeNames: Record<string, string> = {
  electricity: 'Electricity',
  water: 'Water',
  internet: 'Internet',
  cable: 'Cable TV',
  mobile: 'Mobile Phone',
  gas: 'Gas'
};

export function UtilityBillPayments() {
  const { addToast } = useToast();
  const [bills, setBills] = useState<Bill[]>([
    {
      id: '1',
      type: 'electricity',
      provider: 'National Grid',
      accountNumber: 'NG-789456123',
      amount: 85.50,
      dueDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
      isPaid: false
    },
    {
      id: '2',
      type: 'internet',
      provider: 'Comcast',
      accountNumber: 'CC-123456789',
      amount: 65.00,
      dueDate: new Date(Date.now() + 86400000 * 10),
      isPaid: false
    },
    {
      id: '3',
      type: 'mobile',
      provider: 'Verizon',
      accountNumber: 'VZ-987654321',
      amount: 45.00,
      dueDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
      isPaid: true
    }
  ]);

  const [savedBills] = useState<SavedBill[]>([
    { id: '1', type: 'electricity', provider: 'National Grid', accountNumber: 'NG-789456123', nickname: 'Home Electricity' },
    { id: '2', type: 'internet', provider: 'Comcast', accountNumber: 'CC-123456789', nickname: 'Home Internet' }
  ]);

  const [newBill, setNewBill] = useState({
    type: '',
    provider: '',
    accountNumber: '',
    nickname: '',
    amount: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);

  const handlePayBill = async (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBills(bills.map(b => 
      b.id === billId ? { ...b, isPaid: true } : b
    ));
    setIsProcessing(false);
    addToast(`Successfully paid $${bill.amount} for ${bill.provider}`, 'success');
  };

  const handleAddNewBill = async () => {
    if (!newBill.type || !newBill.provider || !newBill.accountNumber) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    // In a real app, this would save to backend
    setShowAddBill(false);
    setNewBill({ type: '', provider: '', accountNumber: '', nickname: '', amount: '' });
    addToast('Bill added successfully!', 'success');
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const upcomingBills = bills.filter(b => !b.isPaid);
  const paidBills = bills.filter(b => b.isPaid);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
          <Zap className="mx-auto mb-2 text-yellow-500" size={32} />
          <span className="text-sm">Electricity</span>
        </Card>
        <Card className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
          <Droplets className="mx-auto mb-2 text-blue-500" size={32} />
          <span className="text-sm">Water</span>
        </Card>
        <Card className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
          <Wifi className="mx-auto mb-2 text-green-500" size={32} />
          <span className="text-sm">Internet</span>
        </Card>
        <Card className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
          <Tv className="mx-auto mb-2 text-purple-500" size={32} />
          <span className="text-sm">Cable</span>
        </Card>
        <Card className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
          <Phone className="mx-auto mb-2 text-orange-500" size={32} />
          <span className="text-sm">Mobile</span>
        </Card>
        <Dialog open={showAddBill} onOpenChange={setShowAddBill}>
          <DialogTrigger asChild>
            <Card className="p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <Building2 className="mx-auto mb-2 text-gray-500" size={32} />
              <span className="text-sm">Add New</span>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Bill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Bill Type</label>
                <Select value={newBill.type} onValueChange={(v) => setNewBill({...newBill, type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="internet">Internet</SelectItem>
                    <SelectItem value="cable">Cable TV</SelectItem>
                    <SelectItem value="mobile">Mobile Phone</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Provider</label>
                <Input
                  placeholder="e.g., National Grid"
                  value={newBill.provider}
                  onChange={(e) => setNewBill({...newBill, provider: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Account Number</label>
                <Input
                  placeholder="Account number"
                  value={newBill.accountNumber}
                  onChange={(e) => setNewBill({...newBill, accountNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Nickname (optional)</label>
                <Input
                  placeholder="e.g., Home Electricity"
                  value={newBill.nickname}
                  onChange={(e) => setNewBill({...newBill, nickname: e.target.value})}
                />
              </div>
              <Button onClick={handleAddNewBill} className="w-full">Add Bill</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Bills</h3>
        {upcomingBills.length > 0 ? (
          <div className="space-y-4">
            {upcomingBills.map(bill => {
              const daysUntilDue = getDaysUntilDue(bill.dueDate);
              return (
                <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-4">
                    {billTypeIcons[bill.type]}
                    <div>
                      <p className="font-medium">{bill.provider}</p>
                      <p className="text-xs text-gray-500">{bill.accountNumber}</p>
                      <p className={`text-xs ${daysUntilDue < 3 ? 'text-red-500' : 'text-gray-500'}`}>
                        Due in {daysUntilDue} days
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${bill.amount}</p>
                    <Button
                      size="sm"
                      onClick={() => handlePayBill(bill.id)}
                      disabled={isProcessing}
                      className="mt-1"
                      icon={<CreditCard size={14} />}
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No upcoming bills!</p>
        )}
      </Card>

      {savedBills.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Saved Billers</h3>
          <div className="grid grid-cols-2 gap-4">
            {savedBills.map(bill => (
              <div key={bill.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {billTypeIcons[bill.type]}
                <div>
                  <p className="font-medium text-sm">{bill.nickname}</p>
                  <p className="text-xs text-gray-500">{bill.provider}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}