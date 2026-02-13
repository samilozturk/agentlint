"use client";

import type { ComponentType } from "react";
import { Blocks, FileCode2, ShieldCheck, WandSparkles, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { artifactTypeValues, type ArtifactType } from "@/lib/artifacts";

const artifactCards: Record<
  ArtifactType,
  {
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    accentClass: string;
  }
> = {
  skills: {
    title: "Skills",
    description: "Tool definitions and capability constraints.",
    icon: WandSparkles,
    accentClass: "from-chart-1/20 to-chart-2/15",
  },
  agents: {
    title: "AGENTS.md",
    description: "Repository context and operating instructions.",
    icon: FileCode2,
    accentClass: "from-chart-3/20 to-chart-1/15",
  },
  rules: {
    title: "Rules",
    description: "Global and workspace coding guardrails.",
    icon: ShieldCheck,
    accentClass: "from-chart-2/20 to-chart-4/15",
  },
  workflows: {
    title: "Workflows",
    description: "Slash commands and execution automations.",
    icon: Workflow,
    accentClass: "from-chart-4/20 to-chart-5/15",
  },
  plans: {
    title: "Great Plans",
    description: "Phased execution plans and milestones.",
    icon: Blocks,
    accentClass: "from-chart-5/20 to-chart-3/15",
  },
};

type ArtifactSelectorProps = {
  selected: ArtifactType;
  onSelect: (next: ArtifactType) => void;
};

export function ArtifactSelector({ selected, onSelect }: ArtifactSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {artifactTypeValues.map((type) => {
        const card = artifactCards[type];
        const isSelected = type === selected;
        const Icon = card.icon;

        return (
          <Button
            key={type}
            type="button"
            variant="outline"
            className={cn(
              "relative h-auto flex-col items-start gap-3 overflow-hidden rounded-2xl border-border/65 bg-card/70 p-4 text-left shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card",
              isSelected &&
                "border-primary/60 bg-primary/10 text-foreground shadow-[0_15px_45px_-35px_color-mix(in_oklch,var(--primary),black_20%)]",
            )}
            onClick={() => onSelect(type)}
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
                card.accentClass,
                isSelected && "opacity-100",
              )}
            />
            <span className="relative flex w-full items-start justify-between gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background/80">
                <Icon className="size-4" />
              </span>
              {isSelected ? <Badge>Active</Badge> : null}
            </span>
            <span className="relative text-sm font-semibold">{card.title}</span>
            <span className="relative text-xs leading-relaxed text-muted-foreground">
              {card.description}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
