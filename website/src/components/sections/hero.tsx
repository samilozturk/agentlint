import { useEffect, useState } from "react";
import { Copy, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/hooks/use-copy";
import { FadeUp, FadeIn } from "@/components/motion";

const BANNER_AGENT = [
  " █████╗  ██████╗ ███████╗███╗   ██╗████████╗",
  "██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝",
  "███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ",
  "██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ",
  "██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ",
  "╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ",
];

const BANNER_LINT = [
  "██╗     ██╗███╗   ██╗████████╗",
  "██║     ██║████╗  ██║╚══██╔══╝",
  "██║     ██║██╔██╗ ██║   ██║   ",
  "██║     ██║██║╚██╗██║   ██║   ",
  "███████╗██║██║ ╚████║   ██║   ",
  "╚══════╝╚═╝╚═╝  ╚═══╝   ╚═╝   ",
];

const INSTALL_CMD = "npx @agent-lint/cli";

const TYPING_LINES = [
  "$ agent-lint init",
  "$ agent-lint scan",
  "$ agent-lint prompt",
];

function TypingAnimation() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentLine = TYPING_LINES[lineIndex];
    if (!currentLine) return;

    if (!isDeleting && charIndex < currentLine.length) {
      const timeout = setTimeout(() => setCharIndex((c) => c + 1), 60);
      return () => clearTimeout(timeout);
    }

    if (!isDeleting && charIndex === currentLine.length) {
      const timeout = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charIndex > 0) {
      const timeout = setTimeout(() => setCharIndex((c) => c - 1), 30);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charIndex === 0) {
      const timeout = setTimeout(() => {
        setIsDeleting(false);
        setLineIndex((prev) => (prev + 1) % TYPING_LINES.length);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, isDeleting, lineIndex]);

  const currentLine = TYPING_LINES[lineIndex];
  const displayText = currentLine?.slice(0, charIndex) ?? "";

  return (
    <span className="font-mono text-brand-500">
      {displayText}
      <span className="animate-pulse text-brand-300">▌</span>
    </span>
  );
}

export function HeroSection() {
  const { copied, copy } = useCopy();

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24 md:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-brand-700)_0%,_transparent_70%)] opacity-[0.07]" />

      <div className="relative mx-auto max-w-5xl text-center">
        <FadeIn className="mb-8 flex justify-center">
          <pre
            className="hidden select-none bg-linear-to-r from-brand-900 via-brand-600 to-brand-100 bg-clip-text text-[0.35rem] leading-[1.15] text-transparent sm:block sm:text-[0.5rem] md:text-[0.6rem] lg:text-[0.7rem]"
          >
            {BANNER_AGENT.map((line, i) => (
              <div key={i}>
                {line}{"  "}{BANNER_LINT[i]}
              </div>
            ))}
          </pre>
        </FadeIn>

        <FadeUp delay={0.2}>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          <span className="bg-linear-to-r from-brand-700 via-brand-500 to-brand-200 bg-clip-text text-transparent">
            ESLint
          </span>{" "}
          for your coding agents.
        </h1>
        </FadeUp>

        <FadeUp delay={0.3}>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Keep AGENTS.md, rules, skills, workflows, and plans structured, current,
          and codebase-aware.
        </p>
        </FadeUp>

        <FadeUp delay={0.4}>
        <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 font-mono text-sm shadow-lg">
          <span className="text-muted-foreground">$</span>
          <span className="flex-1 text-left text-foreground">{INSTALL_CMD}</span>
          <button
            onClick={() => copy(INSTALL_CMD)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <Check className="h-4 w-4 text-brand-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
        </FadeUp>

        <FadeUp delay={0.5}>
        <div className="mt-4 flex h-8 items-center justify-center">
          <TypingAnimation />
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#quickstart">
            <Button size="lg" className="bg-brand-700 text-white shadow-lg shadow-brand-700/25 hover:bg-brand-800">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <a
            href="https://github.com/samilozturk/agentlint"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline">
              View on GitHub
            </Button>
          </a>
        </div>
        </FadeUp>
      </div>
    </section>
  );
}
