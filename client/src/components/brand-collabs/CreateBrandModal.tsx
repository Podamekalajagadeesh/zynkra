import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { api } from '../../../lib/api';

interface CreateBrandModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBrandModal({ onClose, onSuccess }: CreateBrandModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    logoUrl: '',
    industry: '',
    minBudget: '',
    maxBudget: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/brand-collabs/brands', {
        ...formData,
        minBudget: formData.minBudget ? parseFloat(formData.minBudget) : undefined,
        maxBudget: formData.maxBudget ? parseFloat(formData.maxBudget) : undefined,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create brand:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Brand</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                placeholder="e.g., Fashion, Tech, Food & Beverage"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell creators about your brand"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourbrand.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  placeholder="https://yourbrand.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minBudget">Minimum Budget ($)</Label>
                <Input
                  id="minBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="500"
                  value={formData.minBudget}
                  onChange={(e) => setFormData({ ...formData, minBudget: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="maxBudget">Maximum Budget ($)</Label>
                <Input
                  id="maxBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="5000"
                  value={formData.maxBudget}
                  onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Brand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}