export class RemoteInstanceDto {
  domain: string;
  name: string;
  description?: string;
  baseUrl: string;
  software?: string;
  version?: string;
  isVerified: boolean;
}

export class ConnectInstanceDto {
  domain: string;
  baseUrl: string;
}

export class InstanceResponseDto {
  id: string;
  domain: string;
  name: string;
  description?: string;
  baseUrl: string;
  software?: string;
  version?: string;
  isVerified: boolean;
  lastSyncAt?: Date;
  isConnected: boolean;
}