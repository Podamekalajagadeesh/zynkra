import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { PageShell } from '../../components/PageShell';

export function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const response = await api.get('/orders');
      setOrders(response.data);
    };
    fetchOrders();
  }, []);

  return (
    <PageShell>
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      {orders.map(order => (
        <div key={order.id} className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between font-bold">
            <p>Order #{order.id}</p>
            <p>${order.total}</p>
          </div>
          <p>Status: {order.status}</p>
          <div>
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center mt-2">
                <div>
                  <p>{item.productVariant.name}</p>
                  <p>Quantity: {item.quantity}</p>
                </div>
                <p>${item.price * item.quantity}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </PageShell>
  );
}