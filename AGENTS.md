# AGENTS

## Project Overview

This is a Lynx HTML Renderer library that transforms HTML strings into LynxNodes that can be rendered in Lynx applications. The library uses htmlparser2 to parse HTML and converts HTML elements to appropriate Lynx components.

## Key Components

1. **HTML Parser** (`src/html-parser.ts`) - Main transformation logic that converts HTML to LynxNodes
2. **Type Definitions** (`src/typings.d.ts`) - Defines LynxNode types and interfaces
3. **Main Export** (`src/index.tsx`) - Exports the HTMLRenderer component
4. **Tests** (`src/__tests__/*.test.ts`) - Comprehensive test suite covering various HTML transformations

## Development Commands

- `pnpm run dev` - Run the example application in development mode
- `pnpm run test` - Run the test suite with Vitest
- `pnpm run check` - Run Biome code quality checks
- `pnpm run format` - Format code with Biome

## Architecture

The library follows a simple transformation pattern:
1. Parse HTML string using htmlparser2
2. Transform HTML nodes to LynxNodes based on TAG_MAP mappings
3. Merge adjacent text nodes for efficiency
4. Handle special cases like inline styles and br tags

Key features:
- Supports common HTML tags (div, p, span, strong, b, em, img, br)
- Converts inline styles from kebab-case to camelCase
- Merges adjacent text nodes
- Handles nested structures properly
- Drops unsupported tags silently

## Testing

Tests are written with Vitest and cover:
- Basic text node transformations
- HTML tag mappings
- Style parsing and merging
- Nested structures
- Edge cases (empty HTML, whitespace-only content)

Run tests with: `pnpm run test`

## Code Quality

Code quality is maintained with Biome:
- Run checks: `pnpm run check`
- Format code: `pnpm run format`

Type checking is configured with TypeScript using strict settings.

## Important Notes

- Write tests for each transformation case to ensure correctness.
- Don't use `any` on typescript code, use `unknown` or generic types instead.
- Run `pnpm run check` before committing to ensure code quality.
