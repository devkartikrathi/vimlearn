"use client";

import { useCallback, useState } from "react";
import { VimEditor } from "./vim-editor";
import { applyKey, createState } from "@/lib/vim/reducer";
import type { GameConfig, VimState } from "@/lib/vim/types";
import { cn } from "@/lib/utils";

const SAMPLE = [
  "const { data } = await client.get('statuses/user_timeline', {",
  "  screen_name: username,",
  "  count: 100,",
  "  tweet_mode: 'extended',",
  "});",
  "",
  "const tweets: Tweet[] = data.map((tweet: any) => ({",
  "  id: tweet.id_str,",
  "  text: tweet.full_text,",
  "  created_at: tweet.created_at,",
  "  user: {",
  "    id: tweet.user.id_str,",
  "    screen_name: tweet.user.screen_name,",
  "  },",
  "}));",
];

/** Every command unlocked — the hero is a sandbox, not a test. */
const FREE_PLAY: GameConfig = {
  allowed: [
    "h", "j", "k", "l", "w", "e", "b", "W", "E", "B", "0", "_", "$", "f", "F",
    "t", "T", ";", "g", "G", "{", "}", "/", "?", "n", "N", "*", "#", "d", "c",
    "y", "p", "P", "x", "s", "r", "i", "a", "I", "A", "o", "O", "D", "v", "V",
    "u", "{n}", "<C-u>", "<C-d>", '"', "'", "(", ")", "[", "]",
  ],
  goalsToComplete: 0,
};

const MODE_LABEL: Record<VimState["mode"], string> = {
  normal: "NORMAL",
  insert: "INSERT",
  visual: "VISUAL",
  "visual-line": "V-LINE",
};

const MODE_CLASS: Record<VimState["mode"], string> = {
  normal: "bg-sky-600 text-white",
  insert: "bg-emerald-600 text-white",
  visual: "bg-violet-600 text-white",
  "visual-line": "bg-violet-700 text-white",
};

export function Playground({ className }: { className?: string }) {
  const [vim, setVim] = useState<VimState>(() => createState(SAMPLE));
  const [focused, setFocused] = useState(false);

  const onKey = useCallback((key: string) => {
    setVim((s) => applyKey(s, key, FREE_PLAY));
  }, []);

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-amber-500/60" />
          <span className="size-2.5 rounded-full bg-primary/60" />
        </span>
        <span className="ml-1 font-mono text-[11px] text-muted-foreground">
          timeline.ts
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
          try it — every key works
        </span>
      </div>

      <VimEditor
        state={vim}
        goal={null}
        onKey={onKey}
        focused={focused}
        onFocusChange={setFocused}
        className="max-h-[320px] rounded-none border-0 ring-0"
      />

      <div className="flex items-center gap-3 border-t border-border bg-muted/40 px-3 py-1.5 font-mono text-[11px]">
        <span className={cn("rounded px-1.5 py-0.5 font-semibold tracking-wider", MODE_CLASS[vim.mode])}>
          {MODE_LABEL[vim.mode]}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {vim.cursor.y + 1},{vim.cursor.x + 1}
        </span>
        <span className="ml-auto truncate text-muted-foreground/70">
          {vim.callout?.text ?? "hjkl to move · w e b by word · dw to delete · i to insert"}
        </span>
      </div>
    </div>
  );
}
