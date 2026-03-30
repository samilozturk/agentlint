import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="px-4 pb-8 pt-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Separator className="mb-8" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            <span className="bg-linear-to-r from-brand-700 via-brand-500 to-brand-200 bg-clip-text text-transparent">
              AGENT LINT
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href="https://github.com/samilozturk/agentlint"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@agent-lint/cli"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              npm
            </a>
            <a
              href="https://gitlab.com/bsamilozturk/agentlint"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              GitLab
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            MIT License
          </p>
        </div>
      </div>
    </footer>
  );
}
