# CHANGELOG

## [Unreleased]
### Fixed
- Prevent localStorage-backed UI state from being clobbered on first render.
- Make log streaming interval lifecycle robust (no duplicate intervals / leaks).
- Harden JSON import/export paths and error handling.
- Trap focus within overlays, restore focus on close, and disable background scroll.
- Split the main dashboard view into modular components.

### Added
- Regression tests around persistence, log streaming toggle, and keyboard shortcut focus.
- Regression tests for drawer/modal focus management.
- Run composer for queuing local runs (optional template).
- Per-run actions (pause, retry, cancel) gated by confirmation toasts.
- Run detail drawer with recent logs and approvals.
- Run-level SLA badges and duration tracking.
- Run phase timeline inside the run detail drawer.

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
