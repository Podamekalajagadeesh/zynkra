import { Test, TestingModule } from '@nestjs/testing';
import { VirtualRealEstateService } from './virtual-real-estate.service';

describe('VirtualRealEstateService', () => {
  let service: VirtualRealEstateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VirtualRealEstateService],
    }).compile();

    service = module.get<VirtualRealEstateService>(VirtualRealEstateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
