import { IsIn, IsISO8601, IsOptional, IsString, Length } from 'class-validator';

const incidentStatuses = ['investigating', 'identified', 'monitoring', 'resolved'] as const;
const incidentImpacts = ['minor', 'major', 'critical'] as const;
const maintenanceStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'] as const;

export class CreatePlatformIncidentDto {
  @IsString()
  @Length(1, 160)
  title: string;

  @IsString()
  @Length(1, 10000)
  message: string;

  @IsString()
  @Length(1, 32)
  service: string;

  @IsIn(incidentImpacts)
  impact: typeof incidentImpacts[number];

  @IsOptional()
  @IsIn(incidentStatuses)
  status?: typeof incidentStatuses[number];
}

export class UpdatePlatformIncidentDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10000)
  message?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  service?: string;

  @IsOptional()
  @IsIn(incidentImpacts)
  impact?: typeof incidentImpacts[number];

  @IsOptional()
  @IsIn(incidentStatuses)
  status?: typeof incidentStatuses[number];
}

export class CreatePlatformMaintenanceDto {
  @IsString()
  @Length(1, 160)
  title: string;

  @IsString()
  @Length(1, 10000)
  message: string;

  @IsString()
  @Length(1, 32)
  service: string;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;

  @IsOptional()
  @IsIn(maintenanceStatuses)
  status?: typeof maintenanceStatuses[number];
}

export class UpdatePlatformMaintenanceDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10000)
  message?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  service?: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @IsOptional()
  @IsIn(maintenanceStatuses)
  status?: typeof maintenanceStatuses[number];
}
