export class IntegrationEventHandlerNotFound extends Error {
  constructor(...eventNames: string[]) {
    super(
      `For events ${eventNames.join(', ')} was not registered any handlers.`
    );
  }
}
