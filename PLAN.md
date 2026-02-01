# Agent Swarm Control Panel

One local-first UI to orchestrate multiple agents (researcher/coder/tester/writer/scheduler) with approvals, logs, and guardrails.

## Features
- Dashboard: agents, runs, approvals, logs
- Approvals drawer with scope diff, risk notes, checklist
- Policy editor + approval policy simulation preview
- Evidence pack + workspace state export/import
- Local persistence (localStorage), keyboard shortcuts, light/dark theme

## Shipped (this run)
- Fixed state hydration so localStorage state no longer gets overwritten on initial mount.
- Hardened import/export + log streaming interval lifecycle; added focused regression tests.
- Added focus trap + focus restore for drawer and policy modal.
- Added a run composer to queue local runs with optional templates.
- Split `src/App.tsx` into focused components for maintainability.
- Added per-run actions with confirmation toasts.
- Added a run detail drawer with recent logs and approvals.
- Added SLA badges and duration tracking for runs.

## Next to ship
- Add visual timeline for run phases and status transitions.

## Top risks / unknowns
- Scope creep without a real backend runtime adapter.
- Accessibility regressions as UI grows (focus, dialog semantics, keyboard flows).
- Data model churn when integrating real agent events (streaming/log schemas).

## Commands
See `docs/PROJECT.md` for the full command list.
