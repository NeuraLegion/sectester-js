export const entriesToList = (
  val: Iterable<[string, string | string[]]>
): { name: string; value: string }[] =>
  [...val]
    .map(([name, value]: [string, string | string[]]) =>
      Array.isArray(value)
        ? value.map(item => ({ name, value: item }))
        : { name, value }
    )
    .flat();
