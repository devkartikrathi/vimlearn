/* The strongest check there is: for every lesson, replay the keystrokes we
   advertise as optimal and confirm the goal actually completes. */
import { ALL_LESSONS, allowedKeysFor } from "../src/lib/curriculum/lessons";
import { buildGoal, judge } from "../src/lib/vim/goals";
import { BUG_COUNT, generateBoard, infest, makeRng, pick } from "../src/lib/vim/generators";
import { applyKey, createState } from "../src/lib/vim/reducer";
import type { GameConfig } from "../src/lib/vim/types";

const rng = makeRng(31415);
const ROUNDS = 25;
let broken = 0;
const rows: string[] = [];

for (const lesson of ALL_LESSONS) {
  if (!lesson.drill) {
    rows.push(`  --    ${lesson.slug.padEnd(28)} no scored solution`);
    continue;
  }
  const allowed = allowedKeysFor(lesson.slug);
  const config: GameConfig = {
    allowed,
    goalsToComplete: lesson.drill.goals,
    motionsOnly: lesson.drill.motionsOnly,
    minimumLines: lesson.drill.minimumLines,
  };

  let tried = 0;
  let solved = 0;
  const failures: string[] = [];

  for (let round = 0; round < ROUNDS; round++) {
    let goal = null;
    let vim = createState([""]);
    for (let i = 0; i < 40 && !goal; i++) {
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
      vim = createState(lines);
      goal = buildGoal({
        task: pick(rng, lesson.drill.tasks),
        lines,
        cursor: vim.cursor,
        rng,
        allowed,
        original,
      });
    }
    if (!goal) continue;
    tried++;

    let s = vim;
    for (const k of goal.solution) s = applyKey(s, k, config);
    if (judge(goal, s) === "completed") solved++;
    else if (failures.length < 2) {
      failures.push(
        `${goal.kind} solution [${goal.solution.join(" ")}] left ${judge(goal, s)}`,
      );
    }
  }

  const rate = tried ? Math.round((solved / tried) * 100) : 0;
  const ok = rate === 100;
  if (!ok) broken++;
  rows.push(
    `  ${ok ? "ok  " : "FAIL"}  ${lesson.slug.padEnd(28)} ${String(rate).padStart(3)}% solved` +
      (failures.length ? `\n         ${failures.join("\n         ")}` : ""),
  );
}

console.log("\n" + rows.join("\n"));
console.log(
  broken
    ? `\n${broken} lesson(s) advertise keystrokes that do not solve the goal\n`
    : "\nEvery advertised solution solves its goal\n",
);
process.exit(broken ? 1 : 0);
