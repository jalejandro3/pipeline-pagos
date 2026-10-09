import { NestFactory } from '@nestjs/core';
import { OutboxRelayModule } from './outbox-relay.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(OutboxRelayModule);
  app.enableShutdownHooks();
}
bootstrap();
