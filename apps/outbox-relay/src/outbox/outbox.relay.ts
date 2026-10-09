import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { EVENT_PUBLISHER } from '../outbox-relay.tokens';
import type { EventPublisher } from './event-publisher';

const POLL_INTERVAL_MS = 1000;
const BATCH_SIZE = 50;

interface OutboxRow {
  id: string;
  event_type: string;
  payload: object;
}

@Injectable()
export class OutboxRelay
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(OutboxRelay.name);
  private timer?: NodeJS.Timeout;
  private current?: Promise<void>;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(EVENT_PUBLISHER) private readonly publisher: EventPublisher,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.procesar(), POLL_INTERVAL_MS);
  }

  async onApplicationShutdown(): Promise<void> {
    clearInterval(this.timer);
    await this.current;
  }

  procesar(): Promise<void> {
    if (this.current) {
      return this.current;
    }

    this.current = this.publicarPendientes().finally(() => {
      this.current = undefined;
    });

    return this.current;
  }

  private async publicarPendientes(): Promise<void> {
    try {
      await this.dataSource.transaction(async (entityManager) => {
        const pendientes: OutboxRow[] = await entityManager.query(
          `SELECT id, event_type, payload FROM outbox
           WHERE published_at IS NULL
           ORDER BY occurred_at
           LIMIT $1
           FOR UPDATE SKIP LOCKED`,
          [BATCH_SIZE],
        );

        for (const evento of pendientes) {
          const publicado = await this.publicar(evento);

          if (!publicado) {
            break;
          }

          await this.marcarPublicado(entityManager, evento.id);
        }
      });
    } catch (error) {
      this.logger.error('Error procesando el outbox', error);
    }
  }

  private async publicar(evento: OutboxRow): Promise<boolean> {
    try {
      await this.publisher.publish(
        evento.event_type,
        evento.payload,
        evento.id,
      );
      return true;
    } catch (error) {
      this.logger.error(`No se pudo publicar el evento ${evento.id}`, error);
      return false;
    }
  }

  private async marcarPublicado(
    entityManager: EntityManager,
    id: string,
  ): Promise<void> {
    await entityManager.query(
      'UPDATE outbox SET published_at = now() WHERE id = $1',
      [id],
    );
  }
}
