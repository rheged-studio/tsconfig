export function loader(env: Env): { greeting: string } {
  return { greeting: env.GREETING };
}

export default function Root() {
  return <main>{import.meta.env.MODE}</main>;
}

document.title = "fixture";
