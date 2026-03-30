import { XCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";

const WITHOUT_ITEMS = [
  "AGENTS.md starts as a one-off prompt dump and quietly goes stale.",
  "New scripts, modules, and workflows land, but agent context never catches up.",
  "Each developer invents their own rules format, so agent behavior drifts across repos.",
  "Nobody can tell whether a context file is actually actionable, safe, or complete.",
  "Agents keep re-generating generic boilerplate that burns tokens and misses project specifics.",
];

const WITH_ITEMS = [
  "Artifact-specific guidance tells the agent what good looks like before it edits anything.",
  "Workspace scanning finds missing types, incomplete files, stale references, and weak context.",
  "quick_check flags when structural changes mean your agent instructions need maintenance.",
  "Shared conventions make context quality reviewable instead of subjective.",
  "Maintenance snippets turn context hygiene into a repeatable developer workflow.",
];

export function ComparisonSection() {
  return (
    <section className="px-4 py-20 sm:px-6" id="comparison">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Why Agent Lint?
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Context drift is real. Without a standard, agent context files break silently.
        </p>
        </FadeUp>

        <Stagger className="grid gap-6 md:grid-cols-2">
          <StaggerItem><Card className="border-destructive/20 bg-destructive/[0.03] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <XCircle className="h-5 w-5 text-destructive" />
                Without Agent Lint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {WITHOUT_ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card></StaggerItem>

          <StaggerItem><Card className="border-brand-700/30 bg-brand-700/[0.03] shadow-lg shadow-brand-700/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-brand-600" />
                <span className="bg-linear-to-r from-brand-700 to-brand-400 bg-clip-text text-transparent">
                  With Agent Lint
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {WITH_ITEMS.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card></StaggerItem>
        </Stagger>
      </div>
    </section>
  );
}
