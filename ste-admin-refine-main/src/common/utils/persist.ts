export const encodeExpanded = (keys: string[]) =>
  keys.length ? keys.join("|") : "";

export const decodeExpanded = (v: string | null): string[] =>
  v
    ? v
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean)
    : [];
