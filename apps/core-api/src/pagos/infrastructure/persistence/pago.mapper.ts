import { Pago } from '../../domain/pago.entity';
import { PagoOrmEntity } from './pago.orm-entity';
import { DECIMAL_COLUMN } from './decimal-column';

export class PagoMapper {
  static toPersistence(pago: Pago): PagoOrmEntity {
    const pagoOrmEntity = new PagoOrmEntity();

    pagoOrmEntity.id = pago.getId();
    pagoOrmEntity.detail = pago.getDetail();
    pagoOrmEntity.amount = pago.getAmount().toFixed(DECIMAL_COLUMN.scale);
    pagoOrmEntity.status = pago.getStatus();

    return pagoOrmEntity;
  }

  static toDomain(pagoOrmEntity: PagoOrmEntity): Pago {
    return Pago.fromPrimitive(
      pagoOrmEntity.id,
      pagoOrmEntity.detail,
      Number(pagoOrmEntity.amount),
      pagoOrmEntity.status,
    );
  }
}
