import fastify, { FastifyReply, FastifyRequest } from 'fastify';

export class FunctionScanTarget {
  private readonly server = fastify();

  public async start<T>(
    fn: (input: T) => Promise<unknown>
  ): Promise<{ url: string }> {
    this.server.post('/', (request, reply) =>
      this.handleRequest(request, reply, fn)
    );

    const url = await this.server.listen({ port: 0, host: '127.0.0.1' });

    return { url };
  }

  public async stop(): Promise<void> {
    await this.server.close();
  }

  private async handleRequest<T>(
    request: FastifyRequest,
    reply: FastifyReply,
    fn: (input: T) => Promise<unknown>
  ) {
    try {
      const result = await fn(request.body as T);
      await reply.send(result ?? '');
    } catch (err) {
      await reply.status(500).send(err);
    }
  }
}
