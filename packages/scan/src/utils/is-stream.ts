export const isStream = (obj: unknown): obj is NodeJS.ReadableStream =>
  !!obj && typeof (obj as NodeJS.ReadableStream).pipe === 'function';
