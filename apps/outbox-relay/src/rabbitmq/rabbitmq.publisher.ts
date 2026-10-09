import { Inject, Injectable } from '@nestjs/common';
import type { ChannelWrapper } from 'amqp-connection-manager';
import { RABBITMQ_CHANNEL } from '../outbox-relay.tokens';
import { EventPublisher } from '../outbox/event-publisher';
import { PAYMENTS_EXCHANGE } from '@app/messaging';

@Injectable()
export class RabbitMQPublisher implements EventPublisher {
  constructor(
    @Inject(RABBITMQ_CHANNEL) private readonly channelWrapper: ChannelWrapper,
  ) {}

  async publish(
    routingKey: string,
    payload: object,
    messageId: string,
  ): Promise<void> {
    await this.channelWrapper.publish(
      PAYMENTS_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, messageId, contentType: 'application/json' },
    );
  }
}
