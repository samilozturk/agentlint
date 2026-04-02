import { Settings, Search, MessageSquare } from "lucide-react";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";

const STEPS = [
  {
    icon: <Settings className="h-6 w-6" />,
    command: "agent-lint init",
    title: "Connect MCP",
    description: "Set up MCP config for your IDE clients. Detects existing configs automatically.",
  },
  {
    icon: <Search className="h-6 w-6" />,
    command: "agent-lint scan",
    title: "Scan Workspace",
    description: "Discover artifacts, flag missing types, stale references, and weak context files.",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    command: "agent-lint prompt",
    title: "Hand Off to IDE",
    description: "Get a ready-to-paste prompt that uses workspace findings for targeted maintenance.",
  },
] as const;

export function WorkflowSection() {
  return (
    <section className="section-offscreen px-4 py-20 sm:px-6" id="workflow">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          How It Works
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-center text-muted-foreground">
          Three commands. That&apos;s all it takes to keep your agent context healthy.
        </p>
        </FadeUp>

        <Stagger className="relative grid gap-8 md:grid-cols-3 md:gap-12">
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-linear-to-r from-transparent via-brand-600/30 to-transparent md:block" />

          {STEPS.map((step, i) => (
            <StaggerItem key={step.command}><div className="relative text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-700/20 bg-brand-700/10 text-brand-700 shadow-lg shadow-brand-700/5">
                <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                  {i + 1}
                </div>
                {step.icon}
              </div>
              <code className="mb-2 inline-block rounded-md bg-muted px-2 py-1 text-xs font-medium text-brand-700">
                {step.command}
              </code>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div></StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
