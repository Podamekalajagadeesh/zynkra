// @ts-nocheck
import { useState } from 'react';
import { ShoppingCart, Tag, Clock, ExternalLink, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useCart } from '../../contexts/CartContext';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  stock: number;
}

interface LiveShoppingProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  variants: ProductVariant[];
  isFlashSale?: boolean;
  flashSaleEndsAt?: Date;
  exclusiveDiscount?: number;
}

interface LiveShoppingProductPanelProps {
  products: LiveShoppingProduct[];
  host: boolean;
  onAddProduct?: (product: LiveShoppingProduct) => void;
  featuredProductId?: string;
}

export function LiveShoppingProductPanel({ 
  products, 
  host, 
  onAddProduct,
  featuredProductId 
}: LiveShoppingProductPanelProps) {
  const { dispatch } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<LiveShoppingProduct | null>(
    products.find(p => p.id === featuredProductId) || products[0] || null
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{hours: number, minutes: number, seconds: number} | null>(null);

  // Calculate flash sale countdown
  useState(() => {
    if (selectedProduct?.flashSaleEndsAt) {
      const interval = setInterval(() => {
        const now = new Date();
        const end = new Date(selectedProduct.flashSaleEndsAt!);
        const diff = end.getTime() - now.getTime();
        
        if (diff > 0) {
          setTimeRemaining({
            hours: Math.floor(diff / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000)
          });
        } else {
          setTimeRemaining(null);
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [selectedProduct]);

  const handleAddToCart = () => {
    if (selectedProduct && selectedVariant) {
      const price = selectedVariant.discountPrice || selectedVariant.price;
      dispatch({ 
        type: 'ADD_ITEM', 
        payload: { 
          ...selectedVariant, 
          name: `${selectedProduct.name} - ${selectedVariant.name}`,
          price,
          quantity: 1 
        } 
      });
    }
  };

  return (
    <div className="w-80 bg-dark-900 border-l border-dark-700 flex flex-col h-full">
      <div className="p-4 border-b border-dark-700">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Live Shopping Products
        </h3>
      </div>

      {/* Product List Sidebar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {products.map(product => (
          <Card 
            key={product.id}
            onClick={() => {
              setSelectedProduct(product);
              setSelectedVariant(product.variants[0]);
            }}
            className={`p-3 cursor-pointer transition-all ${
              selectedProduct?.id === product.id 
                ? 'border-indigo-500 bg-indigo-900/20' 
                : 'bg-dark-800 border-dark-700 hover:border-dark-600'
            }`}
          >
            <div className="flex gap-3">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {product.exclusiveDiscount && (
                    <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {product.exclusiveDiscount}% OFF
                    </span>
                  )}
                  {product.isFlashSale && (
                    <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Flash Sale
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  ${product.variants[0].discountPrice || product.variants[0].price}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Featured Product Detail */}
      {selectedProduct && (
        <div className="border-t border-dark-700 p-4 bg-dark-800">
          <div className="mb-4">
            <img 
              src={selectedProduct.imageUrl} 
              alt={selectedProduct.name}
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
            <h4 className="text-lg font-bold text-white">{selectedProduct.name}</h4>
            <p className="text-sm text-gray-400 mt-1">{selectedProduct.description}</p>
            
            {/* Discount badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedProduct.exclusiveDiscount && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded">
                  <Tag className="w-3 h-3" />
                  Exclusive {selectedProduct.exclusiveDiscount}% discount - only for live viewers!
                </span>
              )}
              {selectedProduct.isFlashSale && timeRemaining && (
                <span className="inline-flex items-center gap-1 text-xs bg-red-600 text-white px-2 py-1 rounded">
                  <Clock className="w-3 h-3" />
                  Flash sale ends in {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                </span>
              )}
            </div>

            {/* Variant selection */}
            {selectedProduct.variants.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Select variant</label>
                <select 
                  className="w-full bg-dark-700 border border-dark-600 rounded-md p-2 text-white"
                  onChange={(e) => {
                    const variant = selectedProduct.variants.find(v => v.id === e.target.value);
                    setSelectedVariant(variant || null);
                  }}
                  value={selectedVariant?.id || ''}
                >
                  {selectedProduct.variants.map(variant => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} - ${variant.discountPrice || variant.price} ({variant.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Pricing */}
            {selectedVariant && (
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  {selectedVariant.discountPrice && (
                    <span className="text-lg text-gray-500 line-through">${selectedVariant.price}</span>
                  )}
                  <span className="text-2xl font-bold text-white">
                    ${selectedVariant.discountPrice || selectedVariant.price}
                  </span>
                </div>
                <Button 
                  className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Host controls - Add new product */}
      {host && onAddProduct && (
        <div className="p-4 border-t border-dark-700">
          <Button 
            className="w-full"
            variant="secondary"
            onClick={() => onAddProduct({} as LiveShoppingProduct)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product to Stream
          </Button>
        </div>
      )}
    </div>
  );
}