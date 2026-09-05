import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, In, MoreThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PlatformIncidentEntity, PlatformIncidentImpact, PlatformIncidentStatus } from './entities/platform-incident.entity';
import { PlatformMaintenanceEntity, PlatformMaintenanceStatus } from './entities/platform-maintenance.entity';
import { PlatformStatusSnapshotEntity } from './entities/platform-status-snapshot.entity';

export interface InfrastructureHealthSnapshot {
  status: 'operational' | 'degraded' | 'outage';
  version: string;
  environment: string;
  responseTimeMs: number;
  services: {
    api: ServiceHealth;
    database: ServiceHealth;
    kubernetes: ServiceHealth;
    loadBalancer: ServiceHealth;
    autoScaling: ServiceHealth;
    databaseSharding: ServiceHealth;
    redis: ServiceHealth;
    cdn: ServiceHealth;
    monitoring: ServiceHealth;
    backup: ServiceHealth;
  };
  generatedAt: string;
}

export interface PlatformStatusPage extends InfrastructureHealthSnapshot {
  activeIncidents: PlatformIncidentEntity[];
  upcomingMaintenance: PlatformMaintenanceEntity[];
  history: PlatformStatusSnapshotEntity[];
}

export interface ServiceHealth {
  status: 'operational' | 'degraded' | 'not-configured' | 'unavailable';
  responseTimeMs?: number;
  detail?: string;
}

@Injectable()
export class InfrastructureService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(PlatformStatusSnapshotEntity)
    private readonly snapshotRepository: Repository<PlatformStatusSnapshotEntity>,
    @InjectRepository(PlatformIncidentEntity)
    private readonly incidentRepository: Repository<PlatformIncidentEntity>,
    @InjectRepository(PlatformMaintenanceEntity)
    private readonly maintenanceRepository: Repository<PlatformMaintenanceEntity>,
  ) {}

  async getHealthSnapshot(): Promise<InfrastructureHealthSnapshot> {
    const startedAt = Date.now();
    const database = await this.checkDatabase();
    const configuredServices = this.getConfiguredServices();
    const services = {
      api: { status: 'operational' as const, responseTimeMs: Date.now() - startedAt },
      database,
      ...configuredServices,
    };
    const serviceStatuses = Object.values(services).map((service) => service.status);
    const hasUnavailableService = serviceStatuses.includes('unavailable');
    const hasDegradedService = serviceStatuses.includes('degraded') || serviceStatuses.includes('not-configured');

    const snapshot: InfrastructureHealthSnapshot = {
      status: hasUnavailableService ? 'outage' : hasDegradedService ? 'degraded' : 'operational',
      version: this.configService.get<string>('APP_VERSION', 'development'),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      responseTimeMs: Date.now() - startedAt,
      services,
      generatedAt: new Date().toISOString(),
    };

    try {
      await this.snapshotRepository.save(this.snapshotRepository.create({
        ...snapshot,
        generatedAt: new Date(snapshot.generatedAt),
      }));
    } catch {
      // Health reporting must remain available when the history store is down.
    }

    return snapshot;
  }

  async getStatusPage(): Promise<PlatformStatusPage> {
    const snapshot = await this.getHealthSnapshot();
    const [activeIncidents, upcomingMaintenance, history] = await Promise.all([
      this.incidentRepository.find({
        where: { status: In(['investigating', 'identified', 'monitoring']) },
        order: { createdAt: 'DESC' },
      }).catch(() => []),
      this.maintenanceRepository.find({
        where: { status: In(['scheduled', 'in-progress']), endsAt: MoreThanOrEqual(new Date()) },
        order: { startsAt: 'ASC' },
      }).catch(() => []),
      this.getHistory(),
    ]);

    return { ...snapshot, activeIncidents, upcomingMaintenance, history };
  }

  async getHistory(limit = 30): Promise<PlatformStatusSnapshotEntity[]> {
    return this.snapshotRepository.find({ order: { generatedAt: 'DESC' }, take: Math.min(Math.max(limit, 1), 100) }).catch(() => []);
  }

  async createIncident(input: {
    title: string;
    message: string;
    service: string;
    impact: PlatformIncidentImpact;
    status?: PlatformIncidentStatus;
  }): Promise<PlatformIncidentEntity> {
    return this.incidentRepository.save(this.incidentRepository.create({ ...input, status: input.status ?? 'investigating', resolvedAt: null }));
  }

  async updateIncident(id: string, input: Partial<Pick<PlatformIncidentEntity, 'title' | 'message' | 'service' | 'impact' | 'status'>>): Promise<PlatformIncidentEntity> {
    const incident = await this.incidentRepository.preload({ id, ...input });
    if (!incident) {
      throw new Error('Incident not found');
    }
    incident.resolvedAt = input.status === 'resolved' ? new Date() : incident.resolvedAt;
    return this.incidentRepository.save(incident);
  }

  async createMaintenance(input: {
    title: string;
    message: string;
    service: string;
    startsAt: string;
    endsAt: string;
    status?: PlatformMaintenanceStatus;
  }): Promise<PlatformMaintenanceEntity> {
    return this.maintenanceRepository.save(this.maintenanceRepository.create({
      ...input,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      status: input.status ?? 'scheduled',
    }));
  }

  async updateMaintenance(id: string, input: Partial<Pick<PlatformMaintenanceEntity, 'title' | 'message' | 'service' | 'status'>> & { startsAt?: string; endsAt?: string }): Promise<PlatformMaintenanceEntity> {
    const maintenance = await this.maintenanceRepository.preload({
      id,
      ...input,
      ...(input.startsAt ? { startsAt: new Date(input.startsAt) } : {}),
      ...(input.endsAt ? { endsAt: new Date(input.endsAt) } : {}),
    });
    if (!maintenance) {
      throw new Error('Maintenance window not found');
    }
    return this.maintenanceRepository.save(maintenance);
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startedAt = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'operational', responseTimeMs: Date.now() - startedAt };
    } catch {
      return { status: 'unavailable', responseTimeMs: Date.now() - startedAt, detail: 'Database probe failed' };
    }
  }

  private getConfiguredServices(): Omit<InfrastructureHealthSnapshot['services'], 'api' | 'database'> {
    const services: InfrastructureHealthSnapshot['services'] = {
      api: { status: 'operational' },
      database: { status: 'operational' },
      kubernetes: this.configurationHealth('KUBERNETES_NAMESPACE'),
      loadBalancer: this.configurationHealth('LOAD_BALANCER_HOST'),
      autoScaling: this.configurationHealth('AUTOSCALER_ENABLED'),
      databaseSharding: this.configurationHealth('DATABASE_SHARDING_ENABLED'),
      redis: this.configurationHealth('REDIS_HOST'),
      cdn: this.configurationHealth('CDN_BASE_URL'),
      monitoring: this.configurationHealth('PROMETHEUS_ENDPOINT'),
      backup: this.configurationHealth('BACKUP_BUCKET'),
    };

    const { api: _api, database: _database, ...configuredServices } = services;
    return configuredServices;
  }

  private configurationHealth(key: string): ServiceHealth {
    return this.isConfigured(key) ? { status: 'operational' } : { status: 'not-configured', detail: `${key} is not configured` };
  }

  private isConfigured(key: string): boolean {
    const value = this.configService.get<string>(key, '');
    return Boolean(value && String(value).trim());
  }
}
