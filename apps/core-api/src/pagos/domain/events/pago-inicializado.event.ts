import { randomUUID } from 'node:crypto';
import { DomainEvent } from './domain-event';
import { PagoStatus } from '../pago-status';

export class PagoInicializado implements DomainEvent {
  readonly eventId = randomUUID();
  readonly eventType = 'payment.initiated';
  readonly occurredOn = new Date();

  constructor(
    readonly aggregateId: string,
    private readonly detail: string,
    private readonly amount: number,
    private readonly status: PagoStatus,
  ) {}

  toPrimitives(): Record<string, unknown> {
    return {
      id: this.aggregateId,
      detail: this.detail,
      amount: this.amount,
      status: this.status,
    };
  }
}
