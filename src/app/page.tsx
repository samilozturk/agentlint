import { ShieldCheck, Sparkles, Workflow } from "lucide-react";

import { EditorWorkbench } from "@/components/editor-workbench";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

const highlights = [
  {
    label: "Safety-first",
    description: "Catch destructive or risky instructions before they ship.",
    icon: ShieldCheck,
  },
  {
    label: "Sharper outputs",
    description: "Explainable diffs and scoring make every revision actionable.",
    icon: Sparkles,
  },
  {
    label: "Workflow ready",
    description: "AGENTS, rules, workflows, skills, and plans — all covered.",
    icon: Workflow,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen text-foreground">
      <div className="app-shell flex flex-col gap-6 sm:gap-8">
        <header className="animate-rise">
          <div className="panel-glow relative overflow-hidden rounded-xl border border-border/50 bg-card/80 p-6 sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/8 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-accent/6 blur-3xl"
            />

            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                  Agent Lint
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl font-[family-name:var(--font-display)]">
                  Build instructions
                  <br />
                  <span className="text-primary">agents can trust.</span>
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Analyze context artifacts, score clarity and safety, then get
                  precise revisions with an explainable diff.
                </p>
              </div>
              <ThemeToggle />
            </div>

            <Separator className="my-6 bg-border/30" />

            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`group flex items-start gap-3 ${i === 0 ? "animate-rise-delay-1" : i === 1 ? "animate-rise-delay-2" : "animate-rise-delay-3"}`}
                  >
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Icon className="size-3.5" />
                    </span>
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wider font-[family-name:var(--font-display)]">
                        {item.label}
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <section className="animate-rise-delay-2">
          <EditorWorkbench />
        </section>
      </div>
    </main>
  );
}
