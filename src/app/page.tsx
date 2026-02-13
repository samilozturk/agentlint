import { EditorWorkbench } from "@/components/editor-workbench";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Phase 1 - Setup</p>
            <h1 className="text-3xl font-semibold tracking-tight">Agent Lint</h1>
          </div>
          <ThemeToggle />
        </header>

        <section className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Bootstrapped stack</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>Next.js App Router + TypeScript</li>
            <li>Tailwind CSS v4 + Shadcn UI</li>
            <li>Drizzle ORM + SQLite (libSQL)</li>
            <li>tRPC API layer with React Query</li>
          </ul>
        </section>

        <EditorWorkbench />
      </div>
    </main>
  );
}
