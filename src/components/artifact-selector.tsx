"use client";

import type { ComponentType } from "react";
import { Blocks, FileCode2, ShieldCheck, WandSparkles, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";
import { artifactTypeValues, type ArtifactType } from "@/lib/artifacts";

const artifactMeta: Record<
  ArtifactType,
  {
    title: string;
    shortTitle: string;
    icon: ComponentType<{ className?: string }>;
  }
> = {
  skills: {
    title: "Skills",
    shortTitle: "Skills",
    icon: WandSparkles,
  },
  agents: {
    title: "AGENTS.md",
    shortTitle: "Agents",
    icon: FileCode2,
  },
  rules: {
    title: "Rules",
    shortTitle: "Rules",
    icon: ShieldCheck,
  },
  workflows: {
    title: "Workflows",
    shortTitle: "Flows",
    icon: Workflow,
  },
  plans: {
    title: "Great Plans",
    shortTitle: "Plans",
    icon: Blocks,
  },
};

type ArtifactSelectorProps = {
  selected: ArtifactType;
  onSelect: (next: ArtifactType) => void;
};

export function ArtifactSelector({ selected, onSelect }: ArtifactSelectorProps) {
  return (
    <div className="relative">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border/40 bg-background/50 p-1 backdrop-blur-sm scrollbar-none">
        {artifactTypeValues.map((type) => {
          const meta = artifactMeta[type];
          const isSelected = type === selected;
          const Icon = meta.icon;

          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-250 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isSelected
                  ? "bg-card text-foreground shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_0_16px_-6px_color-mix(in_oklch,var(--primary),transparent_60%)]"
                  : "text-muted-foreground hover:bg-card/50",
              )}
            >
              <Icon className={cn("size-4 shrink-0 transition-colors", isSelected ? "text-primary" : "text-muted-foreground/70")} />
              <span className="hidden sm:inline">{meta.title}</span>
              <span className="sm:hidden">{meta.shortTitle}</span>
              {isSelected && (
                <span
                  aria-hidden
                  className="absolute inset-x-2 -bottom-[5px] h-[2px] rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
