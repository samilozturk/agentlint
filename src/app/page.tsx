import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Workflow } from "lucide-react";

import { EditorWorkbench } from "@/components/editor-workbench";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const highlights = [
  {
    label: "Safety-first",
    description: "Prompt and export checks catch destructive or risky instructions early.",
    icon: ShieldCheck,
  },
  {
    label: "Sharper outputs",
    description: "Judge feedback and diff view make revisions explainable and actionable.",
    icon: Sparkles,
  },
  {
    label: "Workflow ready",
    description: "Works with AGENTS, rules, workflows, skills, and execution plans.",
    icon: Workflow,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen text-foreground">
      <div className="app-shell flex flex-col gap-6 sm:gap-8">
        <header className="animate-rise panel-glow rounded-3xl border border-border/70 bg-card/75 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Agent Lint / Context Quality Suite
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl font-[family-name:var(--font-display)]">
                Build instructions agents can trust.
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <section className="animate-rise-delay grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="panel-glow rounded-3xl border border-border/70 bg-card/80 p-5 sm:p-6">
            <Badge className="mb-4">Phase 1 Dashboard</Badge>
            <p className="max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              Analyze AGENTS, rules, skills, and plans through one modern workbench designed
              for safe automation.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button>
                Start Reviewing
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" asChild>
                <Link href="/landing">Open Marketing Page</Link>
              </Button>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.label}
                  className="panel-glow rounded-2xl border border-border/70 bg-card/70 p-4"
                >
                  <span className="mb-2 inline-flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] font-[family-name:var(--font-display)]">
                    {item.label}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel-glow animate-rise rounded-3xl border border-border/70 bg-card/65 p-3 shadow-none sm:p-4 md:p-6">
          <EditorWorkbench />
        </section>
      </div>
    </main>
  );
}
