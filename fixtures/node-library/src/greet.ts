// The regex `v` flag needs target es2024 (node22's target).
const letters = /^[\p{L}--[\d]]+$/v;

export function greet(name: string): string {
  return letters.test(name) ? `Hello, ${name}` : "Hello";
}
