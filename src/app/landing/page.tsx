import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Agent Lint
        </p>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Build safer and sharper context files for AI coding agents.
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground">
          Analyze AGENTS.md, Rules, Skills, Workflows, and Plans with scoring,
          diff-based fixes, and guardrails against risky instructions.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Open Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              View Source
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
