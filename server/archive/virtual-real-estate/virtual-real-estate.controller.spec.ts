import { Test, TestingModule } from '@nestjs/testing';
import { VirtualRealEstateController } from './virtual-real-estate.controller';

describe('VirtualRealEstateController', () => {
  let controller: VirtualRealEstateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VirtualRealEstateController],
    }).compile();

    controller = module.get<VirtualRealEstateController>(VirtualRealEstateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
