import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TaxDocument, TaxDocumentStatus } from './entities/tax-document.entity';
import { LedgerEntry } from '../wallet/entities/ledger-entry.entity';
import { UsersService } from '../users/users.service';

const VALID_YEAR_RANGE = 50;

@Injectable()
export class TaxDocumentsService {
  constructor(
    @InjectRepository(TaxDocument)
    private taxDocumentsRepository: Repository<TaxDocument>,
    @InjectRepository(LedgerEntry)
    private ledgerRepository: Repository<LedgerEntry>,
    private readonly usersService: UsersService,
  ) {}

  async list(userId: string): Promise<TaxDocument[]> {
    return this.taxDocumentsRepository.find({
      where: { user: { id: userId } },
      order: { taxYear: 'DESC' },
    });
  }

  async generate(userId: string, year: number): Promise<TaxDocument> {
    const currentYear = new Date().getFullYear();
    if (year < currentYear - VALID_YEAR_RANGE || year > currentYear + 1) {
      throw new NotFoundException('Invalid tax year');
    }

    // Idempotent — one 1099-NEC per user + year + form type.
    const existing = await this.taxDocumentsRepository.findOne({
      where: { user: { id: userId }, taxYear: year, formType: '1099-NEC' },
    });
    if (existing) {
      return existing;
    }

    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1099-NEC reports gross reportable income: positive earnings for the year.
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const entries = await this.ledgerRepository.find({
      where: {
        user: { id: userId },
        type: 'earning',
        createdAt: Between(start, end),
      },
    });

    const totalAmount = entries.reduce(
      (sum, entry) => sum + Math.max(0, Number(entry.amount)),
      0,
    );

    const document = this.taxDocumentsRepository.create({
      user,
      taxYear: year,
      formType: '1099-NEC',
      status: TaxDocumentStatus.AVAILABLE,
      totalAmount: Math.round(totalAmount * 100) / 100,
      metadata: { earningsEntryCount: entries.length, currency: 'usd' },
    });

    return this.taxDocumentsRepository.save(document);
  }

  async getDocument(userId: string, id: string): Promise<TaxDocument> {
    const document = await this.taxDocumentsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!document) {
      throw new NotFoundException('Tax document not found');
    }
    if (document.user.id !== userId) {
      throw new ForbiddenException('You can only access your own tax documents');
    }
    return document;
  }

  // Plain-text 1099-NEC summary. This is a record for the creator's own tax
  // preparation — it is not filed with the IRS.
  renderAsText(document: TaxDocument): string {
    const user = document.user as { username?: string | null; email?: string | null };
    const lines = [
      'ZYNKRA — TAX SUMMARY (NOT AN IRS FILING)',
      'Form type: 1099-NEC (nonemployee compensation)',
      `Tax year: ${document.taxYear}`,
      `Recipient: ${user.username ?? user.email ?? 'Zynkra creator'}`,
      `Gross reportable income: $${Number(document.totalAmount).toFixed(2)}`,
      `Earnings transactions counted: ${document.metadata?.earningsEntryCount ?? 0}`,
      '',
      'This document summarizes earnings paid through Zynkra for the tax year',
      'above. Report it with your other income. Zynkra is not a tax advisor;',
      'consult a qualified professional before filing.',
      `Generated: ${document.createdAt.toISOString()}`,
    ];
    return lines.join('\n');
  }
}
