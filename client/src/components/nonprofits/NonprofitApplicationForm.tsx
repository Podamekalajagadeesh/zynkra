
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { api } from '../../lib/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  missionStatement: z.string().min(1, 'Mission statement is required'),
});

type FormData = z.infer<typeof schema>;

export const NonprofitApplicationForm: React.FC = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/nonprofits/apply', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      addToast('Nonprofit application submitted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting nonprofit application:', error);
      addToast('Failed to submit application. Please try again.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nonprofit Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="missionStatement">Mission Statement</Label>
        <Input id="missionStatement" {...register('missionStatement')} />
        {errors.missionStatement && (
          <p className="text-red-500">{errors.missionStatement.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  );
};