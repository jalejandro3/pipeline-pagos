import { PagoStatus } from '../../domain/pago-status';
import { Pago } from '../../domain/pago.entity';

export class PagoResponse {
  private constructor(
    readonly transaccionId: string,
    readonly detail: string,
    readonly amount: number,
    readonly status: PagoStatus,
  ) {}

  static from(pago: Pago): PagoResponse {
    return new PagoResponse(
      pago.getId(),
      pago.getDetail(),
      pago.getAmount(),
      pago.getStatus(),
    );
  }
}
