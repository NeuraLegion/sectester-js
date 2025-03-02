export const isBlobLike = (object: unknown): object is Blob =>
  (Blob && object instanceof Blob) ||
  (!!object &&
    typeof object === 'object' &&
    (typeof (object as any).stream === 'function' ||
      typeof (object as any).arrayBuffer === 'function') &&
    /^(Blob|File)$/.test((object as any)[Symbol.toStringTag]));
