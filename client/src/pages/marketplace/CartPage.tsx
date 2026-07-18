import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { CheckoutModal } from '../../components/marketplace/CheckoutModal';
import { useToast } from '../../contexts/ToastContext';

export function CartPage() {
  const { state, dispatch } = useCart();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  const total = state.items.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleProcessPayment = async (paymentMethod: string, paymentDetails: any) => {
    try {
      // Process payment with payment gateway
      const paymentResponse = await api.post('/payments/process', {
        amount: total,
        currency: 'USD',
        paymentMethod,
        paymentDetails: {
          ...paymentDetails,
          // Never send full card details to server in production!
          // This is just a placeholder - in real app, use Stripe/Payments processor SDK
          cardNumber: paymentDetails.cardNumber?.slice(-4),
          expiryDate: paymentDetails.expiryDate
        }
      });

      if (paymentResponse.data.success) {
        // Create order after successful payment
        const orderData = {
          items: state.items.map(item => ({ productVariantId: item.id, quantity: item.quantity })),
          paymentId: paymentResponse.data.paymentId,
          total: total
        };
        await api.post('/orders', orderData);
        
        dispatch({ type: 'CLEAR_CART' });
        addToast('Payment successful! Your order has been placed.', 'success');
        navigate('/marketplace/orders');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      addToast('Payment failed. Please try again.', 'error');
      throw error;
    }
  };

  return (
    <PageShell>
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      {state.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {state.items.map(item => (
            <div key={item.id} className="flex justify-between items-center mb-4 p-4 border border-dark-200 dark:border-dark-700 rounded-xl">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-dark-500 dark:text-dark-400">Quantity: {item.quantity}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item })}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <hr className="my-6 border-dark-200 dark:border-dark-700" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-lg text-dark-500 dark:text-dark-400">Shipping and taxes calculated at checkout</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-dark-500 dark:text-dark-400">Order Total</p>
                <p className="text-2xl font-bold">${total.toFixed(2)}</p>
              </div>
              <Button onClick={() => setIsCheckoutOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-6 text-lg">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={total}
        onProcessPayment={handleProcessPayment}
      />
    </PageShell>
  );
}