import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqp-connection-manager';
import type {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import { RABBITMQ_CHANNEL } from '../../pagos.tokens';
import { PAYMENTS_EXCHANGE } from '@app/messaging';

const RABBITMQ_CONNECTION = Symbol('RABBITMQ_CONNECTION');

@Module({
  providers: [
    {
      provide: RABBITMQ_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService): AmqpConnectionManager =>
        amqp.connect([config.getOrThrow<string>('RABBITMQ_URL')]),
    },
    {
      provide: RABBITMQ_CHANNEL,
      inject: [RABBITMQ_CONNECTION],
      useFactory: (connection: AmqpConnectionManager): ChannelWrapper =>
        connection.createChannel({
          json: false,
          setup: async (channel: ConfirmChannel) => {
            await channel.assertExchange(PAYMENTS_EXCHANGE, 'topic', {
              durable: true,
            });
          },
        }),
    },
  ],
  exports: [RABBITMQ_CHANNEL],
})
export class RabbitMQModule implements OnApplicationShutdown {
  constructor(
    @Inject(RABBITMQ_CONNECTION)
    private readonly connection: AmqpConnectionManager,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.connection.close();
  }
}
