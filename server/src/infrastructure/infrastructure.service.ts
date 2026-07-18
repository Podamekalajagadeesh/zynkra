import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InfrastructureHealthSnapshot {
  status: 'ok' | 'degraded';
  services: {
    kubernetes: 'configured' | 'not-configured';
    loadBalancer: 'configured' | 'not-configured';
    autoScaling: 'configured' | 'not-configured';
    databaseSharding: 'configured' | 'not-configured';
    redis: 'configured' | 'not-configured';
    cdn: 'configured' | 'not-configured';
    monitoring: 'configured' | 'not-configured';
    backup: 'configured' | 'not-configured';
  };
  generatedAt: string;
}

@Injectable()
export class InfrastructureService {
  constructor(private readonly configService: ConfigService) {}

  getHealthSnapshot(): InfrastructureHealthSnapshot {
    const services: InfrastructureHealthSnapshot['services'] = {
      kubernetes: this.isConfigured('KUBERNETES_NAMESPACE') ? 'configured' : 'not-configured',
      loadBalancer: this.isConfigured('LOAD_BALANCER_HOST') ? 'configured' : 'not-configured',
      autoScaling: this.isConfigured('AUTOSCALER_ENABLED') ? 'configured' : 'not-configured',
      databaseSharding: this.isConfigured('DATABASE_SHARDING_ENABLED') ? 'configured' : 'not-configured',
      redis: this.isConfigured('REDIS_HOST') ? 'configured' : 'not-configured',
      cdn: this.isConfigured('CDN_BASE_URL') ? 'configured' : 'not-configured',
      monitoring: this.isConfigured('PROMETHEUS_ENDPOINT') ? 'configured' : 'not-configured',
      backup: this.isConfigured('BACKUP_BUCKET') ? 'configured' : 'not-configured',
    };

    const hasAnyConfigured = Object.values(services).some((state) => state === 'configured');

    return {
      status: hasAnyConfigured ? 'ok' : 'degraded',
      services,
      generatedAt: new Date().toISOString(),
    };
  }

  private isConfigured(key: string): boolean {
    const value = this.configService.get<string>(key, '');
    return Boolean(value && String(value).trim());
  }
}
