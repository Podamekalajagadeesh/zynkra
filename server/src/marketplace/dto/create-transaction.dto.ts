
import { IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  buyerId: string;
}