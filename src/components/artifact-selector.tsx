"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { artifactTypeValues, type ArtifactType } from "@/lib/artifacts";

const artifactCards: Record<ArtifactType, { title: string; description: string }> = {
  skills: {
    title: "Skills",
    description: "Tool definitions and capability constraints.",
  },
  agents: {
    title: "AGENTS.md",
    description: "Repository context and operating instructions.",
  },
  rules: {
    title: "Rules",
    description: "Global and workspace coding guardrails.",
  },
  workflows: {
    title: "Workflows",
    description: "Slash commands and execution automations.",
  },
  plans: {
    title: "Great Plans",
    description: "Phased execution plans and milestones.",
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

        return (
          <Button
            key={type}
            type="button"
            variant="outline"
            className={cn(
              "h-auto flex-col items-start gap-1 rounded-xl p-4 text-left",
              isSelected &&
                "border-primary bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20",
            )}
            onClick={() => onSelect(type)}
          >
            <span className="text-sm font-semibold">{card.title}</span>
            <span className="text-xs text-muted-foreground">{card.description}</span>
          </Button>
        );
      })}
    </div>
  );
}
