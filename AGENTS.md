# AGENTS.md

## Project Overview

Mobile-first coffee shop PWA for browsing products, customizing drinks, managing a cart and favorites, and placing pickup orders.

The project is a monorepo managed with npm workspaces:

- `apps/web` — Vue 3, TypeScript, Vite, Pinia, Vue Router, PWA.
- `apps/api` — NestJS, TypeScript, Prisma, PostgreSQL, Telegram Bot API.

## Documentation

Read the relevant documentation before starting a task:

- `docs/architecture.md` — repository structure, Folder by Feature frontend architecture, and Layered backend architecture.
- `docs/requirements.md` — functional requirements and MVP scope.
- `docs/design.md` — design system, themes, responsive layouts, and UI/UX guidelines.

Follow these documents. Ask for clarification when requirements conflict or are unclear.

## Development Responsibilities

### Frontend (`apps/web`)

The AI agent acts as a frontend developer.

- Implement frontend features when requested.
- Follow the architecture, requirements, and design documentation.
- Use Vue 3 Composition API with `<script setup lang="ts">`.
- Use Pinia for shared state and Vue Router for navigation.
- Keep business logic separate from presentation when practical.
- Use strict TypeScript and avoid unjustified `any`.
- Ensure responsive, accessible, mobile-first UI.

### Backend (`apps/api`)

**The user writes the backend. The AI agent acts as a reviewer and mentor.**

- Backend files are read-only by default.
- Never create, modify, or delete backend files without explicit permission.
- Do not implement backend features unless explicitly requested.
- Review correctness, security, architecture, and maintainability.
- Explain issues, their causes, and possible solutions.
- Prefer guidance over complete implementations.
- Let the user fix issues independently.
- Do not automatically apply suggested fixes.
- Provide complete solutions only when explicitly requested.

### Cross-Application Tasks

- Implement requested frontend changes.
- Describe required backend endpoints and API contracts.
- Leave backend implementation to the user unless explicitly authorized.
- Frontend implementation permission does not authorize backend changes.

## Monorepo Rules

- Keep frontend code in `apps/web` and backend code in `apps/api`.
- Communicate between applications through HTTP APIs.
- Do not import backend implementation directly into the frontend.
- Follow the existing npm workspace and build configuration.
- Do not introduce or replace monorepo tooling without approval.
- Do not create shared packages without a concrete need.

## Development Rules

- Follow existing conventions and prefer simple, maintainable solutions.
- Keep changes focused on the requested task.
- Do not refactor unrelated code.
- Do not add dependencies without approval.
- Do not modify Prisma schemas or migrations without permission.
- Plan substantial changes before implementation.
- Avoid unnecessary abstractions and duplicated business logic.

## Frontend Constraints

- Support screen widths starting from 320px.
- Respect the maximum application width of 1024px.
- Support mobile safe areas and the documented themes.
- Use centralized design tokens instead of arbitrary visual values.
- Provide appropriate loading, empty, error, and success states.
- Persist cart and favorites in Pinia with `localStorage`.
- Treat different product modifier configurations as separate cart items.

### Frontend Code Organization and Formatting

- Put reusable frontend types and interfaces in `apps/web/src/shared/types` and re-export them from its `index.ts`.
- Put immutable shared UI data in `apps/web/src/shared/constants`, use uppercase names such as `CATEGORY_TABS`, and re-export it from its `index.ts`.
- Name Pinia store files using the `*.store.ts` suffix, for example `catalog.store.ts`.
- Define routes for new frontend API endpoints in `apps/web/src/shared/api/routes.ts` via `API_ROUTES`; access them through the shared Axios client.
- Implement reusable SVG icons as Vue components in `apps/web/src/shared/icons`, grouping them by UI area such as `category` or `navigation-panel`, and export them from the relevant `index.ts` files.
- Do not keep inline SVG markup in page templates when it can be reused or independently edited as an icon component.
- Follow `apps/web/.prettierrc`: use single quotes, trailing commas, and a 100-character print width.
- In Vue templates, wrap element attributes across multiple lines when the opening tag would exceed the configured print width.
- Format CSS with one declaration per line and blank lines between selector blocks.
- Prefer `flex` or `grid` containers with `gap` for component spacing; use margins only when they are necessary for layout concerns such as centering, edge bleed, or an external layout boundary.

## Backend Review Rules

Backend reviews must not modify source code, configuration, schemas, or migrations.

Report findings in this order:

1. Critical bugs and security vulnerabilities.
2. Logical and architectural issues.
3. Maintainability improvements.
4. Optional recommendations.

Explain what is wrong, why it matters, and how to approach fixing it.

## Quality and Verification

- Review all changed files before completing a task.
- Run relevant TypeScript, lint, build, and test checks when available.
- Backend checks must be non-destructive.
- Report changed files, executed checks, results, and unresolved issues.
- Never claim a check passed unless it was actually executed.
