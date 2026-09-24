import { Module } from '@nestjs/common';
import { BffController } from './bff.controller';
import { BffService } from './bff.service';

@Module({
  imports: [],
  controllers: [BffController],
  providers: [BffService],
})
export class BffModule {}
