/* A quick harness: drive the reducer with keystrokes and assert on the buffer. */
import { applyKey, createState } from "../src/lib/vim/reducer";
import { buildGoal, judge, type TaskSpec } from "../src/lib/vim/goals";
import { generateBoard, makeRng } from "../src/lib/vim/generators";
import type { GameConfig, VimState } from "../src/lib/vim/types";

const ALL: GameConfig = {
  allowed: [
    "h","j","k","l","w","e","b","W","E","B","0","_","$","f","F","t","T",";","g","G",
    "{","}","/","?","n","N","*","#","d","c","y","p","P","x","s","r","i","a","I","A",
    "o","O","D","v","V","u","{n}","<C-u>","<C-d>",'"',"'","(",")","[","]",
  ],
  goalsToComplete: 10,
};

let pass = 0;
let fail = 0;

function run(lines: string[], keys: string[]): VimState {
  let s = createState(lines);
  for (const k of keys) s = applyKey(s, k, ALL);
  return s;
}

function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) {
    pass++;
  } else {
    fail++;
    console.log(`  FAIL ${name}\n       got      ${a}\n       expected ${b}`);
  }
}

console.log("\nmotions");
eq("l moves right", run(["const x = 1;"], ["l", "l"]).cursor, { x: 2, y: 0 });
eq("h clamps at 0", run(["const x = 1;"], ["h"]).cursor, { x: 0, y: 0 });
eq("w to next word", run(["const x = 1;"], ["w"]).cursor, { x: 6, y: 0 });
eq("w over punctuation", run(["user.profile"], ["w"]).cursor, { x: 4, y: 0 });
eq("W skips punctuation", run(["user.profile name"], ["W"]).cursor, { x: 13, y: 0 });
eq("e to word end", run(["const x = 1;"], ["e"]).cursor, { x: 4, y: 0 });
eq("b back a word", run(["const x = 1;"], ["w", "w", "b"]).cursor, { x: 6, y: 0 });
eq("$ to line end", run(["const x = 1;"], ["$"]).cursor, { x: 11, y: 0 });
eq("0 to column zero", run(["  indented"], ["$", "0"]).cursor, { x: 0, y: 0 });
eq("_ to first non-blank", run(["  indented"], ["$", "_"]).cursor, { x: 2, y: 0 });
eq("j keeps sticky column", run(["aaaaaa", "bb", "cccccc"], ["$", "j", "j"]).cursor, { x: 5, y: 2 });
eq("G to last line", run(["a", "b", "c"], ["G"]).cursor, { x: 0, y: 2 });
eq("gg to first line", run(["a", "b", "c"], ["G", "g", "g"]).cursor, { x: 0, y: 0 });
eq("count with j", run(["a", "b", "c", "d"], ["3", "j"]).cursor, { x: 0, y: 3 });
eq("f finds char", run(["const x = 1;"], ["f", "="]).cursor, { x: 8, y: 0 });
eq("t stops short", run(["const x = 1;"], ["t", "="]).cursor, { x: 7, y: 0 });
eq("; repeats find", run(["a.b.c.d"], ["f", ".", ";"]).cursor, { x: 3, y: 0 });
eq("} to blank line", run(["a", "b", "", "c"], ["}"]).cursor, { x: 0, y: 2 });

console.log("\nsearch");
eq(
  "/ jumps to match",
  run(["alpha", "beta", "gamma"], ["/", "g", "a", "m", "<CR>"]).cursor,
  { x: 0, y: 2 },
);
eq(
  "n repeats search",
  run(["foo", "bar", "foo"], ["/", "f", "o", "o", "<CR>", "n"]).cursor,
  { x: 0, y: 0 },
);
eq("* searches word under cursor", run(["total", "x", "total"], ["*"]).cursor, { x: 0, y: 2 });

console.log("\noperators");
eq("dw deletes a word", run(["const x = 1;"], ["d", "w"]).lines, ["x = 1;"]);
eq("dW deletes a WORD", run(["a.b.c rest"], ["d", "W"]).lines, ["rest"]);
eq("dd deletes a line", run(["a", "b", "c"], ["j", "d", "d"]).lines, ["a", "c"]);
eq("2dd deletes two lines", run(["a", "b", "c"], ["2", "d", "d"]).lines, ["c"]);
eq("dj deletes two lines", run(["a", "b", "c"], ["d", "j"]).lines, ["c"]);
eq("D deletes to line end", run(["const x = 1;"], ["w", "D"]).lines, ["const "]);
eq("x deletes a char", run(["abc"], ["x"]).lines, ["bc"]);
eq("cw enters insert at word end", run(["const x = 1;"], ["c", "w"]).lines, [" x = 1;"]);
eq("cw then type", run(["const x = 1;"], ["c", "w", "l", "e", "t", "<Esc>"]).lines, ["let x = 1;"]);
eq("yy then p duplicates", run(["a", "b"], ["y", "y", "p"]).lines, ["a", "a", "b"]);
eq("u undoes a delete", run(["a", "b"], ["d", "d", "u"]).lines, ["a", "b"]);

console.log("\ninsert mode");
eq("i inserts before", run(["bc"], ["i", "a", "<Esc>"]).lines, ["abc"]);
eq("a inserts after", run(["ac"], ["a", "b", "<Esc>"]).lines, ["abc"]);
eq("A appends at end", run(["ab"], ["A", "c", "<Esc>"]).lines, ["abc"]);
eq("I inserts at first non-blank", run(["  bc"], ["I", "a", "<Esc>"]).lines, ["  abc"]);
eq("o opens below", run(["a"], ["o", "b", "<Esc>"]).lines, ["a", "b"]);
eq("O opens above", run(["b"], ["O", "a", "<Esc>"]).lines, ["a", "b"]);
eq("o keeps indent", run(["  a"], ["o", "b", "<Esc>"]).lines, ["  a", "  b"]);
eq("r replaces one char", run(["cat"], ["r", "b"]).lines, ["bat"]);
eq("s substitutes", run(["cat"], ["s", "b", "<Esc>"]).lines, ["bat"]);
eq("Esc steps cursor back", run(["ab"], ["A", "c", "<Esc>"]).cursor, { x: 2, y: 0 });

console.log("\ntext objects");
eq("di( empties parens", run(["fn(a, b);"], ["f", "a", "d", "i", "("]).lines, ["fn();"]);
eq("da( removes parens", run(["fn(a, b);"], ["f", "a", "d", "a", "("]).lines, ["fn;"]);
eq('di" empties string', run(['x = "hello";'], ["f", "h", "d", "i", '"']).lines, ['x = "";']);
eq('da" removes quotes', run(['x = "hello";'], ["f", "h", "d", "a", '"']).lines, ["x = ;"]);
eq("diw from mid-word", run(["const total = 1;"], ["w", "l", "l", "d", "i", "w"]).lines, ["const  = 1;"]);
eq("daw takes the space", run(["const total = 1;"], ["w", "l", "d", "a", "w"]).lines, ["const = 1;"]);
eq(
  "di{ across lines",
  run(["obj = {", "  a: 1,", "};"], ["j", "d", "i", "{"]).lines,
  ["obj = {", "};"],
);
eq(
  "dip removes a block",
  run(["a", "b", "", "c"], ["d", "i", "p"]).lines,
  ["", "c"],
);
eq(
  "ci( then type",
  run(["fn(old);"], ["f", "o", "c", "i", "(", "n", "e", "w", "<Esc>"]).lines,
  ["fn(new);"],
);

console.log("\nvisual mode");
{
  const s = run(["const x = 1;"], ["v", "e"]);
  eq("v then e selects a word", s.mode, "visual");
  eq("vd deletes the selection", run(["const x = 1;"], ["v", "e", "d"]).lines, [" x = 1;"]);
  eq("V d deletes the line", run(["a", "b"], ["V", "d"]).lines, ["b"]);
  eq("Vj d deletes two lines", run(["a", "b", "c"], ["V", "j", "d"]).lines, ["c"]);
  eq("o swaps selection ends", run(["abcdef"], ["l", "l", "v", "l", "o"]).cursor, { x: 2, y: 0 });
}

console.log("\ncommand gating");
{
  const locked: GameConfig = { allowed: ["h", "j", "k", "l"], goalsToComplete: 1 };
  let s = createState(["const x = 1;"]);
  s = applyKey(s, "d", locked);
  eq("refuses an untaught key", s.callout?.text, 'You haven\'t learned "d" yet');
  eq("buffer untouched after refusal", s.lines, ["const x = 1;"]);

  const motions: GameConfig = { allowed: ["h", "j", "k", "l", "x"], goalsToComplete: 1, motionsOnly: true };
  let m = createState(["abc"]);
  m = applyKey(m, "x", motions);
  eq("motionsOnly blocks editing", m.lines, ["abc"]);
}

console.log("\ngoal generation and judging");
{
  const rng = makeRng(7);
  const tasks: TaskSpec[] = [
    { type: "move", via: ["w"], reps: [1, 2] },
    { type: "operate", op: "d", target: { kind: "word" } },
    { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "(" } },
    { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: '"' } },
    { type: "operate", op: "d", target: { kind: "line" } },
    { type: "select", target: { kind: "textobject", around: false, obj: "w" } },
    { type: "operate", op: "y", target: { kind: "word" } },
  ];
  let built = 0;
  let solvable = 0;
  for (const task of tasks) {
    for (let i = 0; i < 40; i++) {
      const lines = generateBoard(
        i % 3 === 0 ? "call" : i % 3 === 1 ? "quotes" : "statements",
        rng,
      );
      const vim = createState(lines);
      const goal = buildGoal({ task, lines, cursor: vim.cursor, rng, allowed: ALL.allowed });
      if (!goal) continue;
      built++;
      if (judge(goal, vim) === "incomplete") solvable++;
    }
  }
  eq("goals get built", built > 200, true);
  eq("fresh goals start incomplete", solvable, built);

  // a delete goal really is satisfied by doing the delete
  const lines = ["fn(alpha, beta);"];
  const vim = createState(lines);
  const goal = buildGoal({
    task: { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "(" } },
    lines,
    cursor: vim.cursor,
    rng,
    allowed: ALL.allowed,
  });
  if (goal) {
    let s = vim;
    for (const k of ["f", "a", "d", "i", "("]) s = applyKey(s, k, ALL);
    eq("di( satisfies the di( goal", judge(goal, s), "completed");
    let wrong = vim;
    for (const k of ["x"]) wrong = applyKey(wrong, k, ALL);
    eq("a wrong edit demands an undo", judge(goal, wrong), "must_undo");
  } else {
    fail++;
    console.log("  FAIL could not build a di( goal");
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
