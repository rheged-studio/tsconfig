interface Options {
  label?: string;
}

export function Label(options: Options) {
  return <span>{options.label ?? "none"}</span>;
}
