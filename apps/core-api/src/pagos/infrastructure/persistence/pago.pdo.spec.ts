import { mock, MockProxy } from 'jest-mock-extended';
import { EntityManager, Repository } from 'typeorm';
import { PagoMother } from '../../../../test/mothers/pago.mother';
import { PagoStatus } from '../../domain/pago-status';
import { OutboxOrmEntity } from '../outbox/outbox.orm-entity';
import { PagoOrmEntity } from './pago.orm-entity';
import { PagoPDO } from './pago.pdo';

// @nestjs/typeorm v12 ships ESM only and Jest runs CommonJS on Node 22.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

describe('PagoPDO', () => {
  let repository: MockProxy<Repository<PagoOrmEntity>>;
  let entityManager: MockProxy<EntityManager>;
  let pagoPDO: PagoPDO;

  beforeEach(() => {
    entityManager = mock<EntityManager>();
    repository = mock<Repository<PagoOrmEntity>>();

    Object.assign(repository, {
      manager: {
        transaction: (work: (em: EntityManager) => Promise<unknown>) =>
          work(entityManager),
      },
    });

    pagoPDO = new PagoPDO(repository);
  });

  describe('save', () => {
    it('guarda el pago y sus eventos en el outbox dentro de la transaccion', async () => {
      const pago = PagoMother.draft();

      await pagoPDO.save(pago);

      const [[pagoGuardado]] = entityManager.save.mock.calls as unknown as [
        [PagoOrmEntity],
      ];
      const [[target, eventosGuardados]] = entityManager.insert.mock
        .calls as unknown as [[unknown, OutboxOrmEntity[]]];

      expect(entityManager.save).toHaveBeenCalledTimes(1);
      expect(pagoGuardado).toBeInstanceOf(PagoOrmEntity);
      expect(pagoGuardado.id).toBe(pago.getId());

      expect(entityManager.insert).toHaveBeenCalledTimes(1);
      expect(target).toBe(OutboxOrmEntity);
      expect(eventosGuardados).toHaveLength(1);
      expect(eventosGuardados[0]).toBeInstanceOf(OutboxOrmEntity);
      expect(eventosGuardados[0].aggregateId).toBe(pago.getId());
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('no escribe en el outbox si el pago no tiene eventos', async () => {
      const pago = PagoMother.withStatus(PagoStatus.PAGADO);

      await pagoPDO.save(pago);

      expect(entityManager.save).toHaveBeenCalledWith(
        expect.any(PagoOrmEntity),
      );
      expect(entityManager.insert).not.toHaveBeenCalled();
    });

    it('no vuelve a escribir eventos ya guardados', async () => {
      const pago = PagoMother.draft();

      await pagoPDO.save(pago);
      entityManager.insert.mockClear();
      await pagoPDO.save(pago);

      expect(entityManager.insert).not.toHaveBeenCalled();
    });
  });
});
