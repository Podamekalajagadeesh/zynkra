import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RealityContext } from './create-memory.dto';

export class PortMemoryDto {
  @IsEnum(RealityContext)
  targetReality: RealityContext;

  @IsOptional()
  @IsEnum(RealityContext)
  sourceReality?: RealityContext;

  @IsOptional()
  @IsString()
  contextNote?: string;

  @IsOptional()
  @IsString()
  fidelity?: string;
}