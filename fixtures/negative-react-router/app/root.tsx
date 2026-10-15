// The react-router layer adds no Node globals: a timer is the DOM's number.
export const timer: number = setTimeout(() => undefined, 0);

export function loader(): { port: string | undefined } {
  return { port: process.env["PORT"] };
}

export default function Root() {
  return <main>{import.meta.env.MODE}</main>;
}
