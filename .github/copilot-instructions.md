# Copilot / AI Agent Instructions — Lilita

Purpose: concise, actionable guidance so an AI coding agent can be immediately productive in this repo.

Architecture (big picture)
- Expo Router front-end in `/app` (file-based routing). Venue pages live at `/app/venue/[id].tsx`.
- State: React Context in `context/AppContext.tsx` exposes `useApp()` for cart, orders, and `cartVenueId` restriction.
- Backend: Supabase client + DB helpers in `lib/supabase.ts` and `lib/database.ts`. Realtime and Edge Functions live under `supabase/functions/`.
- Types: DB and app types in `src/types/` and top-level `types/` (e.g., `types/database.ts`). Keep these in sync with DB migrations.

Key project patterns (do not change without care)
- Venue Cart Restriction: cart items must belong to a single venue — `cartVenueId` guarded logic is in `context/AppContext.tsx`. When adding cart features, preserve this constraint.
- Menu & Categories: products are filtered by `category_id`; UI uses horizontal category tabs in venue pages. See `components/MenuItemCard.tsx` and `/app/venue/[id].tsx`.
- Delivery Locations: resort-specific locations are stored in `ordering_location` table and surfaced in `components/LocationSelector.tsx` and the delivery-location page.
- Safe area & layout: screens use `SafeAreaView` with `edges={['top']}` and a shared `components/BottomTabBar.tsx`.
- Styling: NativeWind (Tailwind) with custom colors in `tailwind.config.js`. Avoid hardcoding colors—use configured tokens (`cream`, `sand`, `charcoal`, `coral`, `turquoise`).

Data layer & DB changes
- All DB reads/writes should go through `lib/database.ts` helper functions. When adding fields:
  - Add/modify SQL migration under `supabase/migrations/`.
  - Update DB types (`types/database.ts` and `src/types/supabase.ts`).
  - Update `lib/database.ts` queries and UI consumers (menu, cart, orders).
- Supabase edge/functions: auth and clerk-related helpers live under `supabase/functions/`. If you change server-side behavior, update these functions and their deploy process.

Developer workflows & commands
- Start dev server: `npm start` or `npx expo start` (Expo Router). Use `npm run android` / `npm run ios` for device builds.
- Tests: `npm test` (jest-expo). Lint: `npm run lint`.
- Environment: local env examples live in `.env.local` (this file is open in the editor). Ensure Supabase and Clerk env vars are present before running.

Conventions for contributors and AI agents
- Minimal, localized PRs: prefer incremental changes that update types + migrations + UI in one PR.
- File-based routing: avoid renaming/moving files in `/app` unless the routing implications are deliberate and reviewed.
- Use `useApp()` from `context/AppContext.tsx` for cart/order interactions; do not duplicate cart logic.
- Keep styling tokens in `tailwind.config.js`. When adding enums or constants (delivery types, ordering location types), update both DB migration and TypeScript types.

Where to look for canonical examples
- Cart & context: `context/AppContext.tsx`.
- Data helpers: `lib/database.ts`.
- Supabase client/init: `lib/supabase.ts`.
- Menu UI: `components/MenuItemCard.tsx`.
- Routing examples: `/app/venue/[id].tsx`, `/app/cart.tsx`, `/app/checkout.tsx`.
- Migrations and RLS: `supabase/migrations/*.sql`.

AI-specific guidance
- Do not invent env var names; read `.env.local` and `lib/supabase.ts`.
- Run `npm test` and `npx expo start` locally when verifying behavioral changes.
- Avoid large refactors of routing/layout without human review.
- For DB shape changes: update migrations, types, `lib/database.ts`, and all UI consumers in the same change set.

When in doubt
- Ask the repo owner about Supabase/Clerk envs and whether migrations should be run locally or via CI.

Keep this file short and repo-focused. Add examples only when they are discoverable in the codebase.
# AI Coding Guidelines for Resort Food Ordering App

## Architecture Overview
- **Expo Router**: File-based routing in `/app` directory (e.g., `/app/venue/[id].tsx` for dynamic venue pages)
- **State Management**: React Context via `AppContext` for cart, orders, delivery locations
- **Backend**: Supabase with tables: `hospitality_center`, `merchant`, `product`, `product_category`, `ordering_location`, `order`, `order_product`
- **Styling**: NativeWind (Tailwind CSS) with custom color palette: `cream`, `sand`, `charcoal`, `coral`, `turquoise`

## Key Patterns
- **Venue Cart Restriction**: Cart items must belong to same venue (`cartVenueId` in context prevents mixing orders)
- **Menu Categories**: Products filtered by `category_id` with horizontal scroll tabs in venue pages
- **Delivery Locations**: Resort-specific locations (pool, cabana, table, beach) stored in `ordering_location` table
- **Safe Areas**: Use `SafeAreaView` with `edges={['top']}` for proper iOS/Android spacing
- **Icons**: Lucide React Native icons (e.g., `ArrowLeft`, `Clock`, `Star`)
- **Data Fetching**: Database functions in `/lib/database.ts` using Supabase client

## Component Structure
- **Layout**: `BottomTabBar` component for navigation
- **Cards**: `MenuItemCard` for product display with add-to-cart functionality
- **Context Usage**: Import `useApp()` hook for cart/order state management
- **Navigation**: `expo-router` with `useLocalSearchParams()` for dynamic routes

## Database Schema Notes
- Merchants (venues) belong to hospitality centers
- Products have categories and belong to merchants
- Orders link to ordering locations (delivery spots)
- Use `getMerchantById()`, `getProductsByMerchant()`, `getProductCategories()` for venue pages

## Development Commands
- `npm start` / `npx expo start`: Start development server
- `npm run android` / `npm run ios`: Platform-specific builds
- `npm test`: Jest tests with `jest-expo` preset
- `npm run lint`: ESLint via Expo

## File Organization
- `/components/`: Reusable UI components
- `/context/`: App-wide state (cart, orders, locations)
- `/lib/`: Database functions and Supabase client
- `/types/`: TypeScript interfaces for app and database types
- `/app/`: Expo Router pages (file-based routing)

## Styling Conventions
- Custom colors via Tailwind config (avoid hardcoded hex values)
- Border radius: `card: '16px'`, `button: '12px'`
- Box shadows: `soft`, `lift` for elevation
- Background: `bg-cream` for main screens, `bg-white` for cards/sections</content>
<parameter name="filePath">/app/.github/copilot-instructions.md