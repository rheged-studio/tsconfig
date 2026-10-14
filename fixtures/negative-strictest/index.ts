interface Options {
  label?: string;
}
export const options: Options = { label: undefined };

const counts: Record<string, number> = {};
export const total: number | undefined = counts.total;

export function sign(n: number) {
  if (n > 0) {
    return "+";
  }
}

export function after(): number {
  return 1;
  console.log("never");
}

export function labelled(): void {
  unused: for (const n of [1]) {
    console.log(n);
  }
}
