import { DomainError } from './domain.error';

export class PagoIdInvalidoError extends DomainError {
  constructor(id: string) {
    super(`El id ${id} no es un UUID v4 válido`);
  }
}

export class PagoDetailInvalidoError extends DomainError {
  constructor() {
    super('El pago debe tener un detail');
  }
}

export class PagoAmountInvalidoError extends DomainError {
  constructor() {
    super('El monto debe ser un número válido');
  }
}

export class PagoNegativeAmountError extends DomainError {
  constructor() {
    super('El monto no puede ser menor o igual a cero');
  }
}

export class PagoNotFoundError extends DomainError {
    constructor(id: string) {
        super(`Pago ${id} no existe`);
    }
}

export class TransicionInvalidaError extends DomainError {
  constructor(from: string, to: string) {
    super(`Transicion no valida desde ${from} a ${to}`);
  }
}
