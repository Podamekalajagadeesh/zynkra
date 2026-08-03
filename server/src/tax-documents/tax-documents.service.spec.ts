import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaxDocumentsService } from './tax-documents.service';
import { TaxDocument, TaxDocumentStatus } from './entities/tax-document.entity';
import { LedgerEntry } from '../wallet/entities/ledger-entry.entity';
import { UsersService } from '../users/users.service';

describe('TaxDocumentsService', () => {
  let service: TaxDocumentsService;
  let docsRepo: jest.Mocked<any>;
  let ledgerRepo: jest.Mocked<any>;
  let usersService: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxDocumentsService,
        {
          provide: getRepositoryToken(TaxDocument),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LedgerEntry),
          useValue: { find: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findOneById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TaxDocumentsService>(TaxDocumentsService);
    docsRepo = module.get(getRepositoryToken(TaxDocument));
    ledgerRepo = module.get(getRepositoryToken(LedgerEntry));
    usersService = module.get(UsersService);
  });

  describe('generate', () => {
    it('is idempotent — returns the existing document for the year', async () => {
      docsRepo.findOne.mockResolvedValue({
        id: 'doc-1',
        taxYear: 2025,
        totalAmount: 100,
      });

      const result = await service.generate('user-1', 2025);
      expect(result.id).toBe('doc-1');
      expect(ledgerRepo.find).not.toHaveBeenCalled();
    });

    it('aggregates positive earnings for the year into the total', async () => {
      docsRepo.findOne.mockResolvedValue(null);
      usersService.findOneById.mockResolvedValue({ id: 'user-1' });
      ledgerRepo.find.mockResolvedValue([
        { amount: 250 },
        { amount: 50 },
        { amount: -30 }, // debits (payouts) are excluded
      ]);
      docsRepo.create.mockImplementation((data) => data);
      docsRepo.save.mockImplementation((data) => data);

      const result = await service.generate('user-1', 2025);

      expect(result.totalAmount).toBe(300);
      expect(result.taxYear).toBe(2025);
      expect(result.formType).toBe('1099-NEC');
      expect(result.status).toBe(TaxDocumentStatus.AVAILABLE);
    });

    it('rejects out-of-range years', async () => {
      await expect(service.generate('user-1', 1900)).rejects.toThrow();
    });
  });
});
