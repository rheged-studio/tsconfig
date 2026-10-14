import { readFile } from "node:fs/promises";

import { greet } from "./greet.js";

export { greet };

export async function readGreeting(path: string): Promise<string> {
  const names = new Set(["a"]).union(new Set([await readFile(path, "utf8")]));
  const [first] = Iterator.from(names).take(1).toArray();
  return greet(first ?? "nobody");
}
