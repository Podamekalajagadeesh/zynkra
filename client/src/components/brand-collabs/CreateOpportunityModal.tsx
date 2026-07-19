import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { api } from '../../lib/api';

interface Brand {
  id: string;
  name: string;
}

interface CreateOpportunityModalProps {
  brands: Brand[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateOpportunityModal({ brands, onClose, onSuccess }: CreateOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brandId: '',
    title: '',
    description: '',
    requirements: '',
    budget: '',
    paymentType: 'fixed',
    commissionRate: '',
    category: '',
    minFollowers: '1000',
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/brand-collabs/opportunities', {
        ...formData,
        budget: parseFloat(formData.budget),
        commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : undefined,
        minFollowers: parseInt(formData.minFollowers),
        deadline: new Date(formData.deadline),
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Collab Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="brandId">Select Brand *</Label>
            <Select 
              value={formData.brandId} 
              onValueChange={(value) => setFormData({ ...formData, brandId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="title">Opportunity Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Instagram Product Review"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              placeholder="e.g., Fashion, Tech, Lifestyle"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the collaboration opportunity in detail"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements *</Label>
            <Textarea
              id="requirements"
              placeholder="What do you require from creators?"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">Budget ($) *</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="1000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="paymentType">Payment Type *</Label>
              <Select 
                value={formData.paymentType} 
                onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Rate</SelectItem>
                  <SelectItem value="commission">Commission Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.paymentType !== 'fixed' && (
            <div>
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                placeholder="10"
                value={formData.commissionRate}
                onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minFollowers">Min Followers Required</Label>
              <Input
                id="minFollowers"
                type="number"
                min="1"
                placeholder="1000"
                value={formData.minFollowers}
                onChange={(e) => setFormData({ ...formData, minFollowers: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="deadline">Application Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.brandId}>
              {loading ? 'Creating...' : 'Create Opportunity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}