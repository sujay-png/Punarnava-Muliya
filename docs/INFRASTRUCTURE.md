# PG Master - Project Infrastructure & Architecture

This document serves as the **source of truth** for AI agents and developers working on the PG Master application. Read this before planning or implementing any new features to ensure consistency with the established architecture.

## 1. Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Backend/DB**: Firebase (Auth, Firestore, Cloud Storage)
- **Styling**: Tailwind CSS + Shadcn UI
- **State/Data**: React Query (via Firebase `onSnapshot` listeners) for live data + Zustand for local UI state.
- **Forms**: `react-hook-form` + `zod` validation.

## 2. Directory Structure & Architecture
The app strictly follows a **Feature-Sliced Architecture**.
Do **not** dump domain-specific logic into the global `components/` or `lib/` folders.

- `/app`: Next.js App Router. Files here should be thin wrappers that compose Feature components.
- `/features/[feature-name]`: Contains all domain logic. Each feature has:
  - `/api`: Firestore operations (`tenants.api.ts`, etc.)
  - `/components`: UI elements specific to this feature (`TenantDetail.tsx`, etc.)
  - `/model`: Zod schemas, TypeScript types, and pure business logic (`deposit.logic.ts`).
  - `index.ts`: The public API for cross-feature imports.
- `/components/ui`: Generic, reusable Shadcn UI components (Buttons, Inputs, Dialogs).
- `/lib/firebase`: Firebase client initialization and global config.

*Rule:* Shared code cannot import from `features/`. Features can import from shared code or other features via their `index.ts`.

## 3. Data Model (Firestore)
The system separates a person's **Identity** from their **Rental Stay**. If a tenant vacates and returns months later, they keep the same `Tenant` record, but get a new `Stay` and `Deposit` record.

### Collections:
1. **`tenants` (Identity)**: `name`, `phone`, `idNumber`, `photoUrl`, `vehicleModel`.
2. **`stays` (Rental)**: `tenantId`, `roomNumber`, `monthlyRent`, `status` (`Active`, `OnNotice`, `Vacated`), `joinDate`, `vacateDate`.
3. **`deposits` (Financials)**: `tenantId`, `stayId`, `amount`, `status` (`Held`, `Refunded`, `Forfeited`), `deductions` (array of rent/fines cut during vacate), `refundAmount`.
4. **`payments` (Monthly Rent)**: `tenantId`, `amount`, `monthKey` (e.g. `2026-10`), `status` (`paid`). **Doc ID is strictly `${tenantId}_${monthKey}`**. Fines are baked into the final `amount` saved here.
5. **`statusHistory`**: Audit log of when a stay changed status (e.g., when they gave notice).
6. **`maintenance`**: `title`, `roomNo`, `tenantName`, `category`, `status`, `createdAt`.
7. **`notices`**: `title`, `message`, `broadcastStatus` (used by Cloud Functions to trigger MSG91 WhatsApp).

## 4. Key Workflows & Business Rules
- **Atomic Operations**: Any action that affects multiple documents (e.g., Registering a Tenant creates a Tenant + Stay + Deposit; Vacating a Tenant updates Stay + Deposit + StatusHistory) **MUST** use Firestore `writeBatch` or `runTransaction` in the `/api` layer.
- **Fines**: Calculated dynamically on the client. Fine = ₹100/day after the 10th of the month. Stops accruing on `vacateDate`. Fines are hardcoded into the total paid amount when a payment is processed.
- **Vacate Flow**: A multi-step flow that calculates pending dues (unpaid rent + fines for the current month up to the vacate date), applies them as `deductions` against the active `deposit`, and calculates the net refund.
- **Date Handling**: Firestore timestamps must be converted to JS `Date` objects immediately in the API layer before hitting components. Forms use `date-fns`.

## 5. UI/UX Design System
- **Theme**: Strictly Dark Mode using deep blacks/grays (e.g., `oklch(0.13 0 0)` surfaces) with a pastel orange accent.
- **Semantic Colors**: Emerald-400 (Paid/Active/Success), Amber-400 (Pending/Notice/Warning), Rose-400 (Overdue/Vacated/Error). Do not invent new colors.
- **Components**: Heavy use of `Tabs`, `Dialog` (Modals), and Skeleton Loaders. No browser `alert()` or `confirm()`; use styled Dialogs/AlertDialogs.

## 6. Safety Protocol for AI Agents
- Never edit Firestore rules without updating `firestore.rules`.
- Never edit Indexes without updating `firestore.indexes.json`.
- Keep diffs focused. Do not refactor unrelated code.
- If data schema changes, always update this `INFRASTRUCTURE.md` document.
