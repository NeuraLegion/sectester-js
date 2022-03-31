export class NoResponse extends Error {
  constructor(duration: number) {
    super(`No response for ${duration}seconds.`);
  }
}
