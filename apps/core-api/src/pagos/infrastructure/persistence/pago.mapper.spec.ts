import { PagoMother } from '../../../../test/mothers/pago.mother';
import { Pago } from '../../domain/pago.entity';
import { PagoStatus } from '../../domain/pago-status';
import { PagoMapper } from './pago.mapper';
import { PagoOrmEntity } from './pago.orm-entity';
import {
  PagoIdInvalidoError,
  PagoAmountInvalidoError,
  PagoNegativeAmountError,
} from '../../domain/errors/pago.errors';

describe('PagoMapper', () => {
  describe('toPersistence', () => {
    it('mapea pago de dominio a entidad orm', () => {
      const pago = PagoMother.draft();
      const resultado = PagoMapper.toPersistence(pago);

      expect(resultado).toBeInstanceOf(PagoOrmEntity);
      expect(resultado).toEqual({
        id: pago.getId(),
        detail: pago.getDetail(),
        amount: '100000.0000',
        status: pago.getStatus(),
      });
    });
  });

  describe('toDomain', () => {
    it('mapea entidad orm a pago de dominio', () => {
      const pagoOrmEntity = new PagoOrmEntity();

      pagoOrmEntity.id = '65811da7-34dd-45f9-a777-61c17874d4f3';
      pagoOrmEntity.detail = 'Compra celular';
      pagoOrmEntity.amount = '100000.0500';
      pagoOrmEntity.status = PagoStatus.EN_PROCESO_PAGO;

      const resultado = PagoMapper.toDomain(pagoOrmEntity);

      expect(resultado).toBeInstanceOf(Pago);
      expect(resultado.getId()).toBe(pagoOrmEntity.id);
      expect(resultado.getDetail()).toBe(pagoOrmEntity.detail);
      expect(resultado.getAmount()).toBe(100000.05);
      expect(resultado.getStatus()).toBe(pagoOrmEntity.status);
    });

    describe('con datos corruptos', () => {
      const crearOrmEntity = (
        overrides: Partial<PagoOrmEntity>,
      ): PagoOrmEntity => {
        const pagoOrmEntity = new PagoOrmEntity();

        pagoOrmEntity.id = '65811da7-34dd-45f9-a777-61c17874d4f3';
        pagoOrmEntity.detail = 'Compra celular';
        pagoOrmEntity.amount = '100000.0000';
        pagoOrmEntity.status = PagoStatus.PENDIENTE;

        return Object.assign(pagoOrmEntity, overrides);
      };

      it('amount no numerico arroja error', () => {
        const pagoOrmEntity = crearOrmEntity({ amount: 'abc' });

        expect(() => PagoMapper.toDomain(pagoOrmEntity)).toThrow(
          PagoAmountInvalidoError,
        );
      });

      it('amount igual a cero arroja error', () => {
        const pagoOrmEntity = crearOrmEntity({ amount: '0.0000' });

        expect(() => PagoMapper.toDomain(pagoOrmEntity)).toThrow(
          PagoNegativeAmountError,
        );
      });

      it('id sin formato uuid arroja error', () => {
        const pagoOrmEntity = crearOrmEntity({ id: 'id-corrupto' });

        expect(() => PagoMapper.toDomain(pagoOrmEntity)).toThrow(
          PagoIdInvalidoError,
        );
      });
    });
  });
});
