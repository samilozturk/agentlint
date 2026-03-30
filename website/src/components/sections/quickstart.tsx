import { Copy, Check } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import { TerminalFrame } from "@/components/terminal-frame";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";

const CODE_BLOCKS = [
  {
    title: "Quick Start",
    code: "npx @agent-lint/cli",
  },
  {
    title: "Global Install",
    code: `npm install -g @agent-lint/cli
agent-lint`,
  },
  {
    title: "MCP Only",
    code: "npx -y @agent-lint/mcp",
  },
] as const;

const PROMPT_EXAMPLES = [
  "Review this repo's agent context files, fix anything stale or missing, and apply safe context-artifact updates directly.",
  "I changed module structure and CI config. Update only the context files affected by those changes.",
  "Add a persistent maintenance rule so AGENTS.md, rules, skills, workflows, and plans stay current after future structural changes.",
] as const;

function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(text)}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-brand-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function QuickstartSection() {
  return (
    <section className="px-4 py-20 sm:px-6" id="quickstart">
      <div className="mx-auto max-w-4xl">
        <FadeUp>
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Get Started
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          One command to start. Zero config required.
        </p>
        </FadeUp>

        <Stagger className="grid gap-4 sm:grid-cols-3">
          {CODE_BLOCKS.map((block) => (
            <StaggerItem key={block.title}><TerminalFrame title={block.title}>
              <div className="flex items-start justify-between gap-2 p-3">
                <pre className="overflow-x-auto text-xs text-foreground">
                  <code>{block.code}</code>
                </pre>
                <CopyButton text={block.code} />
              </div>
            </TerminalFrame></StaggerItem>
          ))}
        </Stagger>

        <FadeUp>
        <div className="mt-16">
          <h3 className="mb-6 text-center text-xl font-semibold">
            Try These Prompts
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {PROMPT_EXAMPLES.map((prompt, i) => (
              <div
                key={i}
                className="group relative rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <CopyButton text={prompt} />
                </div>
                <p className="pr-6 text-sm italic text-muted-foreground">
                  &ldquo;{prompt}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
        </FadeUp>
      </div>
    </section>
  );
}
