# Update (2026-02-08)

## What changed
- Fixed run-queue UX gap: `New run`, `Queue run`, and `Queue from template` now create queued runs immediately.
- Added a run health summary card with at-risk runs, approval pressure, error pressure, and spend-at-risk estimate.
- Expanded evidence export payload to include live run state (`runData`, queued runs, run overrides) and run health summary.
- Added regression tests for quick queue actions, template queue flow, and run health summary rendering.
- Hardened GitHub Actions workflows with explicit job timeouts and `workflow_dispatch` triggers.
- Re-validated CI locally and smoke-verified the app runs in a local dev session.

## How to verify
- `make check`
- `npm audit --audit-level=high`
- Local smoke: `npm run dev -- --host 127.0.0.1 --port 4173` then `curl -sSf http://127.0.0.1:4173/`
- In UI:
  - Click `New run` in top bar, then `Queue run` in runs panel, and confirm both add entries in runs list.
  - Click `Queue from template` and confirm template objective appears as a queued run.
  - Check `Run health summary` values and open an at-risk run from the card.
  - Export evidence and verify payload includes `runHealthSummary`, `runs`, `queuedRuns`, and `runOverrides`.

## Shipping
- Shipped directly to `main` (no PR).
