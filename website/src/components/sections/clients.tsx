import { Badge } from "@/components/ui/badge";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";

const CLIENTS = [
  "Claude Code",
  "Claude Desktop",
  "Codex",
  "Cursor",
  "Windsurf",
  "VS Code",
  "Kiro",
  "Kilo Code",
  "Cline",
  "Roo Code",
  "Zed",
  "OpenCode",
  "Antigravity",
] as const;

export function ClientsSection() {
  return (
    <section className="px-4 py-20 sm:px-6" id="clients">
      <div className="mx-auto max-w-4xl text-center">
        <FadeUp>
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Supported Clients
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium">agent-lint init</code>{" "}
          detects your IDE and writes the right MCP config automatically.
        </p>
        </FadeUp>

        <Stagger className="flex flex-wrap items-center justify-center gap-3">
          {CLIENTS.map((client) => (
            <StaggerItem key={client}><Badge
              key={client}
              variant="secondary"
              className="px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 hover:bg-brand-700/10 hover:text-brand-700"
            >
              {client}
            </Badge></StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
