import { mock, MockProxy } from 'jest-mock-extended';
import type { ChannelWrapper } from 'amqp-connection-manager';
import { RabbitMQPublisher } from './rabbitmq.publisher';

describe('RabbitMQPublisher', () => {
  let channelWrapper: MockProxy<ChannelWrapper>;
  let publisher: RabbitMQPublisher;

  beforeEach(() => {
    channelWrapper = mock<ChannelWrapper>();
    publisher = new RabbitMQPublisher(channelWrapper);
  });

  it('publica el payload como JSON persistente en payments.exchange', async () => {
    channelWrapper.publish.mockResolvedValue(true);
    const payload = { id: 'pago-1', amount: 100 };

    await publisher.publish('payment.initiated', payload, 'evento-1');

    const [exchange, routingKey, content, options] =
      channelWrapper.publish.mock.calls[0];

    expect(exchange).toBe('payments.exchange');
    expect(routingKey).toBe('payment.initiated');
    expect(JSON.parse((content as Buffer).toString())).toEqual(payload);
    expect(options).toEqual({
      persistent: true,
      messageId: 'evento-1',
      contentType: 'application/json',
    });
  });

  it('propaga el error si el broker no confirma la publicacion', async () => {
    channelWrapper.publish.mockRejectedValue(new Error('nack'));

    await expect(
      publisher.publish('payment.initiated', {}, 'evento-1'),
    ).rejects.toThrow('nack');
  });
});
