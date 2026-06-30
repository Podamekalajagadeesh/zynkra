import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Send, QrCode, Users, History, ArrowLeftRight } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useUser } from '../../hooks/useUser';

interface Transaction {
  id: string;
  amount: number;
  recipient: string;
  timestamp: Date;
  type: 'sent' | 'received';
  status: 'completed' | 'pending';
}

interface Contact {
  id: string;
  name: string;
  avatar: string;
  phoneNumber: string;
}

export function MobilePayments() {
  const { user } = useUser();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [sendAmount, setSendAmount] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      amount: 500,
      recipient: 'John Doe',
      timestamp: new Date(Date.now() - 3600000),
      type: 'sent',
      status: 'completed'
    },
    {
      id: '2',
      amount: 1200,
      recipient: 'Jane Smith',
      timestamp: new Date(Date.now() - 86400000),
      type: 'received',
      status: 'completed'
    }
  ]);

  const recentContacts: Contact[] = [
    { id: '1', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=1', phoneNumber: '+1234567890' },
    { id: '2', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=2', phoneNumber: '+0987654321' },
    { id: '3', name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?u=3', phoneNumber: '+1122334455' }
  ];

  const walletBalance = 15420.50;

  const handleSendMoney = async () => {
    if (!sendAmount || !recipientPhone) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    const amount = parseFloat(sendAmount);
    if (amount > walletBalance) {
      addToast('Insufficient balance', 'error');
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount,
      recipient: recipientPhone,
      timestamp: new Date(),
      type: 'sent',
      status: 'completed'
    };

    setTransactions([newTransaction, ...transactions]);
    setSendAmount('');
    setRecipientPhone('');
    setIsProcessing(false);
    addToast(`Successfully sent $${amount}`, 'success');
  };

  const handleQuickSend = (contact: Contact) => {
    setRecipientPhone(contact.phoneNumber);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Wallet Balance</p>
            <p className="text-3xl font-bold text-green-600">${walletBalance.toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<QrCode size={18} />}>
              Scan QR
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setActiveTab('send')}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Send size={24} className="text-blue-600 mb-1" />
            <span className="text-xs">Send</span>
          </button>
          <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeftRight size={24} className="text-purple-600 mb-1" />
            <span className="text-xs">Request</span>
          </button>
          <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Users size={24} className="text-orange-600 mb-1" />
            <span className="text-xs">Split Bill</span>
          </button>
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <History size={24} className="text-gray-600 mb-1" />
                <span className="text-xs">History</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Transaction History</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <p className="font-medium">{tx.recipient}</p>
                      <p className="text-xs text-gray-500">{tx.timestamp.toLocaleString()}</p>
                    </div>
                    <p className={`font-semibold ${tx.type === 'sent' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'sent' ? '-' : '+'}${tx.amount}
                    </p>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {activeTab === 'send' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Recipient Phone Number</label>
              <Input
                type="tel"
                placeholder="+1234567890"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Amount (USD)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSendMoney}
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Send Money'}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Contacts</h3>
        <div className="grid grid-cols-3 gap-4">
          {recentContacts.map(contact => (
            <button
              key={contact.id}
              onClick={() => handleQuickSend(contact)}
              className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-12 h-12 rounded-full object-cover mb-2"
              />
              <span className="text-xs truncate w-full text-center">{contact.name}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}