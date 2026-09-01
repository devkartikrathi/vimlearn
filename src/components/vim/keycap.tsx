import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  "<Esc>": "esc",
  "<CR>": "↵",
  "<BS>": "⌫",
  "<C-u>": "C-u",
  "<C-d>": "C-d",
  " ": "space",
};

export function Keycap({
  k,
  className,
  tone = "default",
}: {
  k: string;
  className?: string;
  tone?: "default" | "accent" | "muted";
}) {
  const label = LABELS[k] ?? k;
  const wide = label.length > 1;
  return (
    <kbd
      className={cn(
        "inline-flex select-none items-center justify-center rounded-[4px] border border-b-2 font-mono text-[11px] leading-none",
        wide ? "px-1.5 py-1" : "h-[22px] w-[22px]",
        tone === "accent"
          ? "border-primary/40 bg-primary/10 text-primary"
          : tone === "muted"
            ? "border-border bg-muted/50 text-muted-foreground"
            : "border-border bg-background text-foreground",
        className,
      )}
    >
      {label}
    </kbd>
  );
}

export function Keys({ keys, tone }: { keys: string[]; tone?: "default" | "accent" | "muted" }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-[3px]">
      {keys.map((k, i) => (
        <Keycap key={`${k}-${i}`} k={k} tone={tone} />
      ))}
    </span>
  );
}
