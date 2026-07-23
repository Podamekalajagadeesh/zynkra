import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';

export const BudgetBiddingForm = ({ register, errors }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="budget">Budget</Label>
        <Input id="budget" type="number" {...register('budget')} />
        {errors.budget && <p className="text-red-500">{errors.budget.message}</p>}
      </div>
      <div>
        <Label htmlFor="budget_type">Budget Type</Label>
        <Select id="budget_type" {...register('budget_type')}>
          <option value="daily">Daily</option>
          <option value="lifetime">Lifetime</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="bid_strategy">Bid Strategy</Label>
        <Select id="bid_strategy" {...register('bid_strategy')}>
          <option value="lowest_cost">Lowest Cost</option>
          <option value="cost_cap">Cost Cap</option>
          <option value="bid_cap">Bid Cap</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="bid_amount">Bid Amount</Label>
        <Input id="bid_amount" type="number" {...register('bid_amount')} />
        {errors.bid_amount && <p className="text-red-500">{errors.bid_amount.message}</p>}
      </div>
    </div>
  );
};