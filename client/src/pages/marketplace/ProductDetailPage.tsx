import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { useCart } from '../../contexts/CartContext';
import { Download, ShoppingCart, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ARTryOnModal } from '../../components/marketplace/ARTryOnModal';

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [purchased, setPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isArModalOpen, setIsArModalOpen] = useState(false);
  const { dispatch } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (id) {
      api.get(`/products/${id}`).then(response => {
        setProduct(response.data);
        if (response.data.variants?.length > 0) {
          setSelectedVariant(response.data.variants[0]);
        }
      });
    }
  }, [id]);

  const handleDownload = async () => {
    if (!user) {
      addToast('Please login to download', 'error');
      return;
    }
    
    try {
      setDownloading(true);
      const response = await api.get(`/products/${id}/download`);
      window.open(response.data.downloadUrl, '_blank');
      addToast('Download started!', 'success');
    } catch (error: any) {
      if (error.response?.data?.message === 'This product is not available for download') {
        addToast('Only digital products can be downloaded', 'error');
      } else {
        addToast('You must purchase this product to download it', 'error');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleAddToCart = () => {
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: { 
        ...selectedVariant, 
        name: product.name,
        quantity: 1 
      } 
    });
    addToast('Added to cart!', 'success');
  };

  if (!product) {
    return <PageShell><div className="flex items-center justify-center h-96">Loading...</div></PageShell>;
  }

  return (
    <PageShell>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={product.imageUrls?.[0] || 'https://via.placeholder.com/600x400'} alt={product.name} className="w-full h-auto object-cover rounded-lg" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.productType === 'digital' && (
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Digital Product</span>
            )}
            {product.productType === 'print-on-demand' && (
              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Print-on-Demand</span>
            )}
          </div>
          
          <p className="text-2xl font-bold text-gray-800 mb-4">${selectedVariant?.price || product.price}</p>
          <p className="text-gray-600 mb-4">{product.description}</p>
          
          {/* Print-on-Demand variant selection */}
          {product.productType === 'print-on-demand' && product.printOnDemandSettings?.variants?.length > 0 && (
            <div className="mb-4">
              <label htmlFor="variant" className="block text-sm font-medium text-gray-700">Product Variant</label>
              <select
                id="variant"
                name="variant"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                onChange={(e) => setSelectedVariant(product.printOnDemandSettings.variants.find(v => `${v.size}-${v.color}` === e.target.value))}
              >
                {product.printOnDemandSettings.variants.map((variant, idx) => (
                  <option key={idx} value={`${variant.size}-${variant.color}`}>
                    {variant.size} / {variant.color} - ${variant.price}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Physical product variant selection */}
          {product.productType !== 'digital' && product.variants?.length > 0 && (
            <div className="mb-4">
              <label htmlFor="variant" className="block text-sm font-medium text-gray-700">Variant</label>
              <select
                id="variant"
                name="variant"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                onChange={(e) => setSelectedVariant(product.variants.find(v => v.id === e.target.value))}
              >
                {product.variants.map(variant => (
                  <option key={variant.id} value={variant.id}>{variant.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-4">
            {/* AR Try-On Button - only show for physical products that support it */}
            {product.productType !== 'digital' && (
              <Button 
                onClick={() => setIsArModalOpen(true)} 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="w-4 h-4" />
                Try On in AR
              </Button>
            )}
            
            {product.productType === 'digital' ? (
              <Button onClick={handleDownload} disabled={downloading} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                {downloading ? 'Preparing download...' : 'Download Now'}
              </Button>
            ) : (
              <Button onClick={handleAddToCart} className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </Button>
            )}
          </div>

          {/* AR Try-On Modal */}
          <ARTryOnModal 
            isOpen={isArModalOpen} 
            onClose={() => setIsArModalOpen(false)} 
            product={product} 
          />

          {/* Print-on-Demand info */}
          {product.productType === 'print-on-demand' && product.printOnDemandSettings && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Print-on-Demand Details</h3>
              <p className="text-sm text-gray-600">Provider: {product.printOnDemandSettings.provider}</p>
              <p className="text-sm text-gray-600">Ships to: {product.printOnDemandSettings.shippingLocations.join(', ')}</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}