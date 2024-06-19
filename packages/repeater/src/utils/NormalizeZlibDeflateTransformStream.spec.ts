import { NormalizeZlibDeflateTransformStream } from './NormalizeZlibDeflateTransformStream';
import { promisify } from 'node:util';
import { constants, createInflate, deflate, deflateRaw } from 'node:zlib';
import { Readable } from 'node:stream';

const zOpts = {
  flush: constants.Z_SYNC_FLUSH,
  finishFlush: constants.Z_SYNC_FLUSH
};

describe('NormalizeZlibDeflateTransformStream', () => {
  describe('pipe', () => {
    it('should add zlib headers to raw deflate', async () => {
      // arrange
      const data = 'xyz'.repeat(200);

      const stream = Readable.from(await promisify(deflateRaw)(data, zOpts));
      // act
      const inflated = stream
        .pipe(new NormalizeZlibDeflateTransformStream())
        .pipe(createInflate(zOpts));
      // assert
      const result = [];
      for await (const chunk of inflated) {
        result.push(chunk);
      }
      expect(result.join('')).toBe(data);
    });

    it('should not affect deflate with zlib headers', async () => {
      // arrange
      const data = 'xyz'.repeat(200);

      const stream = Readable.from(await promisify(deflate)(data, zOpts));
      // act
      const inflated = stream
        .pipe(new NormalizeZlibDeflateTransformStream())
        .pipe(createInflate(zOpts));
      // assert
      const result = [];
      for await (const chunk of inflated) {
        result.push(chunk);
      }
      expect(result.join('')).toBe(data);
    });
  });
});
