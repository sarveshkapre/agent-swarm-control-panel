# Update (2026-02-01)

## What changed
- Fixed local persisted state hydration (no first-render overwrite).
- Improved robustness around log streaming, JSON import/export, and keyboard shortcuts.
- Added regression tests for the above.
- Added focus trap + restore for drawer and policy modal.
- Added a run composer to queue local runs (with optional templates).
- Refactored the dashboard into modular components.
- Added per-run actions with confirmation toasts.
- Added a run detail drawer with recent logs and approvals.
- Added run-level SLA badges with duration tracking.

## How to verify
- `make check`
- `make dev` then open the app and validate:
  - Theme/search fields persist across reloads.
  - `/` focuses “Search runs” unless you are typing in an input.
  - Start/Pause stream doesn’t spam intervals.
  - Drawer/modal keep focus inside and restore focus on close.
  - Composer queues a run and it appears in the run list.
  - Pause/Retry/Cancel actions show a toast and update status after confirm.
  - Run details show recent logs and approvals.
  - Runs display SLA badge and duration status.

## Shipping
- Shipped directly to `main` (no PR).
