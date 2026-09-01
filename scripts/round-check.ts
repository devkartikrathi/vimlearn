/* solution-check proves the first goal of a lesson is solvable. This proves the
   whole set is: it plays every goal's advertised keystrokes end to end, exactly
   as the runner does, and fails if a lesson ever stops handing out goals. */
import { ALL_LESSONS, allowedKeysFor } from "../src/lib/curriculum/lessons";
import { buildGoal, judge } from "../src/lib/vim/goals";
import { BUG_COUNT, generateBoard, infest, makeRng, pick } from "../src/lib/vim/generators";
import { applyKey, createState, settle } from "../src/lib/vim/reducer";
import type { GameConfig, Goal, VimState } from "../src/lib/vim/types";
import type { DrillConfig } from "../src/lib/curriculum/types";

const SETS = 6;
const rng = makeRng(90210);
let broken = 0;
const rows: string[] = [];

interface Round {
  vim: VimState;
  goal: Goal | null;
  original?: string[];
}

/** The runner's board builder, kept in step with lesson-runner.tsx. */
function buildRound(drill: DrillConfig, allowed: string[]): Round {
  for (let attempt = 0; attempt < 40; attempt++) {
    const kind = pick(rng, drill.boards);
    let lines = generateBoard(kind, rng);
    while (drill.minimumLines && lines.length < drill.minimumLines) {
      lines = [...lines, ...generateBoard(kind, rng)];
    }
    let original: string[] | undefined;
    if (drill.tasks.some((t) => t.type === "bugFix")) {
      const infested = infest(lines, rng, BUG_COUNT);
      original = infested.original;
      lines = infested.lines;
    }
    const vim = createState(lines);
    const goal = buildGoal({
      task: pick(rng, drill.tasks),
      lines,
      cursor: vim.cursor,
      rng,
      allowed,
      original,
    });
    if (goal) return { vim, goal, original };
  }
  return { vim: createState(generateBoard(drill.boards[0], rng)), goal: null };
}

function nextRound(drill: DrillConfig, allowed: string[], round: Round): Round {
  const vim = settle(round.vim);
  for (let attempt = 0; attempt < 40; attempt++) {
    const goal = buildGoal({
      task: pick(rng, drill.tasks),
      lines: vim.lines,
      cursor: vim.cursor,
      rng,
      allowed,
      original: round.original,
    });
    if (goal) return { vim, goal, original: round.original };
  }
  return buildRound(drill, allowed);
}

for (const lesson of ALL_LESSONS) {
  const drill = lesson.drill;
  if (!drill) {
    rows.push(`  --    ${lesson.slug.padEnd(28)} no drill`);
    continue;
  }
  const allowed = allowedKeysFor(lesson.slug);
  const config: GameConfig = {
    allowed,
    goalsToComplete: drill.goals,
    motionsOnly: drill.motionsOnly,
    readonly: drill.readonly,
    minimumLines: drill.minimumLines,
  };

  let sets = 0;
  const failures: string[] = [];

  for (let set = 0; set < SETS; set++) {
    let round = buildRound(drill, allowed);
    let solved = 0;
    for (let g = 0; g < drill.goals; g++) {
      if (!round.goal) {
        failures.push(`set ${set + 1} ran out of goals after ${solved}/${drill.goals}`);
        break;
      }
      let s = round.vim;
      for (const k of round.goal.solution) s = applyKey(s, k, config);
      if (judge(round.goal, s) !== "completed") {
        failures.push(
          `set ${set + 1} goal ${g + 1}: [${round.goal.solution.join(" ")}] left ` +
            `${judge(round.goal, s)} — "${round.goal.instruction}"`,
        );
        break;
      }
      solved++;
      round = nextRound(drill, allowed, { ...round, vim: s });
    }
    if (solved === drill.goals) sets++;
  }

  const ok = sets === SETS;
  if (!ok) broken++;
  rows.push(
    `  ${ok ? "ok  " : "FAIL"}  ${lesson.slug.padEnd(28)} ${sets}/${SETS} full sets` +
      (failures.length ? `\n         ${failures.slice(0, 2).join("\n         ")}` : ""),
  );
}

console.log("\n" + rows.join("\n"));
console.log(
  broken
    ? `\n${broken} lesson(s) cannot be played to the end\n`
    : "\nEvery lesson plays through to the last goal\n",
);
process.exit(broken ? 1 : 0);
