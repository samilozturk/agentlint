"use client";

import {
  History,
  PenTool,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import type { WorkbenchTab } from "@/components/editor-workbench";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Workspace",
    icon: PenTool,
    tab: "compose",
  },
  {
    title: "Review",
    icon: Sparkles,
    tab: "review",
  },
  {
    title: "History",
    icon: History,
    tab: "history",
  },
] as const;

const highlights = [
  {
    label: "Safety-first",
    description: "Catch destructive or risky instructions before they ship.",
    icon: ShieldCheck,
  },
  {
    label: "Sharper outputs",
    description: "Explainable diffs and scoring make every revision actionable.",
    icon: Sparkles,
  },
  {
    label: "Workflow ready",
    description: "AGENTS, rules, workflows, skills, and plans — all covered.",
    icon: Workflow,
  },
];

type AppSidebarProps = {
  activeTab: WorkbenchTab;
  onNavigate: (tab: WorkbenchTab) => void;
};

export function AppSidebar({ activeTab, onNavigate }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  function handleNavigate(tab: WorkbenchTab) {
    onNavigate(tab);
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/" className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <PenTool className="size-4" />
                </div>
                <span className="text-sm font-semibold font-display group-data-[collapsible=icon]:hidden">
                  Agent Lint
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="mx-2" />

      <SidebarContent className="overflow-x-hidden md:overflow-y-visible">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={activeTab === item.tab}
                      tooltip={item.title}
                      onClick={() => handleNavigate(item.tab)}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="size-4" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Highlights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      className="h-auto items-start gap-3 py-2"
                      tooltip={`${item.label}: ${item.description}`}
                    >
                      <Icon className="size-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                        <span className="text-xs font-semibold">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-2">
                          {item.description}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-2" />

      <SidebarFooter className="pb-4">
        <div className="flex items-center justify-between rounded-md border border-border/60 bg-card/65 p-2 group-data-[collapsible=icon]:justify-center">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
            Appearance
          </span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
