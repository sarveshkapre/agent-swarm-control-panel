# Update (2026-02-09)

## What changed
- Added evidence-export integrity metadata with schema versioning and SHA-256 checksums.
- Added an evidence-pack verification modal (paste/upload JSON, validate checksum match).
- Added a template editor (create/edit/duplicate/delete) with local persistence (templates included in workspace state export/import).
- Added run status filter chips (All/Queued/Running/Waiting/Failed/Completed) for faster triage.
- Replaced static run-duration seed mapping with timestamp/event-derived duration calculations for SLA badges.
- Hardened local state hydration/import with runtime sanitization for runs, statuses, policy, and budget fields.
- Expanded evidence export payload to include saved templates + selected template context (schema bumped to `3`).
- Added regression tests for template CRUD + run status filters (suite now `17` tests).
- Upgraded toolchain to `vite@6.4.1` and `vitest@4.0.18`; `npm audit --audit-level=moderate` now reports zero vulnerabilities.
- Re-checked historical CI failures from `2026-02-02`: all were cancelled jobs with empty steps, not reproducible code failures.

## How to verify
- `make check`
- `npm audit --audit-level=moderate`
- Local smoke: `npm run dev -- --host 127.0.0.1 --port 4173` then `curl -sSf http://127.0.0.1:4173/`
- In UI:
  - Click `Export` under `Live logs`; inspect JSON and confirm `evidenceSchemaVersion`, `integrity.digest`, and `templates` are present.
  - Click `Verify` under `Live logs`, paste the exported JSON (or upload the file), then confirm the modal reports `VERIFIED`.
  - Click `New template` under `Run templates`, save a new playbook, then refresh and confirm it persists.
  - Click status chips under `Active agents` and confirm the runs list filters accordingly (and survives refresh).
  - Import a malformed state JSON and confirm the app still loads without invalid runs/status overrides.
  - Verify `Duration` and SLA pills update from run timestamp/event context instead of fixed seed values.

## Shipping
- Shipped directly to `main` (no PR).

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
