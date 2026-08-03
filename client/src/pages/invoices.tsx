import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import {
  getInvoices,
  createInvoice,
  deleteInvoice,
  markInvoicePaid,
} from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Plus, Printer, Trash2, CheckCircle2, FileText } from 'lucide-react';

interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string | null;
  currency: string;
  status: 'draft' | 'sent' | 'paid';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
  dueDate: string | null;
  paidAt: string | null;
  invoiceNo: string;
  createdAt: string;
}

const currency = (amount: number, code = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code.toUpperCase(),
  }).format(amount);

export const InvoicesPage = () => {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await getInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleAddLine = () =>
    setLineItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);

  const handleLineChange = (index: number, patch: Partial<{ description: string; quantity: number; unitPrice: number }>) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const handleCreate = async () => {
    if (!clientName.trim()) {
      addToast('Client name is required', 'error');
      return;
    }
    const cleanItems = lineItems.filter((item) => item.description.trim());
    if (cleanItems.length === 0) {
      addToast('Add at least one line item', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await createInvoice({
        clientName: clientName.trim(),
        clientEmail: clientEmail || undefined,
        taxRate: Number(taxRate) || 0,
        dueDate: dueDate || undefined,
        lineItems: cleanItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
        })),
      });
      addToast('Invoice created', 'success');
      setShowCreate(false);
      setClientName('');
      setClientEmail('');
      setTaxRate('0');
      setDueDate('');
      setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      await fetchInvoices();
    } catch (error: any) {
      addToast(error?.response?.data?.message || 'Failed to create invoice', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    try {
      await deleteInvoice(invoice.id);
      addToast('Invoice deleted', 'success');
      await fetchInvoices();
    } catch {
      addToast('Only draft invoices can be deleted', 'error');
    }
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      await markInvoicePaid(invoice.id);
      addToast('Invoice marked as paid', 'success');
      await fetchInvoices();
    } catch {
      addToast('Failed to update invoice', 'error');
    }
  };

  const subtotal = (invoice: Invoice) =>
    invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <PageShell
      eyebrow="Creator & business"
      title="Invoices"
      description="Create and manage B2B invoices for brand deals and collaborations."
    >
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate((v) => !v)}>
          <Plus className="w-4 h-4 mr-2" /> New invoice
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">New invoice</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              <Input placeholder="Client email (optional)" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Tax rate %"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Line items</div>
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-[3fr_1fr_1fr] gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleLineChange(index, { description: e.target.value })}
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleLineChange(index, { quantity: Number(e.target.value) })}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit price"
                    value={item.unitPrice}
                    onChange={(e) => handleLineChange(index, { unitPrice: Number(e.target.value) })}
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={handleAddLine}>
                <Plus className="w-4 h-4 mr-1" /> Add line item
              </Button>
            </div>
            <Button onClick={handleCreate} disabled={isSaving} className="w-full">
              Create invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton height={64} />
          <Skeleton height={64} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-12 text-center text-dark-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No invoices yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 print-visible">
                  <div className="min-w-0">
                    <div className="font-semibold">{invoice.invoiceNo}</div>
                    <div className="text-sm text-dark-500">{invoice.clientName}</div>
                    <div className="text-sm text-dark-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-dark-400 mt-1">
                      {invoice.lineItems.map((item) => item.description).join(' · ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary-600">
                      {currency(Number(invoice.total), invoice.currency)}
                    </div>
                    <div
                      className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'sent'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-dark-100 text-dark-600'
                      }`}
                    >
                      {invoice.status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-200 dark:border-dark-700 print:hidden">
                  <Button size="sm" variant="ghost" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-1" /> Print
                  </Button>
                  {invoice.status !== 'paid' && (
                    <Button size="sm" variant="ghost" onClick={() => handleMarkPaid(invoice)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Mark paid
                    </Button>
                  )}
                  {invoice.status === 'draft' && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(invoice)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
};
