import { NestFactory } from '@nestjs/core';
import { BffModule } from './bff.module';

async function bootstrap() {
  const app = await NestFactory.create(BffModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
