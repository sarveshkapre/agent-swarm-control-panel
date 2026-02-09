# CHANGELOG

## [Unreleased]
### Fixed
- Prevent localStorage-backed UI state from being clobbered on first render.
- Make log streaming interval lifecycle robust (no duplicate intervals / leaks).
- Harden JSON import/export paths and error handling.
- Sanitize imported/hydrated local state with runtime shape checks to avoid invalid run/status payloads.
- Trap focus within overlays, restore focus on close, and disable background scroll.
- Split the main dashboard view into modular components.
- Ensure `New run`, `Queue run`, and `Queue from template` actions create real queued runs.
- Improve evidence export to include live run state and health summary instead of seed-only run data.
- Replace static run-duration seed values with timestamp/event-derived duration tracking.

### Added
- Regression tests around persistence, log streaming toggle, and keyboard shortcut focus.
- Regression tests for drawer/modal focus management.
- Evidence pack verification modal (paste/upload + checksum validation).
- Template editor modal (create/edit/duplicate/delete) with local persistence.
- Run status filter chips for fast triage (persisted locally).
- Emergency stop policy toggle to pause new run queueing (disables queue CTAs and blocks shortcut queueing).
- Run-health escalation actions (pause/resume queueing, copy owner ping draft, copy incident draft).
- Run composer for queuing local runs (optional template).
- Per-run actions (pause, retry, cancel) gated by confirmation toasts.
- Run detail drawer with recent logs and approvals.
- Run-level SLA badges and duration tracking.
- Run phase timeline inside the run detail drawer.
- Per-run activity feed with key events.
- Growth momentum dashboard with outcome scorecard, activation loops, integration launchpad, and feedback radar.
- Run health summary card (at-risk runs, approvals pending, error count, spend-at-risk estimate).
- Integration Hub sync health telemetry (sync state + last sync time) with reconnect action and persisted integration state.
- Regression tests for quick queue actions, template queueing, and run health summary rendering.
- GitHub Actions workflow hardening with explicit job timeouts and manual dispatch support.
- Evidence export integrity metadata (`evidenceSchemaVersion`, SHA-256 digest, checksum timestamp).
- Evidence export now includes saved templates and selected template context (schema bumped to `3`).
- Regression tests for evidence integrity export and malformed state import sanitization.

### Security
- Upgrade toolchain to `vite@6.4.1` + `vitest@4.0.18` to clear the esbuild/vite advisory reported by `npm audit`.

## [0.1.0] - 2026-02-01
### Added
- Initial Vite + React + TypeScript scaffold
- Control panel UI with agents, runs, approvals, and logs
- Keyboard shortcuts for search and new run
- Approval detail drawer with scope diff and checklist
- Policy editor modal with guardrail toggles
- Log filters, pinning, and evidence export
- Local state persistence with import/export
- Approval policy simulation and auto-approve preview
- Run templates with playbook steps
- Log streaming controls and spike alert summary
