import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, DemandForecast, generateDemandForecast, getDemandForecasts } from '../../lib/api';
import { SellerProduct } from '../../lib/types';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';

export function SellerDashboardPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; address: Record<string, unknown> }>>([]);
  const [stock, setStock] = useState<Array<{ id: string; warehouseId: string; productVariantId: string; quantity: number; reservedQuantity: number; reorderPoint: number }>>([]);
  const [alerts, setAlerts] = useState<typeof stock>([]);
  const [shipments, setShipments] = useState<Array<{ id: string; orderId: string; trackingNumber: string; status: string; estimatedDeliveryAt?: string; pickupScheduledAt?: string }>>([]);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [returns, setReturns] = useState<Array<{ id: string; orderId: string; type: string; status: string; reason: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; contactEmail?: string }>>([]);
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [stockForm, setStockForm] = useState({ warehouseId: '', productVariantId: '', quantity: 0, reorderPoint: 0 });
  const [message, setMessage] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [forecastVariantId, setForecastVariantId] = useState('');
  const [forecastDays, setForecastDays] = useState(30);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    void loadOperations();
  }, []);

  const loadOperations = async () => {
    const [productsResponse, warehousesResponse, stockResponse, alertsResponse, shipmentsResponse, forecastsResponse, returnsResponse, suppliersResponse] = await Promise.all([
      api.get('/products/my-products'),
      api.get('/commerce/warehouses'),
      api.get('/commerce/inventory'),
      api.get('/commerce/inventory/alerts'),
      api.get('/commerce/shipments'),
      getDemandForecasts(),
      api.get('/commerce/returns'),
      api.get('/commerce/suppliers'),
    ]);
    const productData = productsResponse.data?.data || productsResponse.data?.products || productsResponse.data;
    setProducts(productData);
    setWarehouses(warehousesResponse.data);
    setStock(stockResponse.data);
    setAlerts(alertsResponse.data);
    setShipments(shipmentsResponse.data);
    setForecasts(forecastsResponse);
    setReturns(returnsResponse.data);
    setSuppliers(suppliersResponse.data);
    setStockForm((current) => ({ ...current, warehouseId: current.warehouseId || warehousesResponse.data[0]?.id || '' }));
    setForecastVariantId((current) => current || productData.flatMap((product: SellerProduct) => product.variants || [])[0]?.id || '');
  };

  const generateForecast = async () => {
    if (!forecastVariantId) return;
    setForecastLoading(true);
    try {
      const forecast = await generateDemandForecast(forecastVariantId, forecastDays);
      setForecasts((current) => [forecast, ...current]);
      setMessage('Demand forecast generated');
    } finally {
      setForecastLoading(false);
    }
  };

  const createSupplier = async () => {
    if (!supplierName.trim()) return;
    await api.post('/commerce/suppliers', { name: supplierName.trim(), contactEmail: supplierEmail.trim() || undefined });
    setSupplierName('');
    setSupplierEmail('');
    setMessage('Supplier created');
    await loadOperations();
  };

  const updateShipmentStatus = async (id: string, status: string) => {
    await api.patch(`/commerce/shipments/${id}/status`, { status });
    setMessage('Shipment status updated');
    await loadOperations();
  };

  const createWarehouse = async () => {
    if (!warehouseName.trim()) return;
    await api.post('/commerce/warehouses', { name: warehouseName.trim(), address: { label: warehouseAddress.trim() } });
    setWarehouseName('');
    setWarehouseAddress('');
    setMessage('Warehouse created');
    await loadOperations();
  };

  const saveStock = async () => {
    if (!stockForm.warehouseId || !stockForm.productVariantId.trim()) return;
    await api.post(`/commerce/warehouses/${stockForm.warehouseId}/stock/${stockForm.productVariantId.trim()}`, {
      quantity: Number(stockForm.quantity),
      reorderPoint: Number(stockForm.reorderPoint),
    });
    setMessage('Stock updated');
    await loadOperations();
  };

  return (
    <PageShell>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Seller Dashboard</h1>
        <Button asChild>
          <Link to="/marketplace/products/new">Add Product</Link>
        </Button>
      </div>
      {message && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-semibold">Warehouses</h2>
          <div className="mb-4 space-y-2">
            {warehouses.map((warehouse) => <div key={warehouse.id} className="flex justify-between rounded border p-2 text-sm"><span>{warehouse.name}</span><span className="text-gray-500">{String(warehouse.address?.label || 'Address pending')}</span></div>)}
            {!warehouses.length && <p className="text-sm text-gray-500">No warehouses yet.</p>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded border p-2" placeholder="Warehouse name" value={warehouseName} onChange={(event) => setWarehouseName(event.target.value)} />
            <input className="rounded border p-2" placeholder="Address" value={warehouseAddress} onChange={(event) => setWarehouseAddress(event.target.value)} />
          </div>
          <Button className="mt-2" onClick={createWarehouse}>Create warehouse</Button>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-semibold">Update stock</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <select className="rounded border p-2" value={stockForm.warehouseId} onChange={(event) => setStockForm({ ...stockForm, warehouseId: event.target.value })}>
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
            <input className="rounded border p-2" placeholder="Product variant ID" value={stockForm.productVariantId} onChange={(event) => setStockForm({ ...stockForm, productVariantId: event.target.value })} />
            <input className="rounded border p-2" type="number" min="0" placeholder="Quantity" value={stockForm.quantity} onChange={(event) => setStockForm({ ...stockForm, quantity: Number(event.target.value) })} />
            <input className="rounded border p-2" type="number" min="0" placeholder="Reorder point" value={stockForm.reorderPoint} onChange={(event) => setStockForm({ ...stockForm, reorderPoint: Number(event.target.value) })} />
          </div>
          <Button className="mt-2" onClick={saveStock}>Save stock</Button>
        </div>
      </section>
      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4"><h2 className="mb-3 text-lg font-semibold">Low-stock alerts ({alerts.length})</h2>{alerts.map((item) => <div key={item.id} className="border-b py-2 text-sm">Variant {item.productVariantId}: {item.quantity - item.reservedQuantity} available, reorder at {item.reorderPoint}</div>)}{!alerts.length && <p className="text-sm text-gray-500">All stocked items are above their reorder points.</p>}</div>
        <div className="rounded-lg border p-4"><h2 className="mb-3 text-lg font-semibold">Shipments</h2>{shipments.map((shipment) => <div key={shipment.id} className="border-b py-2 text-sm"><div className="flex justify-between"><span>{shipment.trackingNumber}</span><span>{shipment.status}</span></div><p className="text-gray-500">Order {shipment.orderId}{shipment.estimatedDeliveryAt ? ` · ETA ${new Date(shipment.estimatedDeliveryAt).toLocaleDateString()}` : ''}</p>{shipment.status !== 'delivered' && shipment.status !== 'cancelled' && <select className="mt-2 rounded border p-1" value={shipment.status} onChange={(event) => void updateShipmentStatus(shipment.id, event.target.value)}><option value={shipment.status}>{shipment.status}</option>{shipment.status === 'label_created' && <><option value="picked_up">picked_up</option><option value="cancelled">cancelled</option></>}{shipment.status === 'picked_up' && <><option value="in_transit">in_transit</option><option value="delivered">delivered</option></>}{shipment.status === 'in_transit' && <option value="delivered">delivered</option>}</select>}</div>)}{!shipments.length && <p className="text-sm text-gray-500">No shipments created.</p>}</div>
      </section>
      <section className="mb-8 rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-semibold">Demand forecasts</h2>
        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
          <select className="rounded border p-2" value={forecastVariantId} onChange={(event) => setForecastVariantId(event.target.value)}>
            <option value="">Select product variant</option>
            {products.flatMap((product) => (product.variants || []).map((variant) => <option key={variant.id} value={variant.id}>{product.name} / {variant.name}</option>))}
          </select>
          <select className="rounded border p-2" value={forecastDays} onChange={(event) => setForecastDays(Number(event.target.value))}>
            {[7, 14, 30, 60, 90, 180, 365].map((days) => <option key={days} value={days}>{days}-day history</option>)}
          </select>
          <Button onClick={() => void generateForecast()} disabled={!forecastVariantId || forecastLoading}>{forecastLoading ? 'Generating...' : 'Generate forecast'}</Button>
        </div>
        {forecasts.map((forecast) => <div key={forecast.id} className="flex justify-between border-b py-2 text-sm"><span>Variant {forecast.productVariantId} ({forecast.basedOnDays}-day history)</span><span>{forecast.forecastQuantity} units through {forecast.periodEnd}</span></div>)}
        {!forecasts.length && <p className="text-sm text-gray-500">No forecasts generated yet.</p>}
      </section>
      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border p-4"><h2 className="mb-3 text-lg font-semibold">Suppliers</h2>{suppliers.map((supplier) => <div key={supplier.id} className="border-b py-2 text-sm"><span>{supplier.name}</span>{supplier.contactEmail && <span className="ml-2 text-gray-500">{supplier.contactEmail}</span>}</div>)}<div className="mt-3 grid gap-2 sm:grid-cols-2"><input className="rounded border p-2" placeholder="Supplier name" value={supplierName} onChange={(event) => setSupplierName(event.target.value)} /><input className="rounded border p-2" type="email" placeholder="Contact email" value={supplierEmail} onChange={(event) => setSupplierEmail(event.target.value)} /></div><Button className="mt-2" onClick={createSupplier}>Add supplier</Button></div>
        <div className="rounded-lg border p-4"><h2 className="mb-3 text-lg font-semibold">Returns and exchanges</h2>{returns.map((request) => <div key={request.id} className="border-b py-2 text-sm"><div className="flex justify-between"><span>{request.type} for order {request.orderId}</span><span>{request.status}</span></div><p className="text-gray-500">{request.reason}</p></div>)}{!returns.length && <p className="text-sm text-gray-500">No return or exchange requests.</p>}</div>
      </section>
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