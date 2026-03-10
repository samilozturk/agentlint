import React, { useState, useCallback, useRef } from "react";
import { Box, useApp } from "ink";
import { Banner, Divider } from "./ui/components.js";
import { MainMenu, type MenuCommand } from "./ui/main-menu.js";
import { NextAction, type NextActionContext, type NextActionChoice } from "./ui/next-action.js";
import { InitWizard, type ClientInstallResult } from "./commands/init.js";
import { DoctorApp, type DoctorResult } from "./commands/doctor.js";
import { PromptApp, type PromptResult } from "./commands/prompt.js";

// ── Types ──────────────────────────────────────────────────────────────

type AppScreen =
  | { type: "menu" }
  | { type: "command"; command: MenuCommand }
  | { type: "next-action"; context: NextActionContext };

export interface InitCommandOptions {
  yes?: boolean;
  all?: boolean;
  withRules?: boolean;
}

export interface DoctorCommandOptions {
  saveReport?: boolean;
}

export interface AppProps {
  /** Pre-navigate to a command on launch (skips MainMenu) */
  initialCommand?: MenuCommand;
  /** Options for the initial command (consumed once, then cleared) */
  commandOptions?: {
    init?: InitCommandOptions;
    doctor?: DoctorCommandOptions;
  };
}

// ── App Component ──────────────────────────────────────────────────────

export function App({ initialCommand, commandOptions }: AppProps): React.ReactNode {
  const { exit } = useApp();

  // When initialCommand is provided, start directly at that command screen
  const [screen, setScreen] = useState<AppScreen>(
    initialCommand && initialCommand !== "exit"
      ? { type: "command", command: initialCommand }
      : { type: "menu" },
  );

  // Track whether the initial commandOptions have been consumed.
  // Once consumed, subsequent navigations to the same command use default options.
  const initialOptionsConsumed = useRef(false);

  /** Return init options — uses commandOptions.init on the first call, then {} */
  const getInitOptions = useCallback((): InitCommandOptions => {
    if (!initialOptionsConsumed.current && commandOptions?.init) {
      initialOptionsConsumed.current = true;
      return commandOptions.init;
    }
    return {};
  }, [commandOptions]);

  /** Return doctor options — uses commandOptions.doctor on the first call, then {} */
  const getDoctorOptions = useCallback((): DoctorCommandOptions => {
    if (!initialOptionsConsumed.current && commandOptions?.doctor) {
      initialOptionsConsumed.current = true;
      return commandOptions.doctor;
    }
    return {};
  }, [commandOptions]);

  // ── Menu Selection ─────────────────────────────────────────────────

  const handleMenuSelect = useCallback((command: MenuCommand) => {
    if (command === "exit") {
      exit();
      return;
    }
    setScreen({ type: "command", command });
  }, [exit]);

  // ── Command Completion Callbacks ───────────────────────────────────

  const handleInitComplete = useCallback((results: ClientInstallResult[]) => {
    const created = results.some(
      (r) => r.configResult.status === "created" ||
        r.configResult.status === "merged" ||
        r.configResult.status === "cli-success",
    );
    setScreen({
      type: "next-action",
      context: {
        completedCommand: "init",
        initCreatedConfigs: created,
      },
    });
  }, []);

  const handleDoctorComplete = useCallback((_result: DoctorResult) => {
    setScreen({
      type: "next-action",
      context: {
        completedCommand: "doctor",
      },
    });
  }, []);

  const handlePromptComplete = useCallback((_result: PromptResult) => {
    setScreen({
      type: "next-action",
      context: {
        completedCommand: "prompt",
      },
    });
  }, []);

  // ── Next Action Selection ──────────────────────────────────────────

  const handleNextAction = useCallback((choice: NextActionChoice) => {
    if (choice === "exit") {
      exit();
      return;
    }
    if (choice === "menu") {
      setScreen({ type: "menu" });
      return;
    }
    // Navigate to selected command
    setScreen({ type: "command", command: choice });
  }, [exit]);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <Box flexDirection="column">
      {/* Banner — shown once at the top, always visible */}
      <Banner />
      <Divider />

      {/* Menu Screen */}
      {screen.type === "menu" && (
        <MainMenu onSelect={handleMenuSelect} />
      )}

      {/* Command Screens (embedded mode — no banner, with onComplete) */}
      {screen.type === "command" && screen.command === "init" && (
        <InitWizard
          options={getInitOptions()}
          onComplete={handleInitComplete}
          showBanner={false}
        />
      )}

      {screen.type === "command" && screen.command === "doctor" && (
        <DoctorApp
          onComplete={handleDoctorComplete}
          showBanner={false}
          saveReport={getDoctorOptions().saveReport}
        />
      )}

      {screen.type === "command" && screen.command === "prompt" && (
        <PromptApp
          onComplete={handlePromptComplete}
          showBanner={false}
        />
      )}

      {/* Next Action Screen */}
      {screen.type === "next-action" && (
        <NextAction
          context={screen.context}
          onSelect={handleNextAction}
        />
      )}
    </Box>
  );
}
