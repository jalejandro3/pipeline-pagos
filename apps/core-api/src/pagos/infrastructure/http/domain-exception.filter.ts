import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../domain/errors/domain.error';
import {
  PagoNotFoundError,
  TransicionInvalidaError,
} from '../../domain/errors/pago.errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = this.statusFor(error);

    response.status(statusCode).json({
      statusCode,
      error: error.name,
      message: error.message,
    });
  }

  private statusFor(error: DomainError): HttpStatus {
    if (error instanceof PagoNotFoundError) {
      return HttpStatus.NOT_FOUND;
    }

    if (error instanceof TransicionInvalidaError) {
      return HttpStatus.CONFLICT;
    }

    return HttpStatus.BAD_REQUEST;
  }
}
