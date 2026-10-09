import { PagoMother } from '../../../test/mothers/pago.mother';
import { Pago } from './pago.entity';
import { PagoStatus } from './pago-status';
import { PagoInicializado } from './events/pago-inicializado.event';
import {
  PagoIdInvalidoError,
  PagoDetailInvalidoError,
  PagoAmountInvalidoError,
  PagoNegativeAmountError,
  TransicionInvalidaError,
} from './errors/pago.errors';

describe('Pago', () => {
  let pago: Pago;

  beforeEach(() => {
    pago = PagoMother.draft();
  });

  describe('id', () => {
    it('reconstruir pago con id sin formato uuid arroja error', () => {
      expect(() =>
        Pago.fromPrimitive(
          'mal-id',
          'Mal pago',
          100,
          PagoStatus.EN_PROCESO_PAGO,
        ),
      ).toThrow(PagoIdInvalidoError);
    });
  });

  describe('detail', () => {
    it('pago sin detail arroja excepcion', () => {
      expect(() =>
        Pago.fromPrimitive(
          '9f863477-3112-4d7f-aca9-6f75b904c679',
          '',
          100,
          PagoStatus.EN_PROCESO_PAGO,
        ),
      ).toThrow(PagoDetailInvalidoError);
    });
  });

  describe('amount', () => {
    it('pago con monto no finito arroja excepcion', () => {
      expect(() => PagoMother.withAmount(NaN)).toThrow(PagoAmountInvalidoError);
    });

    it('pago con monto igual a cero arroja excepcion', () => {
      expect(() => PagoMother.withAmount(0)).toThrow(PagoNegativeAmountError);
    });

    it('pago con monto menor a cero arroja excepcion', () => {
      expect(() => PagoMother.withAmount(-100)).toThrow(
        PagoNegativeAmountError,
      );
    });
  });

  describe('status', () => {
    it('nuevo pago se crea con estado PENDIENTE', () => {
      expect(pago.getStatus()).toBe(PagoStatus.PENDIENTE);
    });
  });

  describe('eventos de dominio', () => {
    it('crear pago registra evento PagoInicializado con los datos del pago', () => {
      const [evento] = pago.pullDomainEvents();

      expect(evento).toBeInstanceOf(PagoInicializado);
      expect(evento.aggregateId).toBe(pago.getId());
      expect(evento.eventType).toBe('payment.initiated');
      expect(evento.toPrimitives()).toEqual({
        id: pago.getId(),
        detail: pago.getDetail(),
        amount: pago.getAmount(),
        status: PagoStatus.PENDIENTE,
      });
    });

    it('reconstruir pago no registra eventos', () => {
      const pagoReconstruido = PagoMother.withStatus(PagoStatus.PAGADO);
      expect(pagoReconstruido.pullDomainEvents()).toEqual([]);
    });

    it('pullDomainEvents vacia los eventos registrados', () => {
      pago.pullDomainEvents();
      expect(pago.pullDomainEvents()).toEqual([]);
    });
  });

  describe('transicion pago', () => {
    describe('transiciones exitosas', () => {
      it('pago transiciona a proceso de pago', () => {
        pago.procesar();
        expect(pago.getStatus()).toBe(PagoStatus.EN_PROCESO_PAGO);
      });
      it('pago transiciona a pagado', () => {
        const pagoEnProceso = PagoMother.withStatus(PagoStatus.EN_PROCESO_PAGO);
        pagoEnProceso.pagar();
        expect(pagoEnProceso.getStatus()).toBe(PagoStatus.PAGADO);
      });
      it('pago transiciona a facturado', () => {
        const pagoPagado = PagoMother.withStatus(PagoStatus.PAGADO);
        pagoPagado.facturar();
        expect(pagoPagado.getStatus()).toBe(PagoStatus.FACTURADO);
      });
      it('pago transiciona a finalizado', () => {
        const pagoFacturado = PagoMother.withStatus(PagoStatus.FACTURADO);
        pagoFacturado.finalizar();
        expect(pagoFacturado.getStatus()).toBe(PagoStatus.FINALIZADO);
      });
    });

    describe('transiciones fallidas', () => {
      it('pago en estado PENDIENTE puede fallar', () => {
        pago.fallo();
        expect(pago.getStatus()).toBe(PagoStatus.FALLIDO);
      });
    });

    describe('trasiciones no permitidas', () => {
      it('pago transiciona de PENDIENTE a PAGADO arroja error', () => {
        expect(() => pago.pagar()).toThrow(TransicionInvalidaError);
      });
      it('pago transiciona de EN_PROCESO_PAGO a FACTURADO arroja error', () => {
        const pagoEnProceso = PagoMother.withStatus(PagoStatus.EN_PROCESO_PAGO);
        expect(() => pagoEnProceso.facturar()).toThrow(TransicionInvalidaError);
      });
      it('pago transiciona de PENDIENTE a FINALIZADO arroja error', () => {
        expect(() => pago.finalizar()).toThrow(TransicionInvalidaError);
      });
    });
  });
});
