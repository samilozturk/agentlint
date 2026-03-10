import { parseTuiCommand } from "../src/index.js";

describe("parseTuiCommand", () => {
  // ── TUI-eligible commands ──────────────────────────────────────────────

  it("parses bare 'init' as a TUI command", () => {
    const result = parseTuiCommand(["init"]);
    expect(result).toEqual({
      command: "init",
      appProps: { initialCommand: "init" },
    });
  });

  it("parses bare 'doctor' as a TUI command", () => {
    const result = parseTuiCommand(["doctor"]);
    expect(result).toEqual({
      command: "doctor",
      appProps: { initialCommand: "doctor" },
    });
  });

  it("parses bare 'prompt' as a TUI command", () => {
    const result = parseTuiCommand(["prompt"]);
    expect(result).toEqual({
      command: "prompt",
      appProps: { initialCommand: "prompt" },
    });
  });

  // ── Init with flags ────────────────────────────────────────────────────

  it("parses 'init --all' with command options", () => {
    const result = parseTuiCommand(["init", "--all"]);
    expect(result).toEqual({
      command: "init",
      appProps: {
        initialCommand: "init",
        commandOptions: { init: { all: true } },
      },
    });
  });

  it("parses 'init --yes' with command options", () => {
    const result = parseTuiCommand(["init", "--yes"]);
    expect(result).toEqual({
      command: "init",
      appProps: {
        initialCommand: "init",
        commandOptions: { init: { yes: true } },
      },
    });
  });

  it("parses 'init -y' with command options", () => {
    const result = parseTuiCommand(["init", "-y"]);
    expect(result).toEqual({
      command: "init",
      appProps: {
        initialCommand: "init",
        commandOptions: { init: { yes: true } },
      },
    });
  });

  it("parses 'init --all --yes' with combined options", () => {
    const result = parseTuiCommand(["init", "--all", "--yes"]);
    expect(result).toEqual({
      command: "init",
      appProps: {
        initialCommand: "init",
        commandOptions: { init: { all: true, yes: true } },
      },
    });
  });

  it("parses 'init --with-rules' with command options", () => {
    const result = parseTuiCommand(["init", "--with-rules"]);
    expect(result).toEqual({
      command: "init",
      appProps: {
        initialCommand: "init",
        commandOptions: { init: { withRules: true } },
      },
    });
  });

  // ── Doctor with flags ───────────────────────────────────────────────────

  it("parses 'doctor --save-report' with command options", () => {
    const result = parseTuiCommand(["doctor", "--save-report"]);
    expect(result).toEqual({
      command: "doctor",
      appProps: {
        initialCommand: "doctor",
        commandOptions: { doctor: { saveReport: true } },
      },
    });
  });

  // ── Non-interactive flags bail to Commander.js ─────────────────────────

  it("returns null for 'init --stdout'", () => {
    expect(parseTuiCommand(["init", "--stdout"])).toBeNull();
  });

  it("returns null for 'doctor --stdout'", () => {
    expect(parseTuiCommand(["doctor", "--stdout"])).toBeNull();
  });

  it("returns null for 'doctor --json'", () => {
    expect(parseTuiCommand(["doctor", "--json"])).toBeNull();
  });

  it("returns null for 'prompt --stdout'", () => {
    expect(parseTuiCommand(["prompt", "--stdout"])).toBeNull();
  });

  it("returns null for 'init --help'", () => {
    expect(parseTuiCommand(["init", "--help"])).toBeNull();
  });

  it("returns null for 'doctor -h'", () => {
    expect(parseTuiCommand(["doctor", "-h"])).toBeNull();
  });

  // ── Unknown commands/flags bail to Commander.js ────────────────────────

  it("returns null for unknown command", () => {
    expect(parseTuiCommand(["unknown"])).toBeNull();
  });

  it("returns null for '--version'", () => {
    expect(parseTuiCommand(["--version"])).toBeNull();
  });

  it("returns null for '--help'", () => {
    expect(parseTuiCommand(["--help"])).toBeNull();
  });

  it("returns null for empty argv", () => {
    expect(parseTuiCommand([])).toBeNull();
  });

  it("returns null for 'doctor' with unknown flag", () => {
    expect(parseTuiCommand(["doctor", "--unknown"])).toBeNull();
  });

  it("returns null for 'prompt' with unknown flag", () => {
    expect(parseTuiCommand(["prompt", "--verbose"])).toBeNull();
  });

  it("returns null for 'init' with unknown flag", () => {
    expect(parseTuiCommand(["init", "--force"])).toBeNull();
  });
});
