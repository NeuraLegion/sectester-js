export type QueryParamsType =
  | URLSearchParams
  | string
  | Record<string, string | readonly string[]>
  | Iterable<[string, string]>
  | readonly [string, string][];
