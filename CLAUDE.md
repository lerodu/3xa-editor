# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Webstudio is an Open Source Visual Development Platform - a monorepo containing a full-stack React application with multiple packages. The main application is the builder (visual editor) that allows users to create websites without writing code.

## Architecture

### Core Applications

- **apps/builder**: Main visual editor application built with Remix
- **apps/builder/app/builder**: Core builder interface with features like breakpoints, style panel, navigator, workspace
- **apps/builder/app/canvas**: Canvas rendering and instance management
- **apps/builder/app/dashboard**: Project management interface

### Key Packages

- **packages/react-sdk**: Core React components and runtime
- **packages/sdk-components-react**: Base HTML components (Box, Button, Text, etc.)
- **packages/sdk-components-react-radix**: Radix UI component integrations
- **packages/css-engine**: CSS generation and styling system
- **packages/design-system**: UI components using Stitches CSS-in-JS
- **packages/prisma-client**: Database client and migrations
- **packages/asset-uploader**: File upload handling
- **packages/cli**: CLI tool for project generation and builds

## Development Commands

### Essential Commands

- `pnpm dev`: Start development server (builder app)
- `pnpm build`: Build all packages except fixtures
- `pnpm checks`: Run tests, typecheck, and lint
- `pnpm lint`: Run ESLint on all TypeScript files
- `pnpm format`: Format code with Prettier

### Testing & Quality

- `pnpm -r test`: Run tests across all packages
- `pnpm -r typecheck`: Run TypeScript checks
- `pnpm playwright`: Initialize Playwright tests
- `pnpm storybook:dev`: Start Storybook development server

### Package Management

- Uses pnpm workspaces with specific Node.js 20 and pnpm ^9.14.0 requirements
- Patches applied to several dependencies (see pnpm.patchedDependencies)

## Key Technologies

- **Frontend**: React 18.3.0-canary, Remix, Radix UI, Stitches CSS-in-JS
- **Backend**: tRPC, Prisma, PostgreSQL
- **Build**: Vite, TypeScript 5.8.2, ESLint 9
- **Testing**: Vitest, Playwright, Storybook
- **Deployment**: Supports Cloudflare Pages, Vercel, Netlify, Docker

## Code Structure Patterns

### Component Organization

- Components follow `.tsx` + `.ws.ts` pattern (webstudio metadata)
- Stories use `.stories.tsx` for Storybook
- Tests use `.test.ts/.tsx` suffix

### State Management

- Uses nano-stores pattern in `shared/nano-states/`
- Builder state managed through stores in `builder/shared/`
- Canvas state separate from builder state

### Styling

- Design system components use Stitches
- CSS engine generates atomic CSS
- Breakpoint-aware styling system

## Important Notes

- Uses React 18.3.0-canary build (not stable)
- Requires specific Node.js 20 version
- Heavy use of monorepo patterns with workspace dependencies
- Canvas iframe isolation for visual editing
- AI integration features in builder
