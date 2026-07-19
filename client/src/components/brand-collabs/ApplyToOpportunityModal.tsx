import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { api } from '../../lib/api';

interface CollabOpportunity {
  id: string;
  title: string;
  brand: {
    name: string;
  };
  budget: number;
}

interface ApplyToOpportunityModalProps {
  opportunity: CollabOpportunity;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplyToOpportunityModal({ opportunity, onClose, onSuccess }: ApplyToOpportunityModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pitch: '',
    proposedRate: '',
    portfolioLinks: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post(`/brand-collabs/opportunities/${opportunity.id}/apply`, {
        ...formData,
        proposedRate: parseFloat(formData.proposedRate),
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to: {opportunity.title}</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Brand: {opportunity.brand.name} | Budget: ${opportunity.budget.toLocaleString()}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pitch">Your Pitch *</Label>
            <Textarea
              id="pitch"
              placeholder="Explain why you're the perfect creator for this collaboration, highlight your audience demographics, and how you plan to promote the brand..."
              value={formData.pitch}
              onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
              rows={5}
              required
            />
          </div>
          <div>
            <Label htmlFor="proposedRate">Your Proposed Rate ($) *</Label>
            <Input
              id="proposedRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter your rate for this collaboration"
              value={formData.proposedRate}
              onChange={(e) => setFormData({ ...formData, proposedRate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="portfolioLinks">Portfolio/Social Links</Label>
            <Input
              id="portfolioLinks"
              type="url"
              placeholder="https://linktr.ee/yourprofile"
              value={formData.portfolioLinks}
              onChange={(e) => setFormData({ ...formData, portfolioLinks: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}