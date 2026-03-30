import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TerminalFrame } from "@/components/terminal-frame";
import { FadeUp } from "@/components/motion";

const DEMOS = [
  {
    id: "scan",
    label: "Scan",
    description:
      "Discover all context artifacts in your workspace — AGENTS.md, rules, skills, workflows, and plans — with a single command.",
    image: "screenshots/demo-scan.png",
  },
  {
    id: "init",
    label: "Init",
    description:
      "Set up MCP config for all supported IDE clients. Detects existing configs and only writes what's missing.",
    image: "screenshots/demo-init.png",
  },
  {
    id: "prompt",
    label: "Prompt",
    description:
      "Generate a ready-to-paste prompt for your IDE chat. Uses workspace findings and local change signals.",
    image: "screenshots/demo-prompt.png",
  },
  {
    id: "help",
    label: "Help",
    description:
      "Quick access to all CLI commands and options at a glance.",
    image: "screenshots/demo-help.png",
  },
] as const;

export function DemoSection() {
  return (
    <section className="px-4 py-20 sm:px-6" id="demo">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          See It in Action
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          From workspace scanning to ready-to-paste prompts — all from your terminal.
        </p>
        </FadeUp>

        <FadeUp delay={0.2}>
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-4">
            {DEMOS.map((demo) => (
              <TabsTrigger key={demo.id} value={demo.id} className="text-xs sm:text-sm">
                {demo.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {DEMOS.map((demo) => (
            <TabsContent key={demo.id} value={demo.id}>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                {demo.description}
              </p>
              <TerminalFrame title={`agent-lint ${demo.id}`}>
                <img
                  src={`${import.meta.env.BASE_URL}${demo.image}`}
                  alt={`Agent Lint ${demo.label} command demo`}
                  className="w-full rounded-b-lg"
                  loading="lazy"
                />
              </TerminalFrame>
            </TabsContent>
          ))}
        </Tabs>
        </FadeUp>
      </div>
    </section>
  );
}
