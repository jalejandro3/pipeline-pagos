import { Pago } from '../../src/pagos/domain/pago.entity';
import { PagoStatus } from '../../src/pagos/domain/pago-status';

export class PagoMother {
  static draft(): Pago {
    return Pago.create('Compra celular', 100000);
  }

  static withAmount(amount: number): Pago {
    return Pago.create('Compra celular', amount);
  }

  static withStatus(status: PagoStatus): Pago {
    return Pago.fromPrimitive(
      '9f863477-3112-4d7f-aca9-6f75b904c679',
      'Compra Celular',
      100000,
      status,
    );
  }
}
