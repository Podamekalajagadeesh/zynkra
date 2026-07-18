import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateAdSetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  targeting: {
    age?: { min: number; max: number };
    gender?: 'male' | 'female' | 'all';
    locations?: string[];
    interests?: string[];
  };

  @IsNumber()
  dailyBudget: number;

  @IsString()
  @IsOptional()
  bid_strategy?: 'lowest_cost' | 'cost_cap' | 'bid_cap';

  @IsNumber()
  @IsOptional()
  bid_amount?: number;

  @IsDateString()
  @IsOptional()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate: string;
}