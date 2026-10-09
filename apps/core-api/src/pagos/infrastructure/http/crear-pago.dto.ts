import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { DECIMAL_COLUMN } from '../persistence/decimal-column';

export class CrearPagoDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  detail!: string;

  @IsNumber({ maxDecimalPlaces: DECIMAL_COLUMN.scale })
  @IsPositive()
  amount!: number;
}
