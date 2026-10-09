import { DomainEvent } from '../../domain/events/domain-event';
import { OutboxOrmEntity } from './outbox.orm-entity';

export class OutboxMapper {
  static toPersistence(event: DomainEvent): OutboxOrmEntity {
    const outboxOrmEntity = new OutboxOrmEntity();

    outboxOrmEntity.id = event.eventId;
    outboxOrmEntity.aggregateId = event.aggregateId;
    outboxOrmEntity.eventType = event.eventType;
    outboxOrmEntity.payload = event.toPrimitives();
    outboxOrmEntity.occurredAt = event.occurredOn;

    return outboxOrmEntity;
  }
}
