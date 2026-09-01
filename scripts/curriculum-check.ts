/* Walk every lesson: can it build boards and goals, and does it only ever
   ask for keys it has already taught? */
import { ALL_LESSONS, allowedKeysFor } from "../src/lib/curriculum/lessons";
import { buildGoal } from "../src/lib/vim/goals";
import { BUG_COUNT, generateBoard, infest, makeRng, pick } from "../src/lib/vim/generators";
import { applyKey, createState } from "../src/lib/vim/reducer";
import type { GameConfig } from "../src/lib/vim/types";

const rng = makeRng(20260901);
let problems = 0;
const rows: string[] = [];

for (const lesson of ALL_LESSONS) {
  if (!lesson.drill) {
    rows.push(`  ok    ${lesson.slug.padEnd(28)} concept`);
    continue;
  }
  const allowed = allowedKeysFor(lesson.slug);
  const allowedSet = new Set(allowed);
  // The runner retries with a fresh board until a goal lands, so the invariant
  // that matters is "a round always starts", not "every single draw succeeds".
  let rounds = 0;
  const missing = new Set<string>();

  for (let round = 0; round < 40; round++) {
   let built = 0;
   for (let i = 0; i < 40 && !built; i++) {
    const kind = pick(rng, lesson.drill.boards);
    let lines = generateBoard(kind, rng);
    while (lesson.drill.minimumLines && lines.length < lesson.drill.minimumLines) {
      lines = [...lines, ...generateBoard(kind, rng)];
    }
    let original: string[] | undefined;
    if (lesson.drill.tasks.some((t) => t.type === "bugFix")) {
      const infested = infest(lines, rng, BUG_COUNT);
      original = infested.original;
      lines = infested.lines;
    }
    const vim = createState(lines);
    const goal = buildGoal({
      task: pick(rng, lesson.drill.tasks),
      lines,
      cursor: vim.cursor,
      rng,
      allowed,
      original,
    });
    if (!goal) continue;
    built++;
    // Replay through the emulator: a letter typed into insert mode, or handed to
    // f as its argument, is text — only keys the gate actually sees are commands.
    const config: GameConfig = {
      allowed,
      goalsToComplete: lesson.drill.goals,
      motionsOnly: lesson.drill.motionsOnly,
      readonly: lesson.drill.readonly,
      disableCallouts: true,
    };
    let s = vim;
    for (const k of goal.solution) {
      const gated =
        s.mode !== "insert" &&
        !s.searchInput &&
        !s.pending.awaitingChar &&
        !s.pending.awaitingG &&
        !s.pending.textObject;
      if (gated && !allowedSet.has(k) && !/^[0-9]$/.test(k)) missing.add(k);
      s = applyKey(s, k, config);
    }
   }
   rounds += built;
  }

  const rate = Math.round((rounds / 40) * 100);
  const ok = rate === 100;
  if (!ok) problems++;
  rows.push(
    `  ${ok ? "ok  " : "SLOW"}  ${lesson.slug.padEnd(28)} ${String(rate).padStart(3)}% rounds start` +
      (missing.size ? `   note: solution uses ${[...missing].join(" ")}` : ""),
  );
}

console.log(`\n${ALL_LESSONS.length} lessons\n`);
console.log(rows.join("\n"));
console.log(problems ? `\n${problems} lesson(s) can fail to start a round\n` : "\nEvery lesson starts a round every time\n");
process.exit(problems ? 1 : 0);
