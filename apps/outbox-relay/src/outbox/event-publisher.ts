export interface EventPublisher {
  publish(
    routingKey: string,
    payload: object,
    messageId: string,
  ): Promise<void>;
}
