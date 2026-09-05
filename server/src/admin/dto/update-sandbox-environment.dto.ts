import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { SandboxEnvironmentStatus } from '../entities/sandbox-environment.entity';

export class UpdateSandboxEnvironmentDto {
  @IsOptional()
  @IsEnum(SandboxEnvironmentStatus)
  status?: SandboxEnvironmentStatus;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}