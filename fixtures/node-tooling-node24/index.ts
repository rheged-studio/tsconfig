// Node 24 has the ES2025 APIs that node22 rejects.
export const tried: Promise<number> = Promise.try(() => 1);
export const escaped: string = RegExp.escape("a.b");

export function label(value: string | undefined): string {
  if (value === undefined) {
    return "none";
  }

  return value;
}
