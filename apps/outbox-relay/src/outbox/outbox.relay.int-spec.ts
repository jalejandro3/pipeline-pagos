import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { DataSource } from 'typeorm';
import { createTestDataSource } from '../../test/integration/test-data-source';
import { EventPublisher } from './event-publisher';
import { OutboxRelay } from './outbox.relay';

describe('OutboxRelay (integracion)', () => {
  let dataSource: DataSource;
  let publisher: MockProxy<EventPublisher>;

  const pendientes = async () => {
    const [{ total }] = await dataSource.query(
      'SELECT count(*)::int AS total FROM outbox WHERE published_at IS NULL',
    );
    return total as number;
  };

  const insertarEventos = async (cantidad: number) => {
    for (let i = 0; i < cantidad; i++) {
      await dataSource.query(
        'INSERT INTO outbox (id, aggregate_id, event_type, payload) VALUES ($1, $2, $3, $4)',
        [randomUUID(), randomUUID(), 'payment.initiated', { numero: i }],
      );
    }
  };

  beforeAll(async () => {
    dataSource = await createTestDataSource().initialize();
  });

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    await dataSource.query('TRUNCATE outbox');
    publisher = mock<EventPublisher>();
    publisher.publish.mockResolvedValue();
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(() => dataSource.destroy());

  it('publica los eventos pendientes y los marca como publicados', async () => {
    await insertarEventos(1);

    await new OutboxRelay(dataSource, publisher).procesar();

    expect(publisher.publish).toHaveBeenCalledWith(
      'payment.initiated',
      { numero: 0 },
      expect.any(String),
    );
    expect(await pendientes()).toBe(0);
  });

  it('si falla la publicacion el evento queda pendiente', async () => {
    publisher.publish.mockRejectedValue(new Error('broker caido'));
    await insertarEventos(1);

    await new OutboxRelay(dataSource, publisher).procesar();

    expect(await pendientes()).toBe(1);
  });

  it('dos instancias en paralelo no publican el mismo evento', async () => {
    await insertarEventos(4);
    publisher.publish.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    await Promise.all([
      new OutboxRelay(dataSource, publisher).procesar(),
      new OutboxRelay(dataSource, publisher).procesar(),
    ]);

    const idsPublicados = publisher.publish.mock.calls.map(([, , id]) => id);

    expect(idsPublicados).toHaveLength(4);
    expect(new Set(idsPublicados).size).toBe(4);
    expect(await pendientes()).toBe(0);
  });
});
