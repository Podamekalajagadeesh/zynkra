import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export const WEBHOOK_EVENTS = [
  'post.created',
  'post.updated',
  'post.deleted',
  'user.updated',
  'follow.created',
  'reaction.created',
  'comment.created',
  'payment.payout_completed',
] as const;

export class CreateWebhookEndpointDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsArray()
  @IsIn(WEBHOOK_EVENTS as unknown as string[], { each: true })
  events: string[];
}

export class UpdateWebhookEndpointDto {
  @IsUrl({ require_tld: false })
  @IsOptional()
  url?: string;

  @IsArray()
  @IsIn(WEBHOOK_EVENTS as unknown as string[], { each: true })
  @IsOptional()
  events?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
