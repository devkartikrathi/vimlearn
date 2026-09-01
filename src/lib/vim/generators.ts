import type { Position } from "./types";

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

/** How many characters the bugs eat out of a Bug Squasher board. */
export const BUG_COUNT = 6;

export interface Bite {
  /** where the eaten character used to be, in the *original* buffer */
  at: Position;
  char: string;
}

/**
 * Chew characters out of the source — the Bug Squasher board. Bites are kept
 * apart so every gap reads as its own bug, and the eaten characters come back
 * with the board so each repair can be set and scored as its own goal.
 */
export function infest(
  lines: string[],
  rng: Rng,
  bites: number,
): { lines: string[]; original: string[]; bites: Bite[] } {
  const pool: Bite[] = [];
  lines.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      if (/[A-Za-z]/.test(line[x])) pool.push({ at: { x, y }, char: line[x] });
    }
  });

  const chosen: Bite[] = [];
  let guard = 0;
  while (chosen.length < bites && pool.length && guard++ < 500) {
    const bite = pick(rng, pool);
    // neighbouring bites read as one bug, and repairing the left one would
    // shift the right one out from under its highlight
    const crowded = chosen.some(
      (b) => b.at.y === bite.at.y && Math.abs(b.at.x - bite.at.x) < 3,
    );
    if (!crowded) chosen.push(bite);
  }

  // eat right-to-left so the bites we have already chosen keep their columns
  const out = [...lines];
  [...chosen]
    .sort((a, b) => (a.at.y === b.at.y ? b.at.x - a.at.x : b.at.y - a.at.y))
    .forEach(({ at }) => {
      out[at.y] = out[at.y].slice(0, at.x) + out[at.y].slice(at.x + 1);
    });

  return { lines: out, original: lines, bites: chosen };
}
