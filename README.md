# VimLearn

An interactive Vim course: 52 lessons across 12 chapters, drilled inside a
modal editor built from scratch. Modelled on [Vim Hero](https://www.vim-hero.com),
rebuilt in TypeScript with Next.js and shadcn/ui.

## The idea

Vim is muscle memory, not knowledge. Every lesson gives you three lines of
explanation and then a generated challenge you cannot leave until you have done
the motion ten times on ten different pieces of code.

Three mechanics carry the teaching:

- **Command gating.** The emulator refuses any key the course has not taught
  you yet, with a toast that says so. Lesson one accepts four keys; lesson
  fifty-two accepts the lot.
- **Judging by state, not by keystroke.** A goal is a statement about the buffer
  — this range is gone, the cursor is here, that text is in the register. Any
  legal route there counts, so the app can say "yes, that also works" when you
  find your own way.
- **`must_undo` instead of failure.** Mangle the buffer and nothing scolds you;
  the status bar blocks and waits for `u`.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm test         # engine, curriculum and solution checks
```

## How it is put together

```
src/lib/vim/
  types.ts        VimState, Goal, GameConfig
  text.ts         word/WORD boundaries, text objects, range editing
  reducer.ts      the emulator — applyKey(state, key, config) -> state
  goals.ts        goal construction, judging, shortest-path search, scoring
  generators.ts   procedural code boards; nothing is hand-authored
src/lib/curriculum/
  lessons.ts      all 52 lessons as data, including what each one unlocks
src/components/vim/
  vim-editor.tsx  buffer renderer and key capture
  lesson-runner.tsx  goal loop, status bar, scoring
```

The editor is hand-built rather than CodeMirror or Monaco: those fight you over
modal keybindings and cost 300 kB to disagree with. Here the buffer is a
`string[]`, the reducer is pure, and the whole engine is testable without a DOM.

### Goals

| Kind | Satisfied when |
| --- | --- |
| `cursor` | the cursor reaches an exact position |
| `delete_range` | a marked range is gone from the buffer |
| `change_range` | the range is replaced with the required text |
| `text_match` | the buffer matches a target string |
| `visual_select` | the selection covers exactly the marked span |
| `copy_range` | the register holds the marked text |

A `change_range` goal also carries every legal intermediate buffer value, so
typing `Hel` on the way to `Hello` stays *incomplete* rather than *wrong*.

### Scoring

```
speedScore   = min(parTime / actualTime * 100, 110)
accuracyScore = min(optimalKeystrokes / actualKeystrokes * 100, 100)
proficiency   = (speedScore + accuracyScore) / 2
```

Accuracy is really keystroke economy: eight keys where `daw` would have done
costs you even though the buffer ended up right. The optimal keystroke count is
not an estimate — it comes from a shortest-path search that uses the emulator
itself as the transition function, so the keys shown as "optimal" provably
solve the goal. `npm run test:solutions` replays them for every lesson to prove
it.

## Adding a lesson

Append an entry to `src/lib/curriculum/lessons.ts`. A lesson names the commands
it unlocks (`teaches`), the boards its drills run on, and the tasks to draw
from. No new judging code is needed — pick a task shape that already exists.

```ts
{
  slug: "join-lines",
  title: "Join Lines",
  keys: ["J"],
  kind: "drill",
  teaches: ["J"],
  summary: "Pull the next line up onto this one.",
  teach: [{ keys: ["J"], label: "join this line and the next" }],
  drill: {
    boards: ["statements"],
    tasks: [{ type: "operate", op: "d", target: { kind: "line" } }],
    goals: 10,
  },
}
```

Then run `npm test` — the curriculum check confirms the lesson can always start
a round, and the solution check confirms its advertised keystrokes work.
