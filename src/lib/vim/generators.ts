/**
 * Boards are synthesized, never stored — a lesson you repeat five times
 * should never show you the same code twice.
 */

export type Rng = () => number;

export function makeRng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export const pick = <T>(rng: Rng, xs: readonly T[]): T =>
  xs[Math.floor(rng() * xs.length) % xs.length];

export const pickInt = (rng: Rng, lo: number, hi: number) =>
  lo + Math.floor(rng() * (hi - lo + 1));

const NOUNS = [
  "user", "order", "session", "invoice", "profile", "token", "payload",
  "record", "config", "result", "buffer", "cursor", "widget", "account",
] as const;

const TYPES = [
  "User", "Product", "Order", "Item", "Config", "Session", "Invoice", "Token",
] as const;

const WORDS = [
  "test", "another", "foo", "bar", "baz", "alpha", "beta", "gamma", "delta",
  "item", "value", "thing", "sample", "entry", "node", "leaf", "branch",
  "root", "data", "info",
] as const;

const VERBS = ["fetch", "build", "parse", "render", "resolve", "format", "load"] as const;

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export type BoardKind =
  | "prose"
  | "statements"
  | "object"
  | "array"
  | "call"
  | "quotes"
  | "paragraphs"
  | "block"
  | "long";

export function generateBoard(kind: BoardKind, rng: Rng): string[] {
  switch (kind) {
    case "prose":
      return Array.from({ length: 6 }, () =>
        Array.from({ length: pickInt(rng, 5, 8) }, () => pick(rng, WORDS)).join(" "),
      );

    case "statements":
      return Array.from({ length: pickInt(rng, 6, 8) }, () => {
        const n = pick(rng, NOUNS);
        return pick(rng, [
          `const ${n} = ${pick(rng, VERBS)}${cap(n)}(${pick(rng, WORDS)});`,
          `let ${n}Count = ${pickInt(rng, 2, 99)};`,
          `console.log("${pick(rng, WORDS)}", ${n});`,
          `return ${pick(rng, VERBS)}(${n}, ${pick(rng, WORDS)});`,
          `${n}.${pick(rng, VERBS)}(${pick(rng, WORDS)});`,
        ]);
      });

    case "object": {
      const t = pick(rng, TYPES);
      return [
        `const ${t.toLowerCase()} = {`,
        `  name: '${pick(rng, WORDS)}',`,
        `  ${pick(rng, NOUNS)}: ${pickInt(rng, 1, 99)},`,
        `  ${pick(rng, NOUNS)}: '${pick(rng, WORDS)}',`,
        `};`,
        ``,
        `function ${pick(rng, VERBS)}${t}(${pick(rng, NOUNS)}) {`,
        `  return ${pick(rng, NOUNS)}.${pick(rng, VERBS)}();`,
        `}`,
      ];
    }

    case "array":
      return [
        `const ${pick(rng, NOUNS)}s = [`,
        `  '${pick(rng, WORDS)}',`,
        `  '${pick(rng, WORDS)}',`,
        `  '${pick(rng, WORDS)}',`,
        `];`,
        ``,
        `const ${pick(rng, NOUNS)} = [${pickInt(rng, 1, 9)}, ${pickInt(rng, 1, 9)}];`,
      ];

    case "call":
      return [
        `${pick(rng, VERBS)}${cap(pick(rng, NOUNS))}(${pick(rng, WORDS)}, ${pickInt(rng, 1, 50)});`,
        `const ${pick(rng, NOUNS)} = ${pick(rng, VERBS)}(${pick(rng, WORDS)});`,
        `await ${pick(rng, VERBS)}All(${pick(rng, WORDS)}, ${pick(rng, WORDS)});`,
        `expect(${pick(rng, NOUNS)}).toEqual(${pick(rng, WORDS)});`,
        `${pick(rng, NOUNS)}.on('${pick(rng, WORDS)}', ${pick(rng, VERBS)});`,
      ];

    case "quotes":
      return [
        `const title = "${pick(rng, WORDS)} ${pick(rng, WORDS)}";`,
        `const slug = '${pick(rng, WORDS)}-${pick(rng, WORDS)}';`,
        `log("${pick(rng, WORDS)}", "${pick(rng, WORDS)}");`,
        `const path = '/api/${pick(rng, NOUNS)}s';`,
        `throw new Error("${pick(rng, WORDS)} failed");`,
      ];

    case "paragraphs":
      return [
        `function ${pick(rng, VERBS)}${cap(pick(rng, NOUNS))}() {`,
        `  const ${pick(rng, NOUNS)} = ${pickInt(rng, 1, 20)};`,
        `  return ${pick(rng, NOUNS)};`,
        `}`,
        ``,
        `function ${pick(rng, VERBS)}${cap(pick(rng, NOUNS))}() {`,
        `  const ${pick(rng, NOUNS)} = '${pick(rng, WORDS)}';`,
        `  return ${pick(rng, NOUNS)}.trim();`,
        `}`,
        ``,
        `export default {`,
        `  ${pick(rng, NOUNS)},`,
        `  ${pick(rng, NOUNS)},`,
        `};`,
      ];

    case "block":
      return [
        `if (${pick(rng, NOUNS)}.${pick(rng, WORDS)}) {`,
        `  ${pick(rng, VERBS)}(${pick(rng, WORDS)});`,
        `  ${pick(rng, VERBS)}(${pick(rng, WORDS)}, ${pickInt(rng, 1, 9)});`,
        `} else {`,
        `  throw new Error('${pick(rng, WORDS)}');`,
        `}`,
      ];

    case "long":
      return Array.from({ length: 34 }, (_, i) =>
        i % 6 === 5
          ? ``
          : `${pick(rng, VERBS)}${cap(pick(rng, NOUNS))}(${pick(rng, WORDS)}); // line ${i + 1}`,
      );
  }
}

/** Chew characters out of the source — the Bug Squasher board. */
export function infest(
  lines: string[],
  rng: Rng,
  bites: number,
): { lines: string[]; original: string[] } {
  const out = [...lines];
  let made = 0;
  let guard = 0;
  while (made < bites && guard++ < 300) {
    const y = pickInt(rng, 0, out.length - 1);
    const line = out[y];
    const candidates: number[] = [];
    for (let i = 0; i < line.length; i++) if (/[A-Za-z]/.test(line[i])) candidates.push(i);
    if (!candidates.length) continue;
    const x = pick(rng, candidates);
    out[y] = line.slice(0, x) + line.slice(x + 1);
    made++;
  }
  return { lines: out, original: lines };
}
