export function safely(fn: () => number): Promise<number> {
  return Promise.try(fn);
}

export function isError(value: unknown): boolean {
  return Error.isError(value);
}

export function escape(text: string): string {
  return RegExp.escape(text);
}
