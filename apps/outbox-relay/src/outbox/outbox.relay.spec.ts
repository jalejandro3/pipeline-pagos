import { Logger } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { DataSource, EntityManager } from 'typeorm';
import { EventPublisher } from './event-publisher';
import { OutboxRelay } from './outbox.relay';

interface OutboxRow {
  id: string;
  event_type: string;
  payload: object;
}

describe('OutboxRelay', () => {
  let dataSource: MockProxy<DataSource>;
  let entityManager: MockProxy<EntityManager>;
  let publisher: MockProxy<EventPublisher>;
  let relay: OutboxRelay;
  let pendientes: OutboxRow[];

  const marcados = () =>
    entityManager.query.mock.calls
      .filter(([sql]) => sql.startsWith('UPDATE'))
      .map(([, params]) => (params as string[])[0]);

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    pendientes = [
      {
        id: 'evento-1',
        event_type: 'payment.initiated',
        payload: { id: 'p1' },
      },
      {
        id: 'evento-2',
        event_type: 'payment.initiated',
        payload: { id: 'p2' },
      },
    ];

    entityManager = mock<EntityManager>();
    entityManager.query.mockImplementation((sql: string) =>
      Promise.resolve(sql.startsWith('SELECT') ? pendientes : []),
    );

    dataSource = mock<DataSource>();
    dataSource.transaction.mockImplementation(((
      work: (em: EntityManager) => Promise<unknown>,
    ) => work(entityManager)) as never);

    publisher = mock<EventPublisher>();
    publisher.publish.mockResolvedValue();

    relay = new OutboxRelay(dataSource, publisher);
  });

  afterEach(() => jest.restoreAllMocks());

  it('publica cada evento pendiente y lo marca como publicado', async () => {
    await relay.procesar();

    expect(publisher.publish).toHaveBeenNthCalledWith(
      1,
      'payment.initiated',
      { id: 'p1' },
      'evento-1',
    );
    expect(publisher.publish).toHaveBeenNthCalledWith(
      2,
      'payment.initiated',
      { id: 'p2' },
      'evento-2',
    );
    expect(marcados()).toEqual(['evento-1', 'evento-2']);
  });

  it('marca el evento solo despues de que el broker confirma', async () => {
    await relay.procesar();

    const [ordenPublish] = publisher.publish.mock.invocationCallOrder;
    const ordenUpdate = entityManager.query.mock.calls.findIndex(([sql]) =>
      sql.startsWith('UPDATE'),
    );

    expect(
      entityManager.query.mock.invocationCallOrder[ordenUpdate],
    ).toBeGreaterThan(ordenPublish);
  });

  it('si falla la publicacion no marca ese evento ni los siguientes', async () => {
    publisher.publish
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('broker caido'));
    pendientes.push({
      id: 'evento-3',
      event_type: 'payment.initiated',
      payload: { id: 'p3' },
    });

    await expect(relay.procesar()).resolves.toBeUndefined();

    expect(marcados()).toEqual(['evento-1']);
    expect(publisher.publish).toHaveBeenCalledTimes(2);
  });

  it('no hace nada si no hay eventos pendientes', async () => {
    pendientes = [];

    await relay.procesar();

    expect(publisher.publish).not.toHaveBeenCalled();
    expect(marcados()).toEqual([]);
  });

  it('no ejecuta dos procesamientos en paralelo', async () => {
    await Promise.all([relay.procesar(), relay.procesar()]);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('bloquea las filas con SKIP LOCKED para soportar varias instancias', async () => {
    await relay.procesar();

    const [select] = entityManager.query.mock.calls[0];

    expect(select).toContain('WHERE published_at IS NULL');
    expect(select).toContain('FOR UPDATE SKIP LOCKED');
  });
});
