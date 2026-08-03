import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { UsersService } from '../users/users.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoicesRepo: jest.Mocked<any>;
  let usersService: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: { findOneById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    invoicesRepo = module.get(getRepositoryToken(Invoice));
    usersService = module.get(UsersService);
  });

  describe('create', () => {
    it('computes subtotal, tax, and total server-side', async () => {
      usersService.findOneById.mockResolvedValue({ id: 'user-1' });
      invoicesRepo.create.mockImplementation((data) => data);
      invoicesRepo.save.mockImplementation((data) => data);

      const result = await service.create('user-1', {
        clientName: 'Acme',
        taxRate: 10,
        lineItems: [
          { description: 'Sponsored post', quantity: 2, unitPrice: 50 },
          { description: 'Stories', quantity: 1, unitPrice: 20 },
        ],
      });

      expect(result.subtotal).toBe(120);
      expect(result.taxAmount).toBe(12);
      expect(result.total).toBe(132);
      expect(result.invoiceNo).toMatch(/^INV-\d{4}-\d{6}$/);
      expect(result.status).toBe(InvoiceStatus.DRAFT);
    });
  });

  describe('update', () => {
    it('recomputes totals when line items change and never trusts client totals', async () => {
      invoicesRepo.findOne.mockResolvedValue({
        id: 'inv-1',
        user: { id: 'user-1' },
        status: InvoiceStatus.DRAFT,
        clientName: 'Acme',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 10 }],
        taxRate: 0,
        subtotal: 10,
        taxAmount: 0,
        total: 10,
      });
      invoicesRepo.save.mockImplementation((data) => data);

      const result = await service.update('user-1', 'inv-1', {
        lineItems: [
          { description: 'A', quantity: 3, unitPrice: 10 },
          { description: 'B', quantity: 1, unitPrice: 5 },
        ],
        taxRate: 10,
      });

      expect(result.subtotal).toBe(35);
      expect(result.taxAmount).toBe(3.5);
      expect(result.total).toBe(38.5);
    });

    it('rejects edits to paid invoices', async () => {
      invoicesRepo.findOne.mockResolvedValue({
        id: 'inv-1',
        user: { id: 'user-1' },
        status: InvoiceStatus.PAID,
        clientName: 'Acme',
        lineItems: [],
        taxRate: 0,
      });

      await expect(
        service.update('user-1', 'inv-1', { clientName: 'Other' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('markPaid', () => {
    it('sets status and paidAt', async () => {
      invoicesRepo.findOne.mockResolvedValue({
        id: 'inv-1',
        user: { id: 'user-1' },
        status: InvoiceStatus.SENT,
      });
      invoicesRepo.save.mockImplementation((data) => data);

      const result = await service.markPaid('user-1', 'inv-1');
      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(result.paidAt).toBeInstanceOf(Date);
    });
  });
});
