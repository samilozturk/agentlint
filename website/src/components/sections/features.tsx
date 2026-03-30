import { Terminal, Wrench, Database, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
}

const FEATURES: FeatureItem[] = [
  {
    icon: <Terminal className="h-6 w-6" />,
    title: "CLI Commands",
    description: "Scan, score, and maintain context from the terminal.",
    items: [
      "init — Set up MCP config for all supported IDE clients",
      "scan — Discover artifacts and generate maintenance reports",
      "prompt — Print a ready-to-paste prompt for your IDE chat",
      "score — Score artifacts against 12 quality dimensions",
    ],
  },
  {
    icon: <Wrench className="h-6 w-6" />,
    title: "MCP Tools",
    description: "5 tools your coding agent can call directly.",
    items: [
      "get_guidelines — Artifact-specific guidance",
      "plan_workspace_autofix — Step-by-step fix plans",
      "quick_check — Detect when context needs updates",
      "emit_maintenance_snippet — Reusable snippets",
      "score_artifact — 12-dimension quality scoring",
    ],
  },
  {
    icon: <Database className="h-6 w-6" />,
    title: "MCP Resources",
    description: "3 readable resources for agent context.",
    items: [
      "guidelines/{type} — Structured guidance per artifact type",
      "template/{type} — Skeleton templates for new artifacts",
      "path-hints/{type} — File discovery hints per IDE client",
    ],
  },
  {
    icon: <Monitor className="h-6 w-6" />,
    title: "13+ IDE Clients",
    description: "Works with every major coding agent.",
    items: [
      "Claude Code, Claude Desktop, Codex",
      "Cursor, Windsurf, VS Code, Kiro",
      "Kilo Code, Cline, Roo Code",
      "Zed, OpenCode, Antigravity",
    ],
  },
];

export function FeaturesSection() {
  return (
    <section className="px-4 py-20 sm:px-6" id="features">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Everything You Need
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          CLI commands, MCP tools, MCP resources, and broad IDE support — all
          working together to keep your agent context healthy.
        </p>
        </FadeUp>

        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title}><Card
              key={feature.title}
              className="group relative overflow-hidden border-border/50 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-700/5"
            >
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent transition-colors duration-300 group-hover:border-brand-700/30" />
              <CardHeader className="pb-3">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700/10 text-brand-700">
                  {feature.icon}
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {feature.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-600" />
                      <span className="font-mono">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card></StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
