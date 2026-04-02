import { Shield, Eye, Feather } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";

const GUARANTEES = [
  {
    icon: <Shield className="h-7 w-7" />,
    title: "Local-first",
    description: "No hosted LLM, no database, no auth layer. Everything runs on your machine.",
  },
  {
    icon: <Eye className="h-7 w-7" />,
    title: "Read-only MCP",
    description: "Agent Lint returns guidance. Your client agent makes all repository changes.",
  },
  {
    icon: <Feather className="h-7 w-7" />,
    title: "Lightweight",
    description: "Separate CLI and MCP packages, minimal dependencies, strict TypeScript throughout.",
  },
] as const;

export function GuaranteesSection() {
  return (
    <section className="section-offscreen px-4 py-20 sm:px-6" id="guarantees">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Core Guarantees
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Designed with security and simplicity at the core.
        </p>
        </FadeUp>

        <Stagger className="grid gap-6 md:grid-cols-3">
          {GUARANTEES.map((item) => (
            <StaggerItem key={item.title}><Card
              key={item.title}
              className="group relative overflow-hidden border-brand-700/10 shadow-md transition-all duration-300 hover:shadow-xl hover:shadow-brand-700/5"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-500/50 to-transparent" />
              <CardContent className="pt-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-700/10 text-brand-700 transition-colors group-hover:bg-brand-700/20">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card></StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
