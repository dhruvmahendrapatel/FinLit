let counter = 0;
let generator: ((prefix: string) => string) | null = null;

/** Generate a short, URL-safe id. Deterministic generators can be injected for tests. */
export function newId(prefix: string): string {
  if (generator) return generator(prefix);
  counter = (counter + 1) % 1_000_000;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${time}${rand}${counter.toString(36)}`;
}

/** Inject a deterministic id generator (tests) or reset with `null`. */
export function setIdGenerator(fn: ((prefix: string) => string) | null): void {
  generator = fn;
}
