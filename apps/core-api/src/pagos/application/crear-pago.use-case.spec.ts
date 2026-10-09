import { mock, MockProxy } from 'jest-mock-extended';
import { CrearPago } from './crear-pago.use-case';
import { PagoRepository } from '../domain/pago.repository';
import { Pago } from '../domain/pago.entity';
import { PagoInicializado } from '../domain/events/pago-inicializado.event';
import { PagoMother } from '../../../test/mothers/pago.mother';

describe('CrearPago', () => {
  let pagoRepository: MockProxy<PagoRepository>;
  let crearPago: CrearPago;

  beforeEach(() => {
    pagoRepository = mock<PagoRepository>();
    crearPago = new CrearPago(pagoRepository);
  });

  it('guarda el pago creado y retorna el pago persistido', async () => {
    const pagoPersistido = PagoMother.draft();

    pagoRepository.save.mockResolvedValue(pagoPersistido);

    const resultado = await crearPago.execute('Compra televisor', 200000);
    const [pagoGuardado] = pagoRepository.save.mock.calls[0];

    expect(resultado).toBe(pagoPersistido);

    expect(pagoRepository.save).toHaveBeenCalledTimes(1);
    expect(pagoRepository.save).toHaveBeenCalledWith(expect.any(Pago));

    expect(pagoGuardado.getDetail()).toBe('Compra televisor');
    expect(pagoGuardado.getAmount()).toBe(200000);
  });

  it('entrega al repositorio el pago con su evento PagoInicializado', async () => {
    pagoRepository.save.mockImplementation((pago) => Promise.resolve(pago));

    await crearPago.execute('Compra televisor', 200000);
    const [pagoGuardado] = pagoRepository.save.mock.calls[0];

    const eventos = pagoGuardado.pullDomainEvents();

    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toBeInstanceOf(PagoInicializado);
  });

  it('propaga el error si falla el guardado', async () => {
    pagoRepository.save.mockRejectedValue(new Error('DB caida'));

    await expect(crearPago.execute('Compra televisor', 200000)).rejects.toThrow(
      'DB caida',
    );
  });
});
