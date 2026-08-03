import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import {
  api,
  getTaxDocuments,
  generateTaxDocument,
} from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { FileText, Download, Plus } from 'lucide-react';

interface TaxDocument {
  id: string;
  taxYear: number;
  formType: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

const currency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const TaxDocumentsPage = () => {
  const { addToast } = useToast();
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await getTaxDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateTaxDocument(year);
      addToast(`Generated 1099-NEC for ${year}`, 'success');
      await fetchDocuments();
    } catch (error: any) {
      addToast(error?.response?.data?.message || 'Failed to generate', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (doc: TaxDocument) => {
    try {
      const response = await api.get(`/tax-documents/${doc.id}/download`, {
        responseType: 'text',
      });
      const blob = new Blob([response.data], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zynkra-1099-${doc.taxYear}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      addToast('Failed to download', 'error');
    }
  };

  return (
    <PageShell
      eyebrow="Creator & business"
      title="Tax Documents"
      description="Downloadable 1099-NEC income summaries from your wallet earnings."
    >
      <div className="mb-4 flex items-center gap-3">
        <input
          type="number"
          min={new Date().getFullYear() - 50}
          max={new Date().getFullYear() + 1}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg w-28 text-sm"
        />
        <Button onClick={handleGenerate} disabled={isGenerating}>
          <Plus className="w-4 h-4 mr-2" /> Generate 1099-NEC
        </Button>
      </div>

      <p className="text-xs text-dark-500 mb-4">
        These are income summaries for your own tax preparation. They are not
        filed with the IRS.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton height={64} />
          <Skeleton height={64} />
        </div>
      ) : documents.length === 0 ? (
        <div className="py-12 text-center text-dark-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No tax documents yet. Generate one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {doc.formType} · {doc.taxYear}
                  </div>
                  <div className="text-sm text-dark-500">
                    {currency(Number(doc.totalAmount))} gross reportable income
                  </div>
                  <div className="text-xs text-dark-400">
                    Generated {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
};
