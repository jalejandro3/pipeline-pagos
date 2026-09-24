import { Test, TestingModule } from '@nestjs/testing';
import { BffController } from './bff.controller';
import { BffService } from './bff.service';

describe('BffController', () => {
  let bffController: BffController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BffController],
      providers: [BffService],
    }).compile();

    bffController = app.get<BffController>(BffController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(bffController.getHello()).toBe('Hello World!');
    });
  });
});
