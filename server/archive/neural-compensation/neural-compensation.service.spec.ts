import { Test, TestingModule } from '@nestjs/testing';
import { NeuralCompensationService } from './neural-compensation.service';

describe('NeuralCompensationService', () => {
  let service: NeuralCompensationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NeuralCompensationService],
    }).compile();

    service = module.get<NeuralCompensationService>(NeuralCompensationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
