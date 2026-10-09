import { DataSource } from 'typeorm';
import { OutboxOrmEntity } from '../../src/pagos/infrastructure/outbox/outbox.orm-entity';
import { PagoOrmEntity } from '../../src/pagos/infrastructure/persistence/pago.orm-entity';

export function createTestDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB_TEST,
    entities: [PagoOrmEntity, OutboxOrmEntity],
  });
}

export async function truncateTables(dataSource: DataSource): Promise<void> {
  await dataSource.query('TRUNCATE outbox, pagos');
}
