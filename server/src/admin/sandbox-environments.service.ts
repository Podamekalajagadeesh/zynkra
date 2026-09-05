import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { CreateSandboxEnvironmentDto } from './dto/create-sandbox-environment.dto';
import { UpdateSandboxEnvironmentDto } from './dto/update-sandbox-environment.dto';
import {
  SandboxEnvironmentEntity,
  SandboxEnvironmentStatus,
} from './entities/sandbox-environment.entity';

@Injectable()
export class SandboxEnvironmentsService {
  constructor(
    @InjectRepository(SandboxEnvironmentEntity)
    private readonly environments: Repository<SandboxEnvironmentEntity>,
  ) {}

  async create(input: CreateSandboxEnvironmentDto) {
    const slug = this.slugify(input.name);
    const existing = await this.environments.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('A sandbox environment with this name already exists');
    }

    const accessKey = `zk_sbx_${randomBytes(24).toString('hex')}`;
    const environment = this.environments.create({
      name: input.name.trim(),
      slug,
      accessKeyHash: this.hash(accessKey),
      status: SandboxEnvironmentStatus.ACTIVE,
      configuration: input.configuration ?? {},
      expiresAt: input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null,
      lastUsedAt: null,
    });

    const saved = await this.environments.save(environment);
    return { ...this.toPublic(saved), accessKey };
  }

  async list() {
    const environments = await this.environments.find({ order: { createdAt: 'DESC' } });
    return environments.map((environment) => this.toPublic(environment));
  }

  async get(id: string) {
    const environment = await this.environments.findOne({ where: { id } });
    if (!environment) throw new NotFoundException('Sandbox environment not found');
    return this.toPublic(environment);
  }

  async update(id: string, input: UpdateSandboxEnvironmentDto) {
    const environment = await this.findEntity(id);
    Object.assign(environment, input);
    return this.toPublic(await this.environments.save(environment));
  }

  async archive(id: string) {
    return this.update(id, { status: SandboxEnvironmentStatus.ARCHIVED });
  }

  async validateAccess(slug: string, accessKey: string) {
    const environment = await this.environments.findOne({ where: { slug } });
    if (!environment || environment.status !== SandboxEnvironmentStatus.ACTIVE) return false;
    if (environment.expiresAt && environment.expiresAt.getTime() <= Date.now()) return false;
    if (this.hash(accessKey) !== environment.accessKeyHash) return false;
    await this.environments.update(environment.id, { lastUsedAt: new Date() });
    return true;
  }

  private async findEntity(id: string) {
    const environment = await this.environments.findOne({ where: { id } });
    if (!environment) throw new NotFoundException('Sandbox environment not found');
    return environment;
  }

  private toPublic(environment: SandboxEnvironmentEntity) {
    const { accessKeyHash: _accessKeyHash, ...publicEnvironment } = environment;
    return publicEnvironment;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private slugify(value: string) {
    const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug || `sandbox-${randomBytes(6).toString('hex')}`;
  }
}