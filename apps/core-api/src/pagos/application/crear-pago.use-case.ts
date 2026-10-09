import { Pago } from '../domain/pago.entity';
import { PagoRepository } from '../domain/pago.repository';

export class CrearPago {
  constructor(private readonly pagoRepository: PagoRepository) {}

  async execute(detail: string, amount: number): Promise<Pago> {
    const nuevoPago = Pago.create(detail, amount);

    return this.pagoRepository.save(nuevoPago);
  }
}
