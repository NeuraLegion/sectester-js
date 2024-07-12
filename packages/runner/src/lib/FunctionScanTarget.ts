import fastify from 'fastify';

export class FunctionScanTarget {
  private readonly server = fastify();

  public async start<T>(
    fn: (input: T) => Promise<unknown>
  ): Promise<{ url: string }> {
    this.server.post('/', async (request, reply) => {
      try {
        await reply.send((await fn(request.body as T)) ?? '');
      } catch (err) {
        await reply.status(500).send(err);
      }
    });

    const url = await this.server.listen({ port: 0, host: '127.0.0.1' });

    return { url };
  }

  public async stop(): Promise<void> {
    await this.server.close();
  }
}
