interface TerminalFrameProps {
  children: React.ReactNode;
  title?: string;
}

export function TerminalFrame({ children, title = "terminal" }: TerminalFrameProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
          <span className="h-3 w-3 rounded-full bg-green-400/80" />
        </div>
        <span className="ml-2 text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="p-1">{children}</div>
    </div>
  );
}
