/* Walk every lesson: can it build boards and goals, and does it only ever
   ask for keys it has already taught? */
import { ALL_LESSONS, allowedKeysFor } from "../src/lib/curriculum/lessons";
import { buildGoal } from "../src/lib/vim/goals";
import { generateBoard, infest, makeRng, pick } from "../src/lib/vim/generators";
import { createState } from "../src/lib/vim/reducer";

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
    let original: string[] | undefined;
    if (lesson.drill.tasks.some((t) => t.type === "bugFix")) {
      original = lines;
      lines = infest(lines, rng, 10).lines;
    }
    while (lesson.drill.minimumLines && lines.length < lesson.drill.minimumLines) {
      lines = [...lines, ...generateBoard(kind, rng)];
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
    for (const k of goal.solution) {
      if (k.length === 1 && /[a-zA-Z0-9]/.test(k) === false) continue; // literal text
      if (!allowedSet.has(k) && !/^\d+$/.test(k)) missing.add(k);
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
