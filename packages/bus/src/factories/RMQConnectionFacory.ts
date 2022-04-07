import { ConnectionFactory } from './ConnectionFactory';
import { connect, Connection } from 'amqplib';

export class RMQConnectionFacory implements ConnectionFactory<Connection> {
  public async create(
    url: string,
    options?: Record<string, unknown>
  ): Promise<Connection> {
    // TODO: fix issue with convertation Bluebird to Promise
    const connection = await connect(url, options);

    return connection;
  }
}
