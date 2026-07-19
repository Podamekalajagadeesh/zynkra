import { IsIn, IsOptional } from 'class-validator';

const ALLOWED_TTLS = [86400, 604800, 7776000]; // 24h, 7d, 90d

export class MessageTtlDto {
  /** TTL in seconds for new messages; null disables disappearing messages. */
  @IsOptional()
  @IsIn(ALLOWED_TTLS)
  messageTtlSeconds: number | null;
}
