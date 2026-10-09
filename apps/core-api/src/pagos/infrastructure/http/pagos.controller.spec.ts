import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';
import request from 'supertest';
import { PagoMother } from '../../../../test/mothers/pago.mother';
import { configureApp } from '../../../configure-app';
import { CrearPago } from '../../application/crear-pago.use-case';
import { ObtenerPago } from '../../application/obtener-pago.use-case';
import {
  PagoNegativeAmountError,
  PagoNotFoundError,
  TransicionInvalidaError,
} from '../../domain/errors/pago.errors';
import { PagoStatus } from '../../domain/pago-status';
import { PagosController } from './pagos.controller';

describe('PagosController', () => {
  let app: INestApplication;
  let crearPago: MockProxy<CrearPago>;
  let obtenerPago: MockProxy<ObtenerPago>;

  beforeEach(async () => {
    crearPago = mock<CrearPago>();
    obtenerPago = mock<ObtenerPago>();

    const moduleRef = await Test.createTestingModule({
      controllers: [PagosController],
      providers: [
        { provide: CrearPago, useValue: crearPago },
        { provide: ObtenerPago, useValue: obtenerPago },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(() => app.close());

  describe('POST /pagos', () => {
    it('crea el pago y responde 201 con el transaccionId y estado PENDIENTE', async () => {
      const pago = PagoMother.draft();
      crearPago.execute.mockResolvedValue(pago);

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send({ detail: 'Compra celular', amount: 100000 })
        .expect(201);

      expect(crearPago.execute).toHaveBeenCalledWith('Compra celular', 100000);
      expect(response.body).toEqual({
        transaccionId: pago.getId(),
        detail: 'Compra celular',
        amount: 100000,
        status: PagoStatus.PENDIENTE,
      });
    });

    it.each([
      ['sin detail', { amount: 100 }],
      ['detail solo con espacios', { detail: '   ', amount: 100 }],
      ['sin amount', { detail: 'Compra' }],
      ['amount como texto', { detail: 'Compra', amount: '100' }],
      ['amount negativo', { detail: 'Compra', amount: -5 }],
      ['amount en cero', { detail: 'Compra', amount: 0 }],
      ['amount con mas de 4 decimales', { detail: 'Compra', amount: 1.12345 }],
      [
        'campos no permitidos',
        { detail: 'Compra', amount: 100, status: 'PAGADO' },
      ],
    ])('responde 400 con %s', async (_caso, body) => {
      await request(app.getHttpServer()).post('/pagos').send(body).expect(400);

      expect(crearPago.execute).not.toHaveBeenCalled();
    });
  });

  describe('GET /pagos/:id', () => {
    it('responde 200 con el estado actual del pago', async () => {
      const pago = PagoMother.withStatus(PagoStatus.PAGADO);
      obtenerPago.execute.mockResolvedValue(pago);

      const response = await request(app.getHttpServer())
        .get(`/pagos/${pago.getId()}`)
        .expect(200);

      expect(obtenerPago.execute).toHaveBeenCalledWith(pago.getId());
      expect(response.body.status).toBe(PagoStatus.PAGADO);
    });

    it('responde 400 si el id no es un UUID', async () => {
      await request(app.getHttpServer()).get('/pagos/no-es-uuid').expect(400);

      expect(obtenerPago.execute).not.toHaveBeenCalled();
    });
  });

  describe('errores de dominio', () => {
    const id = '0b5c1f4e-6a2d-4c8e-9f3a-2d7b8e1c4a90';

    it('PagoNotFoundError responde 404', async () => {
      obtenerPago.execute.mockRejectedValue(new PagoNotFoundError(id));

      const response = await request(app.getHttpServer())
        .get(`/pagos/${id}`)
        .expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        error: 'PagoNotFoundError',
        message: `Pago ${id} no existe`,
      });
    });

    it('TransicionInvalidaError responde 409', async () => {
      obtenerPago.execute.mockRejectedValue(
        new TransicionInvalidaError(PagoStatus.PENDIENTE, PagoStatus.PAGADO),
      );
      await request(app.getHttpServer()).get(`/pagos/${id}`).expect(409);
    });

    it('un error de validacion del dominio responde 400', async () => {
      crearPago.execute.mockRejectedValue(new PagoNegativeAmountError());

      const response = await request(app.getHttpServer())
        .post('/pagos')
        .send({ detail: 'Compra', amount: 100 })
        .expect(400);

      expect(response.body.error).toBe('PagoNegativeAmountError');
    });

    it('un error que no es de dominio responde 500', async () => {
      obtenerPago.execute.mockRejectedValue(new Error('conexion perdida'));

      await request(app.getHttpServer()).get(`/pagos/${id}`).expect(500);
    });
  });
});
