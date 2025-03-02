// eslint-disable-next-line max-classes-per-file
import { isBlobLike } from './is-blob';

describe('isBlobLike', () => {
  // Create a mock Blob for testing
  class MockBlob {
    public [Symbol.toStringTag] = 'Blob';
    public arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }
  }

  // Create a mock File for testing
  class MockFile {
    public [Symbol.toStringTag] = 'File';
    public arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }
  }

  it.each([
    {
      input: new MockBlob(),
      expected: true,
      name: 'mock Blob instance'
    },
    {
      input: new MockFile(),
      expected: true,
      name: 'mock File instance'
    },
    {
      input: {
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        [Symbol.toStringTag]: 'Blob'
      },
      expected: true,
      name: 'object with arrayBuffer method and Blob tag'
    },
    {
      input: {
        stream: () => ({}),
        [Symbol.toStringTag]: 'Blob'
      },
      expected: true,
      name: 'object with stream method and Blob tag'
    },
    {
      input: new Blob(['test']),
      expected: true,
      name: 'Blob instance'
    }
  ])('should return $expected for $name', ({ input, expected }) => {
    expect(isBlobLike(input)).toBe(expected);
  });

  it.each([
    { input: null, expected: false, name: 'null' },
    { input: undefined, expected: false, name: 'undefined' },
    { input: {}, expected: false, name: 'empty object' },
    {
      input: { arrayBuffer: 'not a function' },
      expected: false,
      name: 'object with non-function arrayBuffer'
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      input: { arrayBuffer: () => {} },
      expected: false,
      name: 'object with arrayBuffer but no tag'
    },
    {
      input: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        arrayBuffer: () => {},
        [Symbol.toStringTag]: 'NotBlobOrFile'
      },
      expected: false,
      name: 'object with wrong tag'
    }
  ])('should return $expected for $name', ({ input, expected }) => {
    expect(isBlobLike(input)).toBe(expected);
  });
});
