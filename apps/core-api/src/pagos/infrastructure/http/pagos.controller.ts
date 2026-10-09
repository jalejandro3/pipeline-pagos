import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CrearPago } from '../../application/crear-pago.use-case';
import { ObtenerPago } from '../../application/obtener-pago.use-case';
import { CrearPagoDto } from './crear-pago.dto';
import { PagoResponse } from './pago.response';

@Controller('pagos')
export class PagosController {
  constructor(
    private readonly crearPago: CrearPago,
    private readonly obtenerPago: ObtenerPago,
  ) {}

  @Post()
  async crear(@Body() dto: CrearPagoDto): Promise<PagoResponse> {
    const pago = await this.crearPago.execute(dto.detail, dto.amount);

    return PagoResponse.from(pago);
  }

  @Get(':id')
  async obtener(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<PagoResponse> {
    const pago = await this.obtenerPago.execute(id);

    return PagoResponse.from(pago);
  }
}
