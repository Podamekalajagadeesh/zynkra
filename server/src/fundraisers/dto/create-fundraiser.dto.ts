export class CreateFundraiserDto {
  title: string;
  description: string;
  goalAmount: number;
  currency: string;
  endDate: Date;
  coverImageUrl?: string;
}