# .cursorrules / Workspace Rules for Project Development

## Project Context
You are building "Prompt Perfector", a tool to optimize Context Files for AI Agents.
Tech Stack: Next.js (App Router), TypeScript, Tailwind, Shadcn UI, Drizzle ORM, tRPC, SQLite.

## Coding Standards

### 1. General Principles
- **Minimal & Functional:** Write clean, modular code. Avoid over-engineering.
- **Type Strictness:** No `any`. Use Zod for validation on both frontend and backend boundaries.
- **Component Design:** Use Shadcn UI components. Create small, reusable components in `src/components`.

### 2. Next.js & tRPC
- Use **Server Components** by default. Only use `"use client"` when interactivity (hooks) is strictly needed.
- Place tRPC routers in `src/server/api/routers`.
- Use Drizzle for all database interactions. Do not write raw SQL unless necessary.

### 3. Styling
- Use Tailwind CSS utility classes.
- Use `clsx` or `cn` helper for conditional class merging.
- Support Dark Mode by default using Tailwind's `dark:` modifier or CSS variables.

### 4. The "Judge" Logic
- When implementing the LLM Judge, strictly follow the "Best Practices" defined in the provided project report.
- The prompts you write for the LLM must enforce:
    - Progressive Disclosure.
    - Safety Gates (No auto-execution of dangerous commands).
    - Minimal Context for AGENTS.md.

## Workflow
1. Read `great_plan.md` to understand the current phase.
2. Check `PRD.md` for feature specifics.
3. Before marking a task complete, verify against `check_control_list.md`.
4. If you encounter a decision point not covered here, ask the user.