import "./missing-side-effect.ts";

const list: string[] = [];
export const first: string = list[0];

class Animal {
  speak(): string {
    return "...";
  }
}

export class Dog extends Animal {
  speak(): string {
    return "woof";
  }
}

export function describe(n: number): string {
  let label = "";
  switch (n) {
    case 1:
      label = "one";
    case 2:
      label = "two";
      break;
  }
  return label;
}
