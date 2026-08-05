import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, createHmac, randomBytes } from 'crypto';
import { PaymentsService } from '../payments/payments.service';
import { WebhookEndpoint } from './entities/webhook-endpoint.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import {
  CreateWebhookEndpointDto,
  UpdateWebhookEndpointDto,
} from './dto/create-webhook-endpoint.dto';

const MAX_RETRIES = 5;

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('base64url');
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookEndpoint)
    private readonly endpointsRepository: Repository<WebhookEndpoint>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveriesRepository: Repository<WebhookDelivery>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const event = this.paymentsService.constructWebhookEvent(rawBody, signature);
    this.logger.log(`Stripe webhook received: ${event.type} (${event.id})`);
    return this.paymentsService.handleWebhookEvent(event);
  }

  async createEndpoint(
    developerId: string,
    dto: CreateWebhookEndpointDto,
  ): Promise<WebhookEndpoint & { secret: string }> {
    const secret = randomBytes(32).toString('base64url');
    const endpoint = this.endpointsRepository.create({
      developer: { id: developerId } as never,
      url: dto.url,
      events: dto.events,
      secretHash: sha256(secret),
      active: true,
    });
    const saved = await this.endpointsRepository.save(endpoint);
    return { ...saved, secret };
  }

  async listEndpoints(developerId: string): Promise<WebhookEndpoint[]> {
    return this.endpointsRepository.find({
      where: { developer: { id: developerId } },
      order: { createdAt: 'DESC' },
    });
  }

  async updateEndpoint(
    developerId: string,
    endpointId: string,
    dto: UpdateWebhookEndpointDto,
  ): Promise<WebhookEndpoint> {
    const endpoint = await this.getOwnedEndpoint(developerId, endpointId);
    if (dto.url !== undefined) endpoint.url = dto.url;
    if (dto.events !== undefined) endpoint.events = dto.events;
    if (dto.active !== undefined) endpoint.active = dto.active;
    return this.endpointsRepository.save(endpoint);
  }

  async deleteEndpoint(developerId: string, endpointId: string): Promise<void> {
    const endpoint = await this.getOwnedEndpoint(developerId, endpointId);
    await this.endpointsRepository.remove(endpoint);
  }

  async rotateSecret(
    developerId: string,
    endpointId: string,
  ): Promise<{ secret: string }> {
    const endpoint = await this.getOwnedEndpoint(developerId, endpointId);
    const secret = randomBytes(32).toString('base64url');
    endpoint.secretHash = sha256(secret);
    await this.endpointsRepository.save(endpoint);
    return { secret };
  }

  async getDeliveries(
    developerId: string,
    endpointId: string,
  ): Promise<WebhookDelivery[]> {
    await this.getOwnedEndpoint(developerId, endpointId);
    return this.deliveriesRepository.find({
      where: { endpoint: { id: endpointId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // Dispatches `event` to every active endpoint subscribed to it.
  async dispatchEvent(event: string, payload: Record<string, unknown>): Promise<void> {
    const endpoints = await this.endpointsRepository.find({ where: { active: true } });
    const targets = endpoints.filter((e) => e.events.includes(event));
    if (targets.length === 0) return;

    await Promise.allSettled(
      targets.map((endpoint) => this.deliver(endpoint, event, payload)),
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedDeliveries(): Promise<void> {
    const failed = await this.deliveriesRepository.find({
      where: { status: 'failed' },
      relations: ['endpoint'],
      take: 50,
    });
    for (const delivery of failed) {
      if (delivery.retries >= MAX_RETRIES) continue;
      if (!delivery.endpoint?.active) continue;
      await this.send(delivery.endpoint, delivery).catch(() => undefined);
    }
  }

  private async deliver(
    endpoint: WebhookEndpoint,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    let delivery = this.deliveriesRepository.create({
      endpoint,
      event,
      payload,
      status: 'pending',
      retries: 0,
    });
    delivery = await this.deliveriesRepository.save(delivery);
    await this.send(endpoint, delivery).catch(async () => {
      await this.deliveriesRepository.update(delivery.id, {
        status: 'failed',
        retries: delivery.retries + 1,
      });
    });
  }

  private async send(
    endpoint: WebhookEndpoint,
    delivery: WebhookDelivery,
  ): Promise<void> {
    const body = JSON.stringify({
      id: delivery.id,
      event: delivery.event,
      createdAt: delivery.createdAt.toISOString(),
      data: delivery.payload,
    });
    const signature = createHmac('sha256', this.getSigningSecret(endpoint.secretHash))
      .update(body)
      .digest('hex');

    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-zynkra-event': delivery.event,
        'x-zynkra-signature': `sha256=${signature}`,
        'user-agent': 'zynkra-webhooks/1.0',
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    await this.deliveriesRepository.update(delivery.id, {
      status: 'delivered',
      deliveredAt: new Date(),
      lastError: null,
    });
  }

  // The plaintext secret is only returned once at creation and is stored hashed,
  // so delivery signs with a deterministic key derived from the stored hash.
  private getSigningSecret(secretHash: string): string {
    return sha256(`${secretHash}:delivery-signing`);
  }

  private async getOwnedEndpoint(
    developerId: string,
    endpointId: string,
  ): Promise<WebhookEndpoint> {
    const endpoint = await this.endpointsRepository.findOne({
      where: { id: endpointId, developer: { id: developerId } },
    });
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }
    return endpoint;
  }
}
