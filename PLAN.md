# Agent Swarm Control Panel

One local-first UI to orchestrate multiple agents (researcher/coder/tester/writer/scheduler) with approvals, logs, and guardrails.

## Features
- Dashboard: agents, runs, approvals, logs
- Approvals drawer with scope diff, risk notes, checklist
- Policy editor + approval policy simulation preview
- Evidence pack + workspace state export/import
- Local persistence (localStorage), keyboard shortcuts, light/dark theme

## Shipped (this run)
- Run annotations + tags persisted in workspace state, with tag-based run filtering.
- Operator handoff bundle copy action from run details (summary, approvals, last 5 logs, notes).
- Template library import/export JSON flow (separate from workspace state import/export).

## Next to ship
- Accessibility pass for drawers/modals (keyboard-only, focus management, aria labels) + regression tests.
- Run-filter empty state with clear-filter CTA when status/search/tag filters return zero runs.
- Include run annotations in evidence payload + checksum verification summary.

## Top risks / unknowns
- Scope creep without a real backend runtime adapter.
- Accessibility regressions as UI grows (focus, dialog semantics, keyboard flows).
- Data model churn when integrating real agent events (streaming/log schemas).

## Commands
See `docs/PROJECT.md` for the full command list.
