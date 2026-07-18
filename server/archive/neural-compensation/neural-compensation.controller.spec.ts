import { Test, TestingModule } from '@nestjs/testing';
import { NeuralCompensationController } from './neural-compensation.controller';

describe('NeuralCompensationController', () => {
  let controller: NeuralCompensationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NeuralCompensationController],
    }).compile();

    controller = module.get<NeuralCompensationController>(NeuralCompensationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
