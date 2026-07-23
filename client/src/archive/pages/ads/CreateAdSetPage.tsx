import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { BudgetBiddingForm } from '../../components/ads/BudgetBiddingForm';
import { createAdSet } from '../../lib/api';

const adSetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targeting: z.any().optional(),
  dailyBudget: z.number().min(1, 'Daily budget is required'),
  bid_strategy: z.string().optional(),
  bid_amount: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const CreateAdSetPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(adSetSchema),
  });

  const onSubmit = async (data) => {
    await createAdSet(data);
    // Redirect or show success message
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Create Ad Set</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}
        </div>
        <BudgetBiddingForm register={register} errors={errors} />
        <Button type="submit">Create Ad Set</Button>
      </form>
    </div>
  );
};

export default CreateAdSetPage;