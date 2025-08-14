# Agent Guidelines for typed-conf

## Build/Test Commands
- `npm test` - Run all tests using borp
- `npm run test:only` - Run tests with --only flag for focused testing
- Run single test: `borp src/function-parser.test.ts` (or any specific test file)

## Code Style
- **Language**: TypeScript with ES modules (`"type": "module"`)
- **Imports**: Use `.js` extensions for local imports (e.g., `from "./schemes.js"`)
- **Types**: Prefer explicit type annotations, use `type` for type aliases
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces
- **Functions**: Use function declarations for exports, arrow functions for inline
- **Error handling**: Use descriptive Error messages, throw early for invalid inputs
- **Testing**: Use Node.js built-in test runner with `describe`/`test` structure
- **Exports**: Use named exports, avoid default exports
- **Symbols**: Use symbols for internal type markers (e.g., `kType`)
- **Comments**: JSDoc for public APIs, inline comments for complex logic only

## Architecture
- Configuration schema system with type-safe builders
- Source-based configuration loading with merge strategy
- Functional programming style with immutable data structures