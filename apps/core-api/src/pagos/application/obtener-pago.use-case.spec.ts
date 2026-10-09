import { mock, MockProxy } from 'jest-mock-extended';
import { ObtenerPago } from './obtener-pago.use-case';
import { PagoRepository } from '../domain/pago.repository';
import { PagoMother } from '../../../test/mothers/pago.mother';

describe('ObtenerPago', () => {
  let pagoRepository: MockProxy<PagoRepository>;
  let obtenerPago: ObtenerPago;

  beforeEach(() => {
    pagoRepository = mock<PagoRepository>();
    obtenerPago = new ObtenerPago(pagoRepository);
  });

  it('obtener pago con id existente retorna pago', async () => {
    const id = 'a787eced-235e-499f-9d4a-d9af225c3498';
    const pagoObtenido = PagoMother.draft();

    pagoRepository.findById.mockResolvedValue(pagoObtenido);

    const resultado = await obtenerPago.execute(id);

    expect(resultado).toBe(pagoObtenido);

    expect(pagoRepository.findById).toHaveBeenCalledTimes(1);
    expect(pagoRepository.findById).toHaveBeenCalledWith(id);
  });

  it('obtener pago con id no existente arroja excepcion', async () => {
    const id = '7a2e96e3-2acb-48e6-b7d6-f9e3034bebb3';

    pagoRepository.findById.mockResolvedValue(null);

    await expect(obtenerPago.execute(id)).rejects.toThrow('Pago no existe');

    expect(pagoRepository.findById).toHaveBeenCalledWith(id);
  });
});
