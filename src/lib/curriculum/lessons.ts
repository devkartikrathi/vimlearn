import type { Chapter, Lesson } from "./types";

export const CHAPTERS: Chapter[] = [
  /* ================================================================= */
  {
    slug: "basic-vim",
    title: "Basic Vim",
    lessons: [
      {
        slug: "intro-to-modes",
        title: "Intro to modes",
        keys: ["modes"],
        kind: "concept",
        teaches: [],
        summary:
          "The one idea that makes every other Vim command make sense: the same key does different things in different modes.",
        teach: [
          {
            label: "Normal mode",
            body:
              "Where you start, and where you spend most of your time. Keys are commands, not text: they move the cursor, delete, copy and paste. Think of it as the mode you read and navigate in.",
            example:
              'const total = 1;\nfunction sendGreeting() {\n  console.log("Hello, world!");\n}',
          },
          {
            label: "Insert mode",
            body:
              "Where you type. This is the behaviour every other editor gives you all the time — keys put characters on the screen. You enter it deliberately, and leave it with Esc as soon as you are done.",
            example: 'const message = "";',
          },
          {
            label: "The same key, two meanings",
            body:
              "In normal mode, w moves the cursor forward one word. In insert mode, w types the letter w. Nothing about Vim is confusing once you always know which mode you are in — and the status bar below the editor always tells you.",
          },
        ],
      },
      {
        slug: "basic-movement",
        title: "Basic Movement",
        keys: ["h", "j", "k", "l"],
        kind: "drill",
        teaches: ["h", "j", "k", "l"],
        summary: "Move the cursor without leaving the home row.",
        teach: [
          { keys: ["h"], label: "left" },
          { keys: ["j"], label: "down" },
          { keys: ["k"], label: "up" },
          { keys: ["l"], label: "right" },
          {
            label: "Why these four",
            body:
              "They sit under your right hand on the home row, so your fingers never travel to the arrow keys. j has a little hook that hangs down like an arrow pointing down — that is the mnemonic everyone ends up using.",
          },
        ],
        drill: {
          boards: ["statements", "prose"],
          tasks: [{ type: "move", via: ["h", "j", "k", "l"], reps: [1, 4] }],
          goals: 10,
          motionsOnly: true,
        },
        note: "Resist the arrow keys from day one. The whole point is that your hands never move.",
      },
      {
        slug: "moving-with-words",
        title: "Moving by Words",
        keys: ["w", "e", "b"],
        kind: "drill",
        teaches: ["w", "e", "b"],
        summary: "Cover ground a word at a time instead of a character at a time.",
        teach: [
          { keys: ["w"], label: "forward to the start of the next word", example: "const |username = getUser();" },
          { keys: ["e"], label: "forward to the end of a word", example: "const usernam|e = getUser();" },
          { keys: ["b"], label: "back to the start of a word", example: "const |username = getUser();" },
          {
            label: "What counts as a word",
            body:
              "A word is a run of letters, digits and underscores — or a run of punctuation. That means getUser() is three words: getUser, ( and ). It feels fussy for about ten minutes and then it feels precise.",
          },
        ],
        drill: {
          boards: ["statements", "call", "prose"],
          tasks: [{ type: "move", via: ["w", "e", "b"], reps: [1, 4] }],
          goals: 10,
          motionsOnly: true,
        },
      },
      {
        slug: "insert",
        title: "Insert Mode",
        keys: ["i", "a", "esc"],
        kind: "drill",
        teaches: ["i", "a"],
        summary: "Get into insert mode on purpose, and get straight back out.",
        teach: [
          { keys: ["i"], label: "insert before the cursor" },
          { keys: ["a"], label: "insert after the cursor" },
          { keys: ["esc"], label: "back to normal mode" },
          {
            label: "Leave insert mode",
            body:
              "The habit that separates people who like Vim from people who bounce off it: press Esc the moment you finish a thought. Normal mode is home. Insert mode is a visit.",
          },
        ],
        drill: {
          boards: ["statements", "call"],
          tasks: [{ type: "insertAt", where: "before" }],
          goals: 8,
        },
      },
      {
        slug: "basics-review",
        title: "Bug Squasher",
        keys: ["game"],
        kind: "game",
        teaches: [],
        summary:
          "Your code is infested. Insects have eaten characters out of the source — squash them and repair the damage.",
        teach: [
          { label: "1 — squash the bugs", body: "Jump over every bug with the word motions w, e and b. Landing on a bug squashes it." },
          { label: "2 — repair the code", body: "Bugs ate characters on their way through. Use insert mode to type them back until the code is valid again." },
        ],
        drill: {
          boards: ["object"],
          tasks: [{ type: "bugFix" }],
          goals: 1,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "insert-like-a-pro",
    title: "Insert Like a Pro",
    lessons: [
      {
        slug: "insert-at-line-ends",
        title: "Insert at Line Ends",
        keys: ["I", "A", "esc"],
        kind: "drill",
        teaches: ["I", "A"],
        summary: "Jump to the start or end of a line and start typing in one keystroke.",
        teach: [
          { keys: ["I"], label: "insert at the first non-blank character", example: "  |return total;" },
          { keys: ["A"], label: "insert at the end of the line", example: "  return total;|" },
          {
            label: "Two keys instead of five",
            body:
              "A is the single most-used insert command there is. Anywhere on the line, one key puts you at the end of it in insert mode — no $ then a, no reaching for End.",
          },
        ],
        drill: {
          boards: ["statements", "call"],
          tasks: [
            { type: "insertAt", where: "lineEnd" },
            { type: "insertAt", where: "lineStart" },
          ],
          goals: 8,
        },
      },
      {
        slug: "open",
        title: "Opening New Lines",
        keys: ["o", "O"],
        kind: "drill",
        teaches: ["o", "O"],
        summary: "Make room above or below without touching Enter.",
        teach: [
          { keys: ["o"], label: "open a line below and insert" },
          { keys: ["O"], label: "open a line above and insert" },
          {
            label: "Indentation comes free",
            body:
              "Both commands copy the indentation of the current line, so you land exactly where the next statement belongs.",
          },
        ],
        drill: {
          boards: ["statements", "block"],
          tasks: [
            { type: "insertAt", where: "openBelow" },
            { type: "insertAt", where: "openAbove" },
          ],
          goals: 8,
        },
      },
      {
        slug: "small-edits",
        title: "Making Small Edits",
        keys: ["s", "x", "r"],
        kind: "drill",
        teaches: ["s", "x", "r", "u"],
        summary: "Fix a typo without a round trip through insert mode.",
        teach: [
          { keys: ["x"], label: "delete the character under the cursor" },
          { keys: ["s"], label: "delete the character and start insert" },
          { keys: ["r"], label: "replace one character — r then the new character" },
          { keys: ["u"], label: "undo" },
          {
            label: "r stays in normal mode",
            body:
              "r is the one edit that never puts you in insert mode. Press r, press the replacement, and you are still in normal mode ready for the next command.",
          },
        ],
        drill: {
          boards: ["statements", "call"],
          tasks: [{ type: "smallEdit" }],
          goals: 10,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "essential-motions",
    title: "Essential Motions",
    lessons: [
      {
        slug: "moving-by-upper-words",
        title: "Moving by WORDs",
        keys: ["W", "E", "B"],
        kind: "drill",
        teaches: ["W", "E", "B"],
        summary: "The uppercase motions treat anything non-blank as one word.",
        teach: [
          { keys: ["W"], label: "forward to the next WORD" },
          { keys: ["E"], label: "forward to the end of a WORD" },
          { keys: ["B"], label: "back to the start of a WORD" },
          {
            label: "word vs WORD",
            body:
              "user.profile.name is six words and one WORD. Lowercase motions stop at every punctuation boundary; uppercase motions only stop at whitespace. Reach for the uppercase ones when you want to skip a whole path, URL or argument in a single press.",
            example: "await client.get('statuses/user_timeline', options);",
          },
        ],
        drill: {
          boards: ["call", "statements"],
          tasks: [{ type: "move", via: ["W", "E", "B"], reps: [1, 3] }],
          goals: 10,
          motionsOnly: true,
        },
      },
      {
        slug: "moving-to-line-ends",
        title: "Moving to Line Ends",
        keys: ["0", "_", "$"],
        kind: "drill",
        teaches: ["0", "_", "$"],
        summary: "Snap to the beginning or end of the current line.",
        teach: [
          { keys: ["0"], label: "column zero, indentation included" },
          { keys: ["_"], label: "the first non-blank character" },
          { keys: ["$"], label: "the last character of the line" },
        ],
        drill: {
          boards: ["block", "statements"],
          tasks: [
            { type: "moveTo", anchor: "lineEnd" },
            { type: "moveTo", anchor: "firstNonBlank" },
            { type: "moveTo", anchor: "lineStart" },
          ],
          goals: 10,
          motionsOnly: true,
        },
      },
      {
        slug: "find",
        title: "Find Character",
        keys: ["f", "F", ";"],
        kind: "drill",
        teaches: ["f", "F", ";"],
        summary: "Fly to any character on the line in two keystrokes.",
        teach: [
          { keys: ["f", "x"], label: "forward to the next x" },
          { keys: ["F", "x"], label: "back to the previous x" },
          { keys: [";"], label: "repeat the last find" },
          {
            label: "Pick a rare character",
            body:
              "f is fastest when you aim at something uncommon on the line — a quote, a bracket, a capital letter. Aiming at e usually means pressing ; four times.",
          },
        ],
        drill: {
          boards: ["call", "quotes", "statements"],
          tasks: [{ type: "findChar" }],
          goals: 10,
          motionsOnly: true,
        },
      },
      {
        slug: "till",
        title: "Till Character",
        keys: ["t", "T", ";"],
        kind: "drill",
        teaches: ["t", "T"],
        summary: "Stop just short of a character — the motion that pairs with operators.",
        teach: [
          { keys: ["t", "x"], label: "forward, stopping before the next x" },
          { keys: ["T", "x"], label: "back, stopping after the previous x" },
          {
            label: "Why stop short",
            body:
              "t comes into its own with operators. dt) deletes everything up to the closing paren but leaves the paren itself — exactly what you want when rewriting an argument list.",
          },
        ],
        drill: {
          boards: ["call", "quotes"],
          tasks: [{ type: "findChar", till: true }],
          goals: 10,
          motionsOnly: true,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "basic-operators",
    title: "Basic Operators",
    lessons: [
      {
        slug: "intro-to-operators",
        title: "Intro to Operators",
        keys: ["operators"],
        kind: "concept",
        teaches: [],
        summary:
          "Vim is a language. Operators are the verbs, motions are the objects, and you already know the objects.",
        teach: [
          {
            label: "operator + motion",
            body:
              "An operator on its own does nothing. It waits for a motion, then applies itself to everything the motion would have crossed. d is delete, c is change, y is yank (copy).",
            example: "d + w  =  delete to the start of the next word\nd + $  =  delete to the end of the line\nc + e  =  change to the end of this word",
          },
          {
            label: "Why this matters",
            body:
              "You are not memorising commands, you are combining two small vocabularies. Every motion you already know instantly becomes three new edits the moment you learn d, c and y. That multiplication is the whole reason Vim is worth learning.",
          },
          {
            label: "Doubling the operator",
            body:
              "Press an operator twice and it applies to the whole line: dd deletes a line, yy copies one, cc clears one ready to retype.",
          },
        ],
      },
      {
        slug: "delete-words",
        title: "Delete Words",
        keys: ["d", "w"],
        kind: "drill",
        teaches: ["d"],
        summary: "Your first operator, combined with the motions you already have.",
        teach: [
          { keys: ["d", "w"], label: "delete a word", example: 'const username = "john_doe";' },
          { keys: ["d", "W"], label: "delete a WORD", example: "return RegExp.test(str);" },
          { keys: ["esc"], label: "cancel an operator you started by mistake" },
        ],
        drill: {
          boards: ["statements", "call", "prose"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "word" } },
            { type: "operate", op: "d", target: { kind: "word", big: true } },
          ],
          goals: 10,
        },
        note: "Deleted text goes to the clipboard — you can paste it back with p, which you will meet shortly.",
      },
      {
        slug: "change-word",
        title: "Change Words",
        keys: ["c", "w"],
        kind: "drill",
        teaches: ["c"],
        summary: "Delete and start typing in one motion.",
        teach: [
          { keys: ["c", "w"], label: "change a word — deletes it and enters insert mode" },
          { keys: ["c", "W"], label: "change a WORD" },
          {
            label: "cw is really ce",
            body:
              "Vim's one famous inconsistency: cw stops at the end of the word rather than the start of the next one, so it does not eat the space after it. It is what you want every time — you just have to know it is deliberate.",
          },
        ],
        drill: {
          boards: ["statements", "call"],
          tasks: [
            { type: "operate", op: "c", target: { kind: "word" } },
            { type: "operate", op: "c", target: { kind: "word", big: true } },
          ],
          goals: 10,
        },
      },
      {
        slug: "delete-lines",
        title: "Delete Lines",
        keys: ["d", "d", "D"],
        kind: "drill",
        teaches: ["D"],
        summary: "Take out a whole line, or everything after the cursor.",
        teach: [
          { keys: ["d", "d"], label: "delete the whole line" },
          { keys: ["D"], label: "delete from the cursor to the end of the line" },
        ],
        drill: {
          boards: ["statements", "block"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "line" } },
            { type: "operate", op: "d", target: { kind: "toLineEnd" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "delete-multiple-lines",
        title: "Delete Multiple Lines",
        keys: ["d", "j", "k"],
        kind: "drill",
        teaches: [],
        summary: "Operators take vertical motions too — and that deletes whole lines.",
        teach: [
          { keys: ["d", "j"], label: "delete this line and the one below" },
          { keys: ["d", "k"], label: "delete this line and the one above" },
          {
            label: "Linewise by nature",
            body:
              "j and k are linewise motions, so any operator applied to them works on entire lines rather than part of one. dj is two lines gone, not two characters.",
          },
        ],
        drill: {
          boards: ["statements", "paragraphs"],
          tasks: [{ type: "operate", op: "d", target: { kind: "line", count: 2 } }],
          goals: 8,
        },
      },
      {
        slug: "copy-paste-lines",
        title: "Copy / Paste Lines",
        keys: ["y", "p", "P"],
        kind: "drill",
        teaches: ["y", "p", "P"],
        summary: "Yank, then put it back where you want it.",
        teach: [
          { keys: ["y", "y"], label: "yank (copy) the whole line" },
          { keys: ["p"], label: "paste after the cursor or below the line" },
          { keys: ["P"], label: "paste before the cursor or above the line" },
          {
            label: "Delete is a cut",
            body:
              "d and x fill the same register as y, so anything you delete can be pasted straight back. There is no separate cut command because there never needed to be one.",
          },
        ],
        drill: {
          boards: ["statements", "block"],
          tasks: [{ type: "paste" }],
          goals: 8,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "vertical-movement",
    title: "Advanced Vertical Movement",
    lessons: [
      {
        slug: "relative-line-jumps",
        title: "Relative Line Jumps",
        keys: ["{n}", "j", "k"],
        kind: "drill",
        teaches: ["{n}"],
        summary: "Put a number in front of a motion and it repeats that many times.",
        teach: [
          { keys: ["8", "j"], label: "down eight lines" },
          { keys: ["3", "k"], label: "up three lines" },
          {
            label: "Turn on relative numbers",
            body:
              "In a real Vim, :set relativenumber prints the distance to every line on screen, so the count you need is always already written next to the line you are looking at.",
          },
        ],
        drill: {
          boards: ["long"],
          tasks: [{ type: "move", via: ["j", "k"], reps: [3, 9] }],
          goals: 10,
          motionsOnly: true,
          minimumLines: 24,
        },
      },
      {
        slug: "absolute-line-jumps",
        title: "Absolute Line Jumps",
        keys: ["g", "g", "G"],
        kind: "drill",
        teaches: ["g", "G"],
        summary: "Top of the file, bottom of the file, or any line by number.",
        teach: [
          { keys: ["g", "g"], label: "first line of the file" },
          { keys: ["G"], label: "last line of the file" },
          { keys: ["4", "2", "g", "g"], label: "jump to line 42" },
        ],
        drill: {
          boards: ["long"],
          tasks: [
            { type: "moveTo", anchor: "fileStart" },
            { type: "moveTo", anchor: "fileEnd" },
          ],
          goals: 8,
          motionsOnly: true,
          minimumLines: 24,
        },
      },
      {
        slug: "paragraph-jumps",
        title: "Paragraph Jumps",
        keys: ["}", "{"],
        kind: "drill",
        teaches: ["}", "{"],
        summary: "Travel by blocks of code instead of by lines.",
        teach: [
          { keys: ["}"], label: "forward to the next blank line" },
          { keys: ["{"], label: "back to the previous blank line" },
          {
            label: "Blank lines are structure",
            body:
              "Because you already separate functions with blank lines, } is effectively 'jump to the next block'. It is the fastest way to move through a file you are reading.",
          },
        ],
        drill: {
          boards: ["paragraphs", "long"],
          tasks: [{ type: "moveTo", anchor: "paragraph" }],
          goals: 8,
          motionsOnly: true,
          minimumLines: 16,
        },
      },
      {
        slug: "window-scrolls",
        title: "Window Scrolls",
        keys: ["C-u", "C-d"],
        kind: "drill",
        teaches: ["<C-u>", "<C-d>"],
        summary: "Move a half screen at a time and keep your bearings.",
        teach: [
          { keys: ["Ctrl", "d"], label: "down half a screen" },
          { keys: ["Ctrl", "u"], label: "up half a screen" },
          {
            label: "Half, not whole",
            body:
              "Half-screen jumps keep some of the previous view on screen, so you never lose your place. That is why they are the ones people actually use.",
          },
        ],
        drill: {
          boards: ["long"],
          tasks: [{ type: "move", via: ["j", "k"], reps: [6, 10] }],
          goals: 8,
          motionsOnly: true,
          minimumLines: 30,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "search",
    title: "Search",
    lessons: [
      {
        slug: "search",
        title: "Search",
        keys: ["/", "?"],
        kind: "drill",
        teaches: ["/", "?"],
        summary: "The fastest motion in the editor: type what you are looking at.",
        teach: [
          { keys: ["/"], label: "search forward — type the term, press Enter" },
          { keys: ["?"], label: "search backward" },
        ],
        drill: {
          boards: ["long", "paragraphs"],
          tasks: [{ type: "search" }],
          goals: 8,
          motionsOnly: true,
          minimumLines: 16,
        },
      },
      {
        slug: "repeat-search",
        title: "Repeat Search",
        keys: ["n", "N"],
        kind: "drill",
        teaches: ["n", "N"],
        summary: "Walk through every match without retyping the term.",
        teach: [
          { keys: ["n"], label: "next match, same direction" },
          { keys: ["N"], label: "previous match" },
        ],
        drill: {
          boards: ["long", "paragraphs"],
          tasks: [{ type: "search" }],
          goals: 8,
          motionsOnly: true,
          minimumLines: 16,
        },
      },
      {
        slug: "quick-word-search",
        title: "Quick Word Search",
        keys: ["*", "#"],
        kind: "drill",
        teaches: ["*", "#"],
        summary: "Search for the word under the cursor without typing it.",
        teach: [
          { keys: ["*"], label: "next occurrence of the word under the cursor" },
          { keys: ["#"], label: "previous occurrence" },
          {
            label: "How you read code",
            body:
              "Put the cursor on a variable, press * a few times, and you have traced every use of it in the file. No mouse, no find dialog, no typing.",
          },
        ],
        drill: {
          boards: ["long", "paragraphs"],
          tasks: [{ type: "search", quick: true }],
          goals: 8,
          motionsOnly: true,
          minimumLines: 16,
        },
      },
      {
        slug: "search-review",
        title: "Search Review",
        keys: ["review"],
        kind: "review",
        teaches: [],
        summary: "Every search command, drawn at random. Recall, not repetition.",
        drill: {
          boards: ["long", "paragraphs"],
          tasks: [
            { type: "search" },
            { type: "search", quick: true },
            { type: "moveTo", anchor: "fileEnd" },
            { type: "moveTo", anchor: "paragraph" },
          ],
          goals: 12,
          motionsOnly: true,
          minimumLines: 20,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "text-objects-brackets",
    title: "Text Objects — Brackets",
    lessons: [
      {
        slug: "intro-to-text-objects",
        title: "Intro to Text Objects",
        keys: ["text objects"],
        kind: "concept",
        teaches: ["i", "a"],
        summary:
          "Stop counting words. Start naming the thing you actually mean: this string, these arguments, this block.",
        teach: [
          {
            label: "inside vs around",
            body:
              "A text object is the second half of an operator command, in place of a motion. It comes in two flavours: i for inside — the contents only — and a for around, which includes the delimiters themselves.",
            example: "di(   delete inside the parentheses\nda(   delete the parentheses too",
          },
          {
            label: "Position stops mattering",
            body:
              "This is the real unlock. A text object works from anywhere inside it — you do not have to be on the opening bracket, or count how many words are in the string. Land somewhere in the middle and say what you mean.",
          },
          {
            label: "The grammar so far",
            body:
              "operator + i/a + object. d i { is 'delete inside these braces'. c a \" is 'change this whole string, quotes included'. Three keystrokes, and it reads like a sentence.",
          },
        ],
      },
      {
        slug: "delete-inside-brackets",
        title: "Delete Inside Brackets",
        keys: ["d", "i", "{"],
        kind: "drill",
        teaches: ["{", "}", "(", ")", "[", "]"],
        summary: "Empty a block, an argument list or an array from anywhere inside it.",
        teach: [
          { keys: ["d", "i", "{"], label: "delete everything inside the braces" },
          { keys: ["d", "i", "("], label: "delete everything inside the parentheses" },
          { keys: ["d", "i", "["], label: "delete everything inside the brackets" },
        ],
        drill: {
          boards: ["object", "array", "call", "block"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "{" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "(" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "[" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "delete-around-brackets",
        title: "Delete Around Brackets",
        keys: ["d", "a", "{"],
        kind: "drill",
        teaches: [],
        summary: "Take the delimiters with you.",
        teach: [
          { keys: ["d", "a", "{"], label: "delete the braces and their contents" },
          { keys: ["d", "a", "("], label: "delete the parentheses and their contents" },
        ],
        drill: {
          boards: ["object", "array", "call", "block"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "{" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "(" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "[" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "change-inside-brackets",
        title: "Change Inside Brackets",
        keys: ["c", "i", "{"],
        kind: "drill",
        teaches: [],
        summary: "Replace the contents and keep the shape.",
        teach: [
          { keys: ["c", "i", "("], label: "change everything inside the parentheses" },
          {
            label: "The argument-rewrite command",
            body:
              "ci( is the one you will use most in real code: park anywhere inside a call and retype its arguments without ever touching the brackets.",
          },
        ],
        drill: {
          boards: ["call", "object", "array"],
          tasks: [
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "(" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "[" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "change-around-brackets",
        title: "Change Around Brackets",
        keys: ["c", "a", "{"],
        kind: "drill",
        teaches: [],
        summary: "Replace the delimiters as well as what is between them.",
        teach: [{ keys: ["c", "a", "("], label: "change the parentheses and their contents" }],
        drill: {
          boards: ["call", "array", "object"],
          tasks: [
            { type: "operate", op: "c", target: { kind: "textobject", around: true, obj: "(" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: true, obj: "[" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "brackets-review",
        title: "Brackets Review",
        keys: ["review"],
        kind: "review",
        teaches: [],
        summary: "Inside, around, delete, change — mixed and shuffled.",
        drill: {
          boards: ["object", "array", "call", "block"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "{" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "(" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "(" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: true, obj: "[" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "[" } },
          ],
          goals: 12,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "text-objects-quotes",
    title: "Text Objects — Quotes",
    lessons: [
      {
        slug: "delete-inside-quotes",
        title: "Delete Inside Quotes",
        keys: ["d", "i", '"'],
        kind: "drill",
        teaches: ['"', "'"],
        summary: "Empty a string without selecting a single character by hand.",
        teach: [
          { keys: ["d", "i", '"'], label: "delete the contents of a double-quoted string" },
          { keys: ["d", "i", "'"], label: "delete the contents of a single-quoted string" },
        ],
        drill: {
          boards: ["quotes", "object"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: '"' } },
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "'" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "delete-around-quotes",
        title: "Delete Around Quotes",
        keys: ["d", "a", '"'],
        kind: "drill",
        teaches: [],
        summary: "Remove the string and its quotes together.",
        teach: [{ keys: ["d", "a", '"'], label: "delete the string including its quotes" }],
        drill: {
          boards: ["quotes", "object"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: '"' } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "'" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "change-inside-quotes",
        title: "Change Inside Quotes",
        keys: ["c", "i", '"'],
        kind: "drill",
        teaches: [],
        summary: "The single most useful three keystrokes in day-to-day editing.",
        teach: [
          { keys: ["c", "i", '"'], label: "replace the contents of a string" },
          {
            label: "From anywhere on the line",
            body:
              "You do not have to be inside the quotes when you start — Vim finds the next pair on the line. Which means ci\" works from wherever the cursor happened to be.",
          },
        ],
        drill: {
          boards: ["quotes", "object"],
          tasks: [
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: '"' } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "'" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "change-around-quotes",
        title: "Change Around Quotes",
        keys: ["c", "a", '"'],
        kind: "drill",
        teaches: [],
        summary: "Swap a whole string expression, quotes and all.",
        teach: [{ keys: ["c", "a", '"'], label: "change the string including its quotes" }],
        drill: {
          boards: ["quotes"],
          tasks: [
            { type: "operate", op: "c", target: { kind: "textobject", around: true, obj: '"' } },
            { type: "operate", op: "c", target: { kind: "textobject", around: true, obj: "'" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "quotes-review",
        title: "Quotes Review",
        keys: ["review"],
        kind: "review",
        teaches: [],
        summary: "Both quote styles, inside and around, delete and change.",
        drill: {
          boards: ["quotes", "object", "call"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: '"' } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "'" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "'" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: true, obj: '"' } },
          ],
          goals: 12,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "text-objects-words",
    title: "Text Objects — Words",
    lessons: [
      {
        slug: "delete-inside-word",
        title: "Delete Inside Word",
        keys: ["d", "i", "w"],
        kind: "drill",
        teaches: ["w"],
        summary: "Delete the word you are standing on, wherever in it you are standing.",
        teach: [
          { keys: ["d", "i", "w"], label: "delete the word under the cursor" },
          {
            label: "diw beats dw",
            body:
              "dw deletes from the cursor forward, so it only removes a whole word if you are on its first character. diw removes the whole word from anywhere inside it — no positioning required.",
          },
        ],
        drill: {
          boards: ["statements", "prose", "call"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "w" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "delete-around-word",
        title: "Delete Around Word",
        keys: ["d", "a", "w"],
        kind: "drill",
        teaches: [],
        summary: "Take the trailing space with it, so the sentence stays clean.",
        teach: [
          { keys: ["d", "a", "w"], label: "delete the word and the whitespace after it" },
        ],
        drill: {
          boards: ["prose", "statements"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "w" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "change-inside-word",
        title: "Change Inside Word",
        keys: ["c", "i", "w"],
        kind: "drill",
        teaches: [],
        summary: "Rename a variable from anywhere inside it.",
        teach: [
          { keys: ["c", "i", "w"], label: "replace the word under the cursor" },
          {
            label: "The rename command",
            body:
              "ciw then type the new name. Combined with * to find the next occurrence and . to repeat, it is a rename-in-file in about six keystrokes.",
          },
        ],
        drill: {
          boards: ["statements", "call", "prose"],
          tasks: [
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "w" } },
          ],
          goals: 10,
        },
      },
      {
        slug: "words-review",
        title: "Words Review",
        keys: ["review"],
        kind: "review",
        teaches: [],
        summary: "iw and aw, mixed with the word motions they replace.",
        drill: {
          boards: ["statements", "prose", "call"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "w" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "w" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "w" } },
            { type: "operate", op: "d", target: { kind: "word" } },
          ],
          goals: 12,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "text-objects-paragraphs",
    title: "Text Objects — Paragraphs",
    lessons: [
      {
        slug: "delete-inside-paragraph",
        title: "Delete Inside Paragraph",
        keys: ["d", "i", "p"],
        kind: "drill",
        teaches: ["p"],
        summary: "Remove a whole block of code in three keystrokes.",
        teach: [
          { keys: ["d", "i", "p"], label: "delete the block of lines around the cursor" },
          {
            label: "A paragraph is a block",
            body:
              "In code, a paragraph is whatever sits between two blank lines — which is usually exactly one function, one import group, or one config object.",
          },
        ],
        drill: {
          boards: ["paragraphs"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "p" } },
          ],
          goals: 8,
        },
      },
      {
        slug: "delete-around-paragraph",
        title: "Delete Around Paragraph",
        keys: ["d", "a", "p"],
        kind: "drill",
        teaches: [],
        summary: "Take the trailing blank line too, so you are not left with a gap.",
        teach: [
          { keys: ["d", "a", "p"], label: "delete the block and the blank line after it" },
        ],
        drill: {
          boards: ["paragraphs"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "p" } },
          ],
          goals: 8,
        },
      },
      {
        slug: "change-inside-paragraph",
        title: "Change Inside Paragraph",
        keys: ["c", "i", "p"],
        kind: "drill",
        teaches: [],
        summary: "Clear a block and start writing the replacement.",
        teach: [{ keys: ["c", "i", "p"], label: "clear the block and enter insert mode" }],
        drill: {
          boards: ["paragraphs"],
          tasks: [
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "p" } },
          ],
          goals: 8,
        },
      },
      {
        slug: "paragraphs-review",
        title: "Paragraphs Review",
        keys: ["review"],
        kind: "review",
        teaches: [],
        summary: "Paragraph objects mixed with the jumps that get you to them.",
        drill: {
          boards: ["paragraphs"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "p" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "p" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "p" } },
          ],
          goals: 10,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "mega-review",
    title: "Mega Review",
    lessons: [
      {
        slug: "text-objects-mega-review",
        title: "Text Objects Mega Review",
        keys: ["4 chapters"],
        kind: "review",
        teaches: [],
        summary:
          "Every text object in the course, drawn at random over four kinds of board. This is the one that tells you whether it stuck.",
        drill: {
          boards: ["object", "array", "call", "quotes", "paragraphs", "block"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "{" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "(" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "(" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: '"' } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "'" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: '"' } },
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "w" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: "w" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: true, obj: "w" } },
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "p" } },
          ],
          goals: 20,
        },
      },
    ],
  },

  /* ================================================================= */
  {
    slug: "visual-mode",
    title: "Visual Mode",
    lessons: [
      {
        slug: "intro-to-visual-mode",
        title: "Intro to Visual Mode",
        keys: ["v"],
        kind: "drill",
        teaches: ["v"],
        summary: "See the selection before you act on it.",
        teach: [
          { keys: ["v"], label: "start a character-wise selection" },
          {
            label: "Motion, then verb — reversed",
            body:
              "Everywhere else in Vim you say the verb first. Visual mode lets you build the selection with the motions you already know, look at it, and only then decide what to do. It is the training wheels that never come off — even experts use it when a range is awkward to name.",
          },
        ],
        drill: {
          boards: ["statements", "call"],
          tasks: [{ type: "select", target: { kind: "textobject", around: false, obj: "w" } }],
          goals: 8,
        },
      },
      {
        slug: "visual-mode-operators",
        title: "Visual Mode Operators",
        keys: ["v", "d", "c", "y"],
        kind: "drill",
        teaches: [],
        summary: "Once it is selected, the operators work exactly as they always did.",
        teach: [
          { keys: ["d"], label: "delete the selection" },
          { keys: ["c"], label: "change the selection" },
          { keys: ["y"], label: "yank the selection" },
        ],
        drill: {
          boards: ["statements", "call", "quotes"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "textobject", around: false, obj: "w" } },
            { type: "operate", op: "c", target: { kind: "textobject", around: false, obj: '"' } },
          ],
          goals: 10,
        },
      },
      {
        slug: "visual-mode-switch-end",
        title: "Switch Selection Ends",
        keys: ["o"],
        kind: "drill",
        teaches: [],
        summary: "Extend a selection from the other end without starting over.",
        teach: [
          { keys: ["o"], label: "jump the cursor to the other end of the selection" },
          {
            label: "Fixing an overshoot",
            body:
              "Selected one word too many at the start? Press o, adjust, press o again. Much faster than escaping and re-selecting.",
          },
        ],
        drill: {
          boards: ["statements", "prose"],
          tasks: [{ type: "select", target: { kind: "textobject", around: true, obj: "w" } }],
          goals: 8,
        },
      },
      {
        slug: "visual-line-mode",
        title: "Visual Line Mode",
        keys: ["V"],
        kind: "drill",
        teaches: ["V"],
        summary: "Select whole lines, which is what you usually want.",
        teach: [
          { keys: ["V"], label: "start a line-wise selection" },
          { keys: ["V", "j", "j"], label: "select three lines" },
        ],
        drill: {
          boards: ["statements", "block", "paragraphs"],
          tasks: [{ type: "select", target: { kind: "line", count: 2 }, linewise: true }],
          goals: 8,
        },
      },
      {
        slug: "visual-line-switch-end",
        title: "Switch Visual Line Ends",
        keys: ["V", "o"],
        kind: "drill",
        teaches: [],
        summary: "Grow a line selection upward after you started downward.",
        teach: [{ keys: ["o"], label: "swap which end of the line selection moves" }],
        drill: {
          boards: ["paragraphs", "block"],
          tasks: [{ type: "select", target: { kind: "line", count: 3 }, linewise: true }],
          goals: 8,
        },
      },
      {
        slug: "visual-line-operators",
        title: "Visual Line Operators",
        keys: ["V", "d", "c", "y"],
        kind: "drill",
        teaches: [],
        summary: "Delete, change or yank a block of lines you can see.",
        teach: [
          { keys: ["V", "j", "d"], label: "delete two lines" },
          { keys: ["V", "j", "y"], label: "yank two lines" },
          {
            label: "You have finished the core",
            body:
              "Motions, operators, text objects and visual mode are the whole grammar. Everything else in Vim — macros, marks, registers, the command line — is built on top of what you now have in your fingers.",
          },
        ],
        drill: {
          boards: ["paragraphs", "block", "statements"],
          tasks: [
            { type: "operate", op: "d", target: { kind: "line", count: 2 } },
            { type: "operate", op: "d", target: { kind: "line", count: 3 } },
          ],
          goals: 10,
        },
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Derived views                                                       */
/* ------------------------------------------------------------------ */

export const ALL_LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons);

export const LESSON_COUNT = ALL_LESSONS.length;

export function lessonBySlug(slug: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.slug === slug);
}

export function chapterOf(slug: string) {
  return CHAPTERS.find((c) => c.lessons.some((l) => l.slug === slug));
}

export function lessonIndex(slug: string): number {
  return ALL_LESSONS.findIndex((l) => l.slug === slug);
}

export function neighbours(slug: string) {
  const i = lessonIndex(slug);
  return {
    prev: i > 0 ? ALL_LESSONS[i - 1] : undefined,
    next: i >= 0 && i < ALL_LESSONS.length - 1 ? ALL_LESSONS[i + 1] : undefined,
  };
}

/** Always-available keys plus everything taught up to and including this lesson. */
const BASE_KEYS = ["<Esc>", "<CR>", "<BS>"];

export function allowedKeysFor(slug: string): string[] {
  const i = lessonIndex(slug);
  const taught = ALL_LESSONS.slice(0, i + 1).flatMap((l) => l.teaches);
  return Array.from(new Set([...BASE_KEYS, ...taught]));
}
