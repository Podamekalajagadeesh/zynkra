import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CreditCard, Wallet } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onProcessPayment: (paymentMethod: string, paymentDetails: any) => Promise<void>;
}

export function CheckoutModal({ isOpen, onClose, total, onProcessPayment }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const paymentDetails = paymentMethod === 'card' 
        ? {
            method: 'card',
            cardNumber,
            expiryDate,
            cvv,
            cardHolderName,
            billingAddress
          }
        : {
            method: 'crypto',
            walletAddress: '' // This would be connected via web3
          };
      
      await onProcessPayment(paymentMethod, paymentDetails);
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-dark-200 bg-white p-6 shadow-xl dark:border-dark-700 dark:bg-dark-900">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white">Checkout</h2>
          <button onClick={onClose} className="text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <Label className="block mb-3">Select Payment Method</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === 'card' 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Credit/Debit Card</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('crypto')}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === 'crypto' 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span>Crypto Wallet</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {paymentMethod === 'card' && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">Card Details</h3>
              
              <div>
                <Label htmlFor="cardHolderName">Cardholder Name</Label>
                <Input
                  id="cardHolderName"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold pt-4">Billing Address</h3>
              
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={billingAddress.street}
                  onChange={(e) => setBillingAddress({...billingAddress, street: e.target.value})}
                  placeholder="123 Main St"
                  required
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={billingAddress.city}
                    onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                    placeholder="New York"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={billingAddress.state}
                    onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
                    placeholder="NY"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={billingAddress.zipCode}
                    onChange={(e) => setBillingAddress({...billingAddress, zipCode: e.target.value})}
                    placeholder="10001"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={billingAddress.country}
                    onChange={(e) => setBillingAddress({...billingAddress, country: e.target.value})}
                    placeholder="USA"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'crypto' && (
            <div className="mb-6 p-6 border-2 border-dashed border-dark-200 dark:border-dark-700 rounded-xl text-center">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-dark-500 dark:text-dark-400 mb-4">
                Pay with ETH, USDC, or other supported cryptocurrencies. Your wallet will be connected to process this payment.
              </p>
              <Button type="button" className="w-full">Connect Wallet</Button>
            </div>
          )}

          {/* Order Summary */}
          <div className="border-t border-dark-200 dark:border-dark-700 pt-6 mb-6">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-indigo-600 dark:text-indigo-400">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}