export function loader(): { port: string } {
  return { port: process.env["PORT"] ?? "3000" };
}

export default function Root() {
  return <main>{import.meta.env.MODE}</main>;
}

document.title = "fixture";
