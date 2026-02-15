# AGENTS.md - AI Agent Guidelines for typed-conf

This document provides guidelines for AI coding agents working in this repository.

## Project Overview

- **Name**: typed-conf
- **Type**: TypeScript/Node.js ES modules library (config loading)
- **Package Manager**: pnpm (v10.29.3)
- **Node Version**: 24.13.1 (managed via mise)

## Development Workflow: Double TDD Loop

This project follows a **double TDD loop** approach:

```
┌─────────────────────────────────────────────────────────┐
│  OUTER LOOP: User Acceptance Test (UAT)                 │
│  Write a failing UAT in src/tests/*.uat.ts              │
│                                                         │
│    ┌─────────────────────────────────────────────┐      │
│    │  INNER LOOP: Unit/Integration TDD           │      │
│    │  1. Write failing unit/integration test     │      │
│    │  2. Write minimal code to pass              │      │
│    │  3. Refactor                                │      │
│    │  4. Repeat until UAT passes                 │      │
│    └─────────────────────────────────────────────┘      │
│                                                         │
│  UAT passes → Feature complete                          │
└─────────────────────────────────────────────────────────┘
```

### Development Cycle

1. **Define the capability** with a UAT (`src/tests/*.uat.ts`)
2. **Implement using TDD** with unit and integration tests
3. **UAT passes** → Feature is complete

### Test Classification (Strict Rule)

| Test Type   | File Pattern       | Criterion                                         |
|-------------|--------------------|---------------------------------------------------|
| Unit        | `*.unit.ts`        | **No IO** - fast, pure logic only                 |
| Integration | `*.integration.ts` | **Any IO** - file system, network, env vars, etc. |
| Acceptance  | `*.uat.ts`         | End-to-end capability verification                |

**The only criterion is IO**: If a test touches any external resource, it's an integration test. Scope/size is
irrelevant.

## Agent Role and Boundaries

**You are here to execute, not to architect.**

- Do the tedious implementation work
- Do NOT make architecture decisions autonomously
- When facing an architecture choice, STOP and present to the human:
    1. **The problem** - What needs to be decided?
    2. **The options** - What are the possible approaches?
    3. **The trade-offs** - Pros/cons of each option
    4. **The problem model** - How does this fit into the larger design?
- Wait for explicit approval before proceeding

## Build/Lint/Test Commands

| Command           | Description                                |
|-------------------|--------------------------------------------|
| `pnpm build`      | Compile TypeScript (tsc)                   |
| `pnpm typecheck`  | Type check without emitting (tsc --noEmit) |
| `pnpm lint`       | Run Biome linter on src directory          |
| `pnpm lint:fix`   | Run Biome linter with auto-fix             |
| `pnpm fmt`        | Check formatting with Biome                |
| `pnpm fmt:fix`    | Format code with Biome                     |
| `pnpm test`       | Run all tests once                         |
| `pnpm test:watch` | Run tests in watch mode                    |

### Running a Single Test

```bash
# Run a specific test file
pnpm test src/index.unit.ts

# Run tests matching a pattern
pnpm test -t "should be able to say hello"

# Run only unit tests
pnpm test --project unit

# Run only integration tests
pnpm test --project integration

# Run only acceptance tests
pnpm test --project acceptance
```

### Test Writing Pattern

Use the **Given/When/Then** (AAA) pattern with explicit comments:

```typescript
import {describe, expect, it} from "vitest";
import {hello} from "./index.js";

describe("hello", () => {
  it("should be able to say hello", () => {
    // Given
    const name = "John";

    // When
    const result = hello(name);

    // Then
    expect(result).toEqual("Hello John!");
  });
});
```

## Code Style Guidelines

### Formatting (Biome)

- **Indentation**: Tabs
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Required
- **Line width**: Default Biome settings

Always run `pnpm fmt:fix` before committing.

### Imports

```typescript
// Use .js extension for local imports (required for NodeNext)
import {hello} from "./index.js";

// Use 'import type' for type-only imports (enforced by verbatimModuleSyntax)
import type {Config} from "./types.js";

// Third-party imports - no extension needed
import {describe, expect, it} from "vitest";
```

### Naming Conventions

| Element          | Convention                                  | Example            |
|------------------|---------------------------------------------|--------------------|
| Files            | kebab-case                                  | `config-loader.ts` |
| Functions        | camelCase                                   | `loadConfig()`     |
| Types/Interfaces | PascalCase                                  | `ConfigOptions`    |
| Constants        | kCamelCase                                  | `kDefaultTimeout`  |
| Test files       | `*.unit.ts`, `*.integration.ts`, `*.uat.ts` | `index.unit.ts`    |

### TypeScript Strictness

The project uses strict TypeScript with additional checks:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "verbatimModuleSyntax": true
}
```

**Important implications:**

1. **noUncheckedIndexedAccess**: Array/object index access returns `T | undefined`
   ```typescript
   const arr = [1, 2, 3];
   const val = arr[0]; // Type is 'number | undefined', must handle
   ```

2. **exactOptionalPropertyTypes**: Optional properties must match exactly
   ```typescript
   interface Foo { bar?: string; }
   const obj: Foo = { bar: undefined }; // Error! Use omission instead
   ```

3. **verbatimModuleSyntax**: Must use `import type` for type-only imports

### Error Handling

- Always handle potentially undefined values explicitly
- Use type narrowing or assertions with proper validation
- Prefer explicit error types over generic `Error`

## Project Structure

```
typed-conf/
├── .config/
│   ├── mise/config.toml      # Tool versions & pre-commit hooks
│   └── vitest/vitest.config.ts
├── src/
│   ├── index.ts              # Main entry point
│   ├── *.unit.ts             # Unit tests (colocated)
│   └── tests/
│       └── *.uat.ts          # Acceptance tests
├── dist/                     # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── AGENTS.md
```

## Pre-commit Hooks

The pre-commit hook (via mise) automatically runs:

1. `biome check --write` on staged TS/TSX files
2. Re-stages modified files
3. `pnpm typecheck`
4. `pnpm test`

All checks must pass before commits are accepted.

## NPM Configuration

- `save-exact=true`: Dependencies saved with exact versions
- `lockfile=false`: No pnpm-lock.yaml generated

## Quick Reference for Agents

### Before Making Changes

1. Understand existing patterns by reading related source files
2. Check for existing tests to understand expected behavior

### After Making Changes

1. Run `pnpm fmt:fix && pnpm lint:fix` to fix formatting/linting
2. Run `pnpm typecheck` to verify types
3. Run `pnpm test` to verify all tests pass
4. For new features, add tests following the Given/When/Then pattern

### Common Issues

- Missing `.js` extension in local imports → Add `.js` to import path
- Type-only import without `type` keyword → Use `import type { ... }`
- Unhandled `undefined` from index access → Add null check or assertion
