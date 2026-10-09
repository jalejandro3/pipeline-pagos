import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxRelay } from './outbox/outbox.relay';
import { EVENT_PUBLISHER } from './outbox-relay.tokens';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RabbitMQPublisher } from './rabbitmq/rabbitmq.publisher';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('POSTGRES_HOST'),
        port: Number(config.getOrThrow<string>('POSTGRES_PORT')),
        username: config.getOrThrow<string>('POSTGRES_USER'),
        password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: config.getOrThrow<string>('POSTGRES_DB'),
        synchronize: false,
      }),
    }),
    RabbitMQModule,
  ],
  providers: [
    { provide: EVENT_PUBLISHER, useClass: RabbitMQPublisher },
    OutboxRelay,
  ],
})
export class OutboxRelayModule {}
