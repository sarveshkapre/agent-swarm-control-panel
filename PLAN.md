# Agent Swarm Control Panel

One local-first UI to orchestrate multiple agents (researcher/coder/tester/writer/scheduler) with approvals, logs, and guardrails.

## Features
- Dashboard: agents, runs, approvals, logs
- Approvals drawer with scope diff, risk notes, checklist
- Policy editor + approval policy simulation preview
- Evidence pack + workspace state export/import
- Local persistence (localStorage), keyboard shortcuts, light/dark theme

## Shipped (this run)
- Evidence export integrity metadata + checksum verification modal.
- Run health summary + run detail drawer (timeline, activity feed, approvals, recent logs).
- Template editor modal with persisted templates/playbooks (CRUD).
- Run status filter chips for fast triage.

## Next to ship
- Integration sync health telemetry (last sync, error state, reconnect CTA).
- Escalation actions from run health (ping owner, incident draft, pause policy).
- Shareable deep-links to run/approval drawers for incident handoff.
- Evidence export viewer (schema/meta preview + copy snippets).

## Top risks / unknowns
- Scope creep without a real backend runtime adapter.
- Accessibility regressions as UI grows (focus, dialog semantics, keyboard flows).
- Data model churn when integrating real agent events (streaming/log schemas).

## Commands
See `docs/PROJECT.md` for the full command list.
