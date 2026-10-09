import { randomUUID } from 'node:crypto';
import { PagoStatus } from './pago-status';
import { DomainEvent } from './events/domain-event';
import { PagoInicializado } from './events/pago-inicializado.event';

const ALLOWED_TRANSITIONS: Readonly<Record<PagoStatus, PagoStatus[]>> = {
  [PagoStatus.PENDIENTE]: [PagoStatus.EN_PROCESO_PAGO, PagoStatus.FALLIDO],
  [PagoStatus.EN_PROCESO_PAGO]: [PagoStatus.PAGADO, PagoStatus.FALLIDO],
  [PagoStatus.PAGADO]: [PagoStatus.FACTURADO, PagoStatus.FALLIDO],
  [PagoStatus.FACTURADO]: [PagoStatus.FINALIZADO, PagoStatus.FALLIDO],
  [PagoStatus.FINALIZADO]: [],
  [PagoStatus.FALLIDO]: [],
};

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class Pago {
  private status: PagoStatus;
  private domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly id: string,
    private readonly detail: string,
    private readonly amount: number,
    status: PagoStatus,
  ) {
    this.validarId(id);
    this.validarDetail(detail);
    this.validarAmount(amount);

    this.status = status;
  }

  static create(detail: string, amount: number) {
    const pago = new Pago(randomUUID(), detail, amount, PagoStatus.PENDIENTE);

    pago.record(
      new PagoInicializado(pago.id, pago.detail, pago.amount, pago.status),
    );

    return pago;
  }

  static fromPrimitive(
    id: string,
    detail: string,
    amount: number,
    status: PagoStatus,
  ) {
    return new Pago(id, detail, amount, status);
  }

  getId(): string {
    return this.id;
  }

  getDetail(): string {
    return this.detail;
  }

  getAmount(): number {
    return this.amount;
  }

  getStatus(): PagoStatus {
    return this.status;
  }

  pullDomainEvents(): DomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];

    return events;
  }

  procesar(): void {
    this.transicionarA(PagoStatus.EN_PROCESO_PAGO);
  }

  pagar(): void {
    this.transicionarA(PagoStatus.PAGADO);
  }

  facturar(): void {
    this.transicionarA(PagoStatus.FACTURADO);
  }

  finalizar(): void {
    this.transicionarA(PagoStatus.FINALIZADO);
  }

  fallo(): void {
    this.transicionarA(PagoStatus.FALLIDO);
  }

  private record(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  private validarId(id: string): void {
    if (!UUID_V4_REGEX.test(id)) {
      throw new Error('UUID v4 inválido');
    }
  }

  private validarDetail(detail: string) {
    if (detail.trim().length === 0) {
      throw new Error('El pago debe tener un detail');
    }
  }

  private validarAmount(amount: number): void {
    if (!Number.isFinite(amount)) {
      throw new Error('El monto debe ser un número válido');
    }

    if (amount <= 0) {
      throw new Error('El monto no puede ser menor o igual a cero');
    }
  }

  private transicionarA(next: PagoStatus): void {
    if (!ALLOWED_TRANSITIONS[this.status].includes(next)) {
      throw new Error(`Transicion no valida desde ${this.status} a ${next}`);
    }

    this.status = next;
  }
}
