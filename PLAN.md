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

## Next to ship
- Run composer (queue a run from template or custom objective) stored locally.
- Split `src/App.tsx` into small components without changing behavior.

## Top risks / unknowns
- Scope creep without a real backend runtime adapter.
- Accessibility regressions as UI grows (focus, dialog semantics, keyboard flows).
- Data model churn when integrating real agent events (streaming/log schemas).

## Commands
See `docs/PROJECT.md` for the full command list.
