import { NestFactory } from '@nestjs/core';
import { configureApp } from './configure-app';
import { CoreApiModule } from './core-api.module';

async function bootstrap() {
  const app = await NestFactory.create(CoreApiModule);
  configureApp(app);
  configureApp(app);
  app.enableShutdownHooks();
  await app.listen(process.env.port ?? 4000);
}
bootstrap();
