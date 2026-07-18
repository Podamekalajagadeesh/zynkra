import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';

export function SellerDashboardPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await api.get('/products');
      setProducts(response.data);
    };
    fetchProducts();
  }, []);

  return (
    <PageShell>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
        <Button asChild>
          <Link to="/marketplace/products/new">Add Product</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4">
            <img src={product.imageUrls?.[0]} alt={product.name} className="w-full h-48 object-cover rounded-md mb-2" />
            <h2 className="font-bold">{product.name}</h2>
            <Link to={`/marketplace/products/${product.id}/edit`} className="text-sm text-blue-500">Edit</Link>
          </div>
        ))}
      </div>
    </PageShell>
  );
}