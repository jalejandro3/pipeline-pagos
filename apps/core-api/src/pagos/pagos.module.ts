import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrearPago } from './application/crear-pago.use-case';
import { ObtenerPago } from './application/obtener-pago.use-case';
import { PagoRepository } from './domain/pago.repository';
import { RabbitMQModule } from './infrastructure/events/rabbitmq.module';
import { PagosController } from './infrastructure/http/pagos.controller';
import { OutboxOrmEntity } from './infrastructure/outbox/outbox.orm-entity';
import { PagoOrmEntity } from './infrastructure/persistence/pago.orm-entity';
import { PagoPDO } from './infrastructure/persistence/pago.pdo';
import { PAGO_REPOSITORY } from './pagos.tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([PagoOrmEntity, OutboxOrmEntity]),
    RabbitMQModule,
  ],
  controllers: [PagosController],
  providers: [
    { provide: PAGO_REPOSITORY, useClass: PagoPDO },
    {
      provide: CrearPago,
      inject: [PAGO_REPOSITORY],
      useFactory: (repository: PagoRepository) => new CrearPago(repository),
    },
    {
      provide: ObtenerPago,
      inject: [PAGO_REPOSITORY],
      useFactory: (repository: PagoRepository) => new ObtenerPago(repository),
    },
  ],
  exports: [CrearPago, ObtenerPago],
})
export class PagosModule {}
