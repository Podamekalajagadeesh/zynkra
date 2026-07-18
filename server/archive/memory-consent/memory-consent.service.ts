import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemoryShareConsent, ConsentStatus, RedactionLevel } from './entities/memory-share-consent.entity';
import { RedactionRule } from './entities/redaction-rule.entity';

@Injectable()
export class MemoryConsentService {
  constructor(
    @InjectRepository(MemoryShareConsent)
    private readonly consentRepository: Repository<MemoryShareConsent>,
    @InjectRepository(RedactionRule)
    private readonly ruleRepository: Repository<RedactionRule>,
  ) {}

  async createConsentRequest(
    requesterId: string,
    memoryId: string,
    recipientIds: string[],
    includedUserIds: string[],
    requestMessage?: string,
  ) {
    const consents = [];
    for (const recipientId of recipientIds) {
      const consent = this.consentRepository.create({
        requesterId,
        memoryId,
        recipientId,
        includedUserIds,
        requestMessage,
      });
      consents.push(await this.consentRepository.save(consent));
    }
    return consents;
  }

  async getUserConsents(userId: string, role: 'requester' | 'recipient') {
    const where = role === 'requester' ? { requesterId: userId } : { recipientId: userId };
    return this.consentRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['requester', 'recipient'],
    });
  }

  async getConsentById(consentId: string) {
    return this.consentRepository.findOne({
      where: { id: consentId },
      relations: ['requester', 'recipient'],
    });
  }

  async grantConsent(
    consentId: string,
    recipientId: string,
    grantedRedactionLevels: Record<string, RedactionLevel>,
    responseMessage?: string,
  ) {
    const consent = await this.consentRepository.findOne({
      where: { id: consentId, recipientId },
    });
    if (!consent) {
      throw new NotFoundException('Consent request not found');
    }
    consent.status = ConsentStatus.GRANTED;
    consent.grantedRedactionLevels = grantedRedactionLevels;
    consent.responseMessage = responseMessage;
    return this.consentRepository.save(consent);
  }

  async revokeConsent(
    consentId: string,
    recipientId: string,
    responseMessage?: string,
  ) {
    const consent = await this.consentRepository.findOne({
      where: { id: consentId, recipientId },
    });
    if (!consent) {
      throw new NotFoundException('Consent request not found');
    }
    consent.status = ConsentStatus.REVOKED;
    consent.responseMessage = responseMessage;
    return this.consentRepository.save(consent);
  }

  async getUserRedactionRules(userId: string) {
    return this.ruleRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async createRedactionRule(
    userId: string,
    data: Partial<RedactionRule>,
  ) {
    const rule = this.ruleRepository.create({ ...data, userId });
    return this.ruleRepository.save(rule);
  }

  async updateRedactionRule(
    ruleId: string,
    userId: string,
    data: Partial<RedactionRule>,
  ) {
    const rule = await this.ruleRepository.findOne({ where: { id: ruleId, userId } });
    if (!rule) {
      throw new NotFoundException('Redaction rule not found');
    }
    Object.assign(rule, data);
    return this.ruleRepository.save(rule);
  }

  async deleteRedactionRule(ruleId: string, userId: string) {
    const result = await this.ruleRepository.delete({ id: ruleId, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Redaction rule not found');
    }
  }

  async getConsentStats(userId: string) {
    const pending = await this.consentRepository.count({
      where: { recipientId: userId, status: ConsentStatus.PENDING },
    });
    const granted = await this.consentRepository.count({
      where: { recipientId: userId, status: ConsentStatus.GRANTED },
    });
    const revoked = await this.consentRepository.count({
      where: { recipientId: userId, status: ConsentStatus.REVOKED },
    });
    return { pending, granted, revoked };
  }
}
