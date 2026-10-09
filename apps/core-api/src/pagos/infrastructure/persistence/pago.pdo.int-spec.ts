import { DataSource } from 'typeorm';
import { PagoMother } from '../../../../test/mothers/pago.mother';
import {
  createTestDataSource,
  truncateTables,
} from '../../../../test/integration/test-data-source';
import { PagoStatus } from '../../domain/pago-status';
import { PagoOrmEntity } from './pago.orm-entity';
import { PagoPDO } from './pago.pdo';

// @nestjs/typeorm v12 ships ESM only and Jest runs CommonJS on Node 22.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

describe('PagoPDO (integracion)', () => {
  let dataSource: DataSource;
  let pagoPDO: PagoPDO;

  const contar = async (
    tabla: 'pagos' | 'outbox',
    columna: string,
    id: string,
  ) => {
    const [{ total }] = await dataSource.query(
      `SELECT count(*)::int AS total FROM ${tabla} WHERE ${columna} = $1`,
      [id],
    );
    return total as number;
  };

  beforeAll(async () => {
    dataSource = await createTestDataSource().initialize();
    pagoPDO = new PagoPDO(dataSource.getRepository(PagoOrmEntity));
  });

  beforeEach(() => truncateTables(dataSource));

  afterAll(() => dataSource.destroy());

  it('guarda el pago y su evento PagoInicializado pendiente en el outbox', async () => {
    const pago = PagoMother.draft();

    await pagoPDO.save(pago);

    const [fila] = await dataSource.query(
      'SELECT event_type, payload, published_at FROM outbox WHERE aggregate_id = $1',
      [pago.getId()],
    );

    expect(await contar('pagos', 'id', pago.getId())).toBe(1);
    expect(fila).toEqual({
      event_type: 'payment.initiated',
      payload: {
        id: pago.getId(),
        detail: pago.getDetail(),
        amount: pago.getAmount(),
        status: PagoStatus.PENDIENTE,
      },
      published_at: null,
    });
  });

  it('si falla la escritura en el outbox no persiste el pago', async () => {
    const pago = PagoMother.draft();
    const eventos = pago.pullDomainEvents();
    jest.spyOn(pago, 'pullDomainEvents').mockReturnValue(eventos);

    await dataSource.query(
      `INSERT INTO outbox (id, aggregate_id, event_type, payload)
       VALUES ($1, $2, 'payment.initiated', '{}')`,
      [eventos[0].eventId, pago.getId()],
    );

    await expect(pagoPDO.save(pago)).rejects.toThrow('outbox_pkey');

    expect(await contar('pagos', 'id', pago.getId())).toBe(0);
  });

  it('recupera el pago guardado con sus datos', async () => {
    const pago = PagoMother.draft();
    await pagoPDO.save(pago);

    const recuperado = await pagoPDO.findById(pago.getId());

    expect(recuperado?.getId()).toBe(pago.getId());
    expect(recuperado?.getDetail()).toBe(pago.getDetail());
    expect(recuperado?.getAmount()).toBe(pago.getAmount());
    expect(recuperado?.getStatus()).toBe(PagoStatus.PENDIENTE);
  });

  it('actualizar un pago existente no agrega eventos al outbox', async () => {
    const pago = PagoMother.draft();
    await pagoPDO.save(pago);

    const recuperado = await pagoPDO.findById(pago.getId());
    recuperado!.procesar();
    await pagoPDO.save(recuperado!);

    const actualizado = await pagoPDO.findById(pago.getId());

    expect(actualizado?.getStatus()).toBe(PagoStatus.EN_PROCESO_PAGO);
    expect(await contar('outbox', 'aggregate_id', pago.getId())).toBe(1);
  });

  it('retorna null si el pago no existe', async () => {
    const resultado = await pagoPDO.findById(
      '0b5c1f4e-6a2d-4c8e-9f3a-2d7b8e1c4a90',
    );

    expect(resultado).toBeNull();
  });
});
