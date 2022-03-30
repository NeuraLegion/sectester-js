export class NoResponse extends Error {
  constructor(ttl: number) {
    super(`Did not get response in ${ttl} seconds.`);
  }
}
