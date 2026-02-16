"use client";

import { useState } from "react";
import {
  GitCompareArrows,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  EditorWorkbench,
  type WorkbenchTab,
} from "@/components/editor-workbench";
import { AppSidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const quickNotes = [
  {
    label: "Safety-first",
    icon: ShieldCheck,
  },
  {
    label: "Sharper outputs",
    icon: Sparkles,
  },
  {
    label: "Workflow ready",
    icon: Workflow,
  },
  {
    label: "Explainable diffs",
    icon: GitCompareArrows,
  },
];

export function HomeShell() {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("compose");

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar activeTab={activeTab} onNavigate={setActiveTab} />
      <SidebarInset className="min-h-svh bg-transparent">
        <header className="sticky top-0 z-20 border-b border-border/40 bg-background/85 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
            <SidebarTrigger className="text-muted-foreground" />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                Agent Lint Studio
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Score, refine, and export safer context artifacts.
              </p>
            </div>
          </div>
        </header>

        <main className="app-shell flex flex-1 flex-col gap-4 py-5 sm:gap-5 sm:py-6">
          <section
            id="workspace"
            className="panel-glow animate-rise relative overflow-hidden rounded-xl border border-border/50 bg-card/75 p-5 sm:p-6"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-primary/12 blur-3xl"
            />
            <div className="relative flex flex-col gap-3">
              <h1 className="max-w-4xl text-2xl font-bold tracking-tight text-balance sm:text-3xl font-display">
                Build instructions agents can trust.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Analyze AGENTS, rules, workflows, skills, and plans with
                explainable scoring and revision diffs.
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {quickNotes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Badge
                      key={item.label}
                      variant="outline"
                      className="gap-1.5 border-border/60 bg-background/55 px-2.5 py-1 text-[11px]"
                    >
                      <Icon className="size-3" />
                      {item.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </section>

          <EditorWorkbench
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
