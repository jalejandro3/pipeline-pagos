import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DECIMAL_COLUMN } from './decimal-column';
import { PagoStatus } from '../../domain/pago-status';

@Entity('pagos')
export class PagoOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  detail!: string;

  @Column('decimal', {
    precision: DECIMAL_COLUMN.precision,
    scale: DECIMAL_COLUMN.scale,
  })
  amount!: string;

  @Column({
    enumName: 'pago_status',
    type: 'enum',
    enum: PagoStatus,
  })
  status!: PagoStatus;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
