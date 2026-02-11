# Agent Swarm Control Panel

One UI to run multiple agents (researcher/coder/tester/writer/scheduler) with approvals, logs, and guardrails.

## What it does
- Monitor active agents, runs, and live logs in one dashboard
- Track approval requests before any agent touches external tools or repos
- Share deep-links to specific run/approval drawers for incident handoff
- Control policies, spend, and evidence bundles from a single surface
- Verify exported evidence packs against the embedded checksum for integrity
- Preview evidence exports (schema/meta + checksum) and copy snippets before downloading
- Queue new runs instantly from top bar, runs panel, or template actions
- Add per-run operator notes + tags and triage runs with tag-based filtering
- Copy a one-click run handoff bundle (summary + approvals + last 5 logs + notes)
- Share template libraries via JSON import/export (separate from full workspace state)
- Surface run health summary (SLA risk, pending approvals, error pressure, spend at risk)
- Surface outcome metrics, activation loops, and feedback signals to drive adoption
- Connect integrations (Slack, Linear, Notion, Zapier) from a launchpad view

## Quickstart
```bash
npm install
npm run dev
```

## Commands
```bash
make setup
make dev
make check
```

## Tech stack
- React + Vite + TypeScript
- Vitest + Testing Library
- ESLint

## Docker
```bash
docker build -t agent-swarm-control-panel .
docker run -p 4173:4173 agent-swarm-control-panel
```

## Status
MVP UI with approvals drawer, policy editor (including emergency stop for pausing new runs), log filters/pinning, growth momentum dashboard, run health summary with escalation draft copying, agent workload heatmap + SLA alerts, trace waterfall mock view in run details, per-run operator notes/tags with tag filtering, run-handoff bundle copying, saved run templates/playbooks (CRUD + JSON import/export), Integration Hub sync health telemetry (local-only), and local workspace state import/export. Evidence exports include SHA-256 integrity metadata, and run-duration/SLA badges are computed from run timestamps/event data (not static seeds). No authentication (local-only).

## Screenshots
Add screenshots/GIFs after the first UI pass.
