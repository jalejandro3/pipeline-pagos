import { PagoMother } from '../../../../test/mothers/pago.mother';
import { OutboxMapper } from './outbox.mapper';
import { OutboxOrmEntity } from './outbox.orm-entity';

describe('OutboxMapper', () => {
  describe('toPersistence', () => {
    it('mapea evento de dominio a entidad orm del outbox', () => {
      const pago = PagoMother.draft();
      const [evento] = pago.pullDomainEvents();

      const resultado = OutboxMapper.toPersistence(evento);

      expect(resultado).toBeInstanceOf(OutboxOrmEntity);
      expect(resultado).toEqual({
        id: evento.eventId,
        aggregateId: pago.getId(),
        eventType: 'payment.initiated',
        payload: {
          id: pago.getId(),
          detail: pago.getDetail(),
          amount: pago.getAmount(),
          status: pago.getStatus(),
        },
        occurredAt: evento.occurredOn,
      });
    });
  });
});
