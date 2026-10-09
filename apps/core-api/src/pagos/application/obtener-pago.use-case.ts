import { PagoNotFoundError } from '../domain/errors/pago.errors';
import { Pago } from '../domain/pago.entity';
import { PagoRepository } from '../domain/pago.repository';

export class ObtenerPago {
  constructor(private readonly pagoRepository: PagoRepository) {}

  async execute(id: string): Promise<Pago> {
    const pago = await this.pagoRepository.findById(id);

    if (pago == null) {
      throw new PagoNotFoundError(id);
    }

    return pago;
  }
}
