import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FileCode2,
  GitCompareArrows,
  Gauge,
  ShieldAlert,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: FileCode2,
    title: "5 Artifact Types",
    description: "Skills, AGENTS.md, Rules, Workflows, and Great Plans — all evaluated with type-specific prompts.",
  },
  {
    icon: Gauge,
    title: "Judge & Score",
    description: "Clarity, safety, token efficiency, and completeness scored 0-100 with detailed breakdowns.",
  },
  {
    icon: GitCompareArrows,
    title: "Diff Viewer",
    description: "Side-by-side before/after with color-coded additions and deletions. Copy or export in one click.",
  },
  {
    icon: ShieldAlert,
    title: "Security Gate",
    description: "Catches prompt injection risks, force-push permissions, and overly verbose context files.",
  },
];

const steps = [
  { number: "01", title: "Select", description: "Choose your artifact type and paste content or load a template." },
  { number: "02", title: "Analyze", description: "The judge evaluates against best-practice standards." },
  { number: "03", title: "Perfect", description: "Review the scored diff, apply fixes, and export." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen text-foreground">
      <div className="app-shell flex flex-col gap-16 sm:gap-20">

        {/* ── Hero ───────────────────────────────────────── */}
        <section className="animate-rise relative">
          <div className="panel-glow relative overflow-hidden rounded-xl border border-border/50 bg-card/80 px-6 py-12 sm:px-10 sm:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-[80px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-32 left-1/4 size-64 rounded-full bg-accent/8 blur-[60px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-12 top-1/2 h-px w-48 -rotate-12 bg-gradient-to-r from-primary/30 to-transparent"
            />

            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <Badge className="text-[10px]">Context Quality Suite</Badge>
                <ThemeToggle />
              </div>

              <h1 className="mt-8 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-[family-name:var(--font-display)]">
                Give every coding agent a{" "}
                <span className="text-primary">cleaner, safer</span>{" "}
                operating manual.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Agent Lint analyzes context artifacts, scores clarity and safety,
                then proposes precise revisions with an explainable diff.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/">
                    Open Dashboard
                    <Sparkles className="size-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://github.com" target="_blank" rel="noreferrer">
                    View Source
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────── */}
        <section className="animate-rise-delay-1">
          <div className="mb-8 max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
              Capabilities
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl font-[family-name:var(--font-display)]">
              Everything you need to lint agent context.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className={`group panel-glow rounded-xl border border-border/50 bg-card/70 p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_24px_-8px_color-mix(in_oklch,var(--primary),transparent_55%)] ${
                    i < 2 ? "animate-rise-delay-2" : "animate-rise-delay-3"
                  }`}
                >
                  <span className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="text-sm font-semibold font-[family-name:var(--font-display)]">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────── */}
        <section className="animate-rise-delay-2">
          <div className="mb-8 max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
              Workflow
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl font-[family-name:var(--font-display)]">
              Three steps to perfection.
            </h2>
          </div>

          <div className="relative grid gap-6 sm:grid-cols-3">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border/50 to-transparent sm:block"
            />
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <span className="mb-3 inline-flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 font-mono text-sm font-bold text-primary">
                  {step.number}
                </span>
                <h3 className="text-base font-bold font-[family-name:var(--font-display)]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────── */}
        <section className="animate-rise-delay-3">
          <div className="forge-glow rounded-xl border border-border/50 bg-card/80 p-8 text-center sm:p-12">
            <WandSparkles className="mx-auto mb-4 size-8 text-primary animate-glow-pulse" />
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-[family-name:var(--font-display)]">
              Ready to lint your agent context?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Start analyzing Skills, AGENTS.md, Rules, Workflows, and Plans in seconds.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/">
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────── */}
        <footer className="animate-rise-delay-4 pb-6">
          <Separator className="mb-6 bg-border/30" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              Built with Next.js, tRPC, Drizzle & shadcn/ui.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px]">Next.js 16</Badge>
              <Badge variant="outline" className="text-[9px]">TypeScript</Badge>
              <Badge variant="outline" className="text-[9px]">Tailwind v4</Badge>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
