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

## Next to ship
- Add run detail view with recent log excerpts and approvals.

## Top risks / unknowns
- Scope creep without a real backend runtime adapter.
- Accessibility regressions as UI grows (focus, dialog semantics, keyboard flows).
- Data model churn when integrating real agent events (streaming/log schemas).

## Commands
See `docs/PROJECT.md` for the full command list.
