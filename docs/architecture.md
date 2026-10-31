# Architecture

## Overview

The application uses a separate frontend and backend.

- **Frontend:** Vue 3, TypeScript, Folder by Feature.
- **Backend:** NestJS, TypeScript, Layered Architecture.
- **Database:** PostgreSQL with Prisma ORM.
- **Notifications:** Telegram Bot API.

The frontend communicates with the backend through HTTP APIs.

## Frontend Architecture

The frontend follows **Folder by Feature** architecture.

Business functionality is organized around features rather than technical file types.

### Proposed Structure

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── App.vue
├── features/
│   ├── products/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── api/
│   │   └── types/
│   ├── cart/
│   │   ├── components/
│   │   ├── stores/
│   │   └── types/
│   ├── favorites/
│   │   ├── components/
│   │   └── stores/
│   └── checkout/
│       ├── components/
│       ├── api/
│       └── types/
├── pages/
│   ├── HomePage.vue
│   ├── CartPage.vue
│   ├── FavoritesPage.vue
│   └── CheckoutPage.vue
├── shared/
│   ├── api/
│   ├── components/
│   ├── composables/
│   ├── constants/
│   ├── types/
│   └── utils/
└── main.ts
```

### Responsibilities

**app/**
Application initialization, global configuration, routing, and providers.

**features/**
Independent business functionality, including related components, stores, API functions, types, and composables.

**pages/**
Route-level components that compose features into complete pages.

**shared/**
Reusable functionality that does not depend on a specific business feature.

### Dependency Rules

- Features may import reusable code from `shared`.
- Pages may compose multiple features.
- `shared` must not import from business features.
- Avoid direct dependencies between features where possible.
- Do not create directories or abstractions before they are needed.

### Type Placement

- Do not declare `type` aliases or `interface` definitions in Vue page or component files.
- Place types used only by one feature in that feature's `types/` directory and re-export them from `types/index.ts`.
- Place types reused by multiple features in `shared/types/` and re-export them from `shared/types/index.ts`.
- Pages and components should import the type they need from the relevant feature or shared entry point.

## Backend Architecture

The backend follows **Layered Architecture**, organized within NestJS feature modules.

### Proposed Structure

```text
src/
├── main.ts
├── app.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── products/
│   ├── dto/
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
├── categories/
│   ├── dto/
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   └── categories.module.ts
├── orders/
│   ├── dto/
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── orders.module.ts
└── notifications/
    ├── notifications.service.ts
    └── notifications.module.ts
```

### Layer Responsibilities

**Controller Layer**

- Receives HTTP requests.
- Uses DTOs for input validation.
- Calls application services.
- Returns responses.

**Service Layer**

- Implements business rules.
- Coordinates operations.
- Validates product options and calculates order totals.
- Uses Prisma for persistence.

**Data Access Layer**

- Prisma ORM communicates with PostgreSQL.
- Database access is encapsulated in the backend.
- Additional repository abstractions are optional and should only be introduced when justified.

### Request Flow

```text
Vue Component
     ↓
Frontend API Function
     ↓
HTTP Request
     ↓
NestJS Controller
     ↓
NestJS Service
     ↓
Prisma ORM
     ↓
PostgreSQL
```

For order creation, the backend also triggers Telegram notifications after persisting the order.

## State Management

- Pinia stores shared frontend state.
- Component-local state stays in Vue components.
- Cart and favorites persist in `localStorage`.
- Product and category data come from the backend.
- Orders are stored in PostgreSQL.

## Order Processing

1. The customer selects products and modifiers.
2. The frontend builds an order request containing product IDs, quantities, modifier IDs, and pickup details.
3. The backend validates the request.
4. The backend retrieves authoritative product and modifier prices.
5. The backend calculates the total.
6. The order is persisted in PostgreSQL.
7. A Telegram notification is attempted.
8. The frontend receives the order result.

The backend must not trust client-calculated totals.

Notification failures must be handled without losing successfully persisted orders.

## Architectural Principles

- Keep business rules in the appropriate feature or service.
- Prefer explicit dependencies.
- Use NestJS dependency injection.
- Avoid circular dependencies.
- Avoid premature abstraction.
- Keep the architecture easy to understand and extend.
- Introduce complexity only when supported by concrete requirements.
