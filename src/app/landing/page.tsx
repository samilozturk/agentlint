import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen text-foreground">
      <div className="app-shell">
        <section className="panel-glow animate-rise rounded-3xl border border-border/70 bg-card/78 px-6 py-10 sm:px-10 sm:py-14">
          <Badge className="mb-5">Product Intro</Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl font-[family-name:var(--font-display)]">
            Give every coding agent a cleaner, safer operating manual.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Agent Lint analyzes context artifacts, scores clarity and safety, then proposes
            precise revisions with an explainable diff.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">
                Open Dashboard
                <Sparkles className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://github.com" target="_blank" rel="noreferrer">
                View Source
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <p className="rounded-xl border border-border/65 bg-background/75 p-3">
              Scans Skills, AGENTS, Rules, Workflows, and Plans.
            </p>
            <p className="rounded-xl border border-border/65 bg-background/75 p-3">
              Blocks risky exports with markdown and YAML safety checks.
            </p>
            <p className="rounded-xl border border-border/65 bg-background/75 p-3">
              Ships with Next.js, tRPC, Drizzle, and Tailwind + shadcn.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
