import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from '../../domain/pago.entity';
import { PagoRepository } from '../../domain/pago.repository';
import { PagoOrmEntity } from './pago.orm-entity';
import { PagoMapper } from './pago.mapper';
import { OutboxMapper } from '../outbox/outbox.mapper';
import { OutboxOrmEntity } from '../outbox/outbox.orm-entity';

@Injectable()
export class PagoPDO implements PagoRepository {
  constructor(
    @InjectRepository(PagoOrmEntity)
    private readonly repository: Repository<PagoOrmEntity>,
  ) {}

  async findById(id: string): Promise<Pago | null> {
    const entity = await this.repository.findOneBy({ id });

    if (!entity) {
      return null;
    }

    return PagoMapper.toDomain(entity);
  }

  async save(pago: Pago): Promise<Pago> {
    const entity = PagoMapper.toPersistence(pago);
    const outboxEntities = pago
      .pullDomainEvents()
      .map((event) => OutboxMapper.toPersistence(event));

    await this.repository.manager.transaction(async (entityManager) => {
      await entityManager.save(entity);

      if (outboxEntities.length > 0) {
        await entityManager.insert(OutboxOrmEntity, outboxEntities);
      }
    });

    return pago;
  }
}
