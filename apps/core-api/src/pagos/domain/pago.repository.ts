import { Pago } from './pago.entity';

export interface PagoRepository {
  findById(id: string): Promise<Pago | null>;
  save(pago: Pago): Promise<Pago>;
}
