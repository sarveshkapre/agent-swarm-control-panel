# Project Memory

## Entry: 2026-02-09 (Global Cycle 5)
- Decision: Ship handoff-grade deep-links (run/approval drawers) and a first-class evidence export viewer before expanding observability surfaces.
- Why: Operators need to hand off a specific run/approval context quickly (incident response, reviews), and evidence workflows should not require downloading/parsing raw JSON to confirm schema/metadata and copy checksums.
- Bounded market scan (untrusted external synthesis, references):
  - LangGraph Studio (visual execution + replay/time travel): https://langchain-ai.github.io/langgraph/concepts/langgraph_studio/
  - OpenAI Agents SDK tracing (trace capture + viewer concepts): https://openai.github.io/openai-agents-python/tracing/
- Gap map:
  Missing: shareable deep-links to open run/approval drawers; evidence export viewer beyond "download JSON".
  Weak: handoff UX required manual re-navigation and lacked a stable URL; evidence inspection required offline tooling.
  Parity: evidence exports + checksum verification, run details, run health escalation actions, integrations sync telemetry.
  Differentiator opportunity: local-first control plane with compliance-grade evidence handoff and context-preserving deep links.
- Candidate scoring (selected items first):
  1) Deep-linkable run/approval drawers (Impact 9, Effort 3, Fit 9, Diff 5, Risk 3, Confidence 8).
  2) Evidence export viewer (Impact 8, Effort 3, Fit 9, Diff 4, Risk 2, Confidence 8).
- Shipped:
  1) Deep-linkable run/approval drawers via `runId` / `approvalId` URL params, including copy-link actions and back/forward sync.
  2) Evidence export viewer modal with schema/metadata preview, copy checksum/JSON, and download.
- Verification evidence (local):
  - `make check` (pass).
  - Smoke (pass): `(npm run dev -- --host 127.0.0.1 --port 5174 > /tmp/agent-swarm-vite.log 2>&1 & echo $! > /tmp/agent-swarm-vite.pid); sleep 2; curl -fsS -D - http://127.0.0.1:5174/ -o /tmp/agent-swarm-index.html; kill $(cat /tmp/agent-swarm-vite.pid)`
- Verification evidence (CI):
  - `gh run watch 21843025630 --exit-status` (pass).
  - `gh run watch 21843028147 --exit-status` (pass).
  - `gh run watch 21843131469 --exit-status` (pass).
  - `gh run watch 21843129138 --exit-status` (pass).
- Mistakes and fixes:
  - Root cause: evidence viewer modal used a `<label>` without an associated control, tripping `jsx-a11y/label-has-associated-control`.
  - Fix: replaced the label with non-form text (`<p className="muted">Preview</p>`).
  - Prevention rule: only use `<label>` when there is an associated `id`-backed form control; prefer text elements for static section headings.
- Commits: `775b1b9`, `8c20266`.
- Confidence: high.
- Trust label: `verified-local` for code/tests/smoke/commands, `external-docs` for market scan synthesis.

## Entry: 2026-02-09 (Global Cycle 4)
- Decision: Prioritize operator control-loop actions (emergency stop + escalation drafts) and integration sync trust signals before adding new dashboards.
- Why: The panel already surfaces at-risk runs, but lacked the immediate actions operators expect (pause, notify, draft incident). Integrations also showed “connected” without any sync-health, reducing trust in operational readiness.
- Bounded market scan (untrusted external synthesis, references):
  - PagerDuty incident response concepts (incidents + escalation): https://www.pagerduty.com/resources/learn/incident-response/
  - Sentry alerting concepts (alerts/rules as baseline operator workflow): https://docs.sentry.io/product/alerts/
  - Honeycomb tracing/observability primitives (trace-driven triage expectations): https://www.honeycomb.io/
  - Langfuse tracing docs (run history + drill-down as baseline): https://langfuse.com/docs
- Gap map:
  Missing: deep-linkable run/approval drawers and a first-class evidence viewer beyond JSON download.
  Weak: integrations lacked sync-health telemetry and had no reconnect CTA; run health had no one-click escalation actions.
  Parity: evidence exports + checksum verification, run SLA badges, templates/playbooks, and local state import/export.
  Differentiator opportunity: local-first control-plane with compliance-grade evidence handoff plus operator-ready incident drafts.
- Candidate scoring (selected items first):
  1) Emergency stop (pause new runs) (Impact 9, Effort 2, Fit 9, Diff 6, Risk 2, Confidence 9).
  2) Run-health escalation actions (copy owner ping/incident draft + pause/resume) (Impact 8, Effort 3, Fit 9, Diff 5, Risk 3, Confidence 8).
  3) Integration sync health telemetry + persistence (Impact 7, Effort 4, Fit 8, Diff 4, Risk 3, Confidence 7).
- Shipped:
  1) Emergency stop toggle in policy editor that disables queue CTAs and blocks shortcut queueing.
  2) Run-health escalation actions: pause/resume queueing plus copy-to-clipboard drafts for owner pings and incident tickets.
  3) Integration Hub now shows sync health (state + last sync), supports reconnect, and persists integration state via localStorage + state export/import.
- Verification evidence (local):
  - `npm run check` (pass).
  - Smoke (pass): `set -euo pipefail; (npm run dev -- --host 127.0.0.1 --port 4173 > /tmp/agent-swarm-dev.log 2>&1 & echo $! > /tmp/agent-swarm-dev.pid); sleep 2; curl -sSf http://127.0.0.1:4173/ > /tmp/agent-swarm-dev.curl.html; kill $(cat /tmp/agent-swarm-dev.pid)`
- Verification evidence (CI):
  - `gh run watch 21834621795 --exit-status` (pass).
  - `gh run watch 21834621766 --exit-status` (pass).
- Mistakes and fixes:
  - Root cause: clipboard behavior differs across jsdom/browser environments; an overly strict test asserted clipboard internals rather than user-visible outcomes.
  - Fix: assert banner-driven outcomes and rely on a safe `document.execCommand` fallback in tests.
  - Prevention rule: prefer user-observable assertions for clipboard/permissioned APIs; mock at module boundary only when necessary.
- Commits: `7299de2`, `402c4bb`, `76f9b2e`, `0244847`.
- Confidence: high.
- Trust label: `verified-local` for code/tests/smoke/commands, `external-docs` for market scan synthesis.

## Entry: 2026-02-09 (Global Cycle 3)
- Decision: Prioritize saved playbooks (template CRUD + persistence) and faster run triage (status chips) before adding new dashboards.
- Why: Adjacent control-plane tools treat repeatable run definitions and quick run-history filtering as baseline UX; without saved templates and basic triage controls, the panel reads as demo-only.
- Bounded market scan (untrusted external synthesis, references):
  - Langfuse (open source) centers tracing/observability, implying baseline expectations like run history + drill-down: https://langfuse.com/
  - Helicone emphasizes request logging/monitoring/debugging for AI apps, reinforcing “searchable history + health signals”: https://www.helicone.ai/features/monitoring-and-debugging
  - Arize Phoenix markets LLM tracing/monitoring/evals as a standard observability layer: https://arize.com/docs/phoenix
  - PromptLayer highlights prompt tracking/logging/analytics as workflow plumbing: https://docs.promptlayer.com/
- Gap map:
  Missing: persisted playbooks/templates (create/edit/delete) and basic triage filters beyond free-text search.
  Weak: integration “connected” state lacks sync-health (last sync, errors, reconnect CTA).
  Parity: evidence exports/checksum verification, run details, health snapshot, and approvals drawer are in place.
  Differentiator opportunity: local-first “compliance-grade” playbook + evidence handoff (templates included in evidence packs).
- Candidate scoring (selected items first):
  1) Template CRUD + persistence (Impact 9, Effort 4, Fit 9, Diff 6, Risk 3, Confidence 8).
  2) Status filter chips for runs (Impact 7, Effort 2, Fit 8, Diff 3, Risk 2, Confidence 9).
  3) Integration sync health telemetry (Impact 6, Effort 3, Fit 7, Diff 3, Risk 2, Confidence 7).
- Shipped:
  1) Template editor modal with create/edit/duplicate/delete and local persistence (templates stored in workspace state export/import).
  2) Run status filter chips (All/Queued/Running/Waiting/Failed/Completed) persisted in local state.
  3) Evidence export now includes templates + selected template context; evidence schema bumped to `3` to reflect the expanded payload.
- Verification evidence (local):
  - `npm run check` (pass).
  - Smoke (pass): `set -euo pipefail; (npm run dev -- --host 127.0.0.1 --port 4173 > /tmp/agent-swarm-dev.log 2>&1 & echo $! > /tmp/agent-swarm-dev.pid); sleep 2; curl -sSf http://127.0.0.1:4173/ > /tmp/agent-swarm-dev.curl.html; kill $(cat /tmp/agent-swarm-dev.pid)`
- Verification evidence (CI):
  - `gh run watch 21825737360 --exit-status` (pass).
  - `gh run watch 21825737369 --exit-status` (pass).
- Follow-ups:
  1. Shareable deep-links to open run/approval drawers.
  2. Escalation actions from run health summary (incident draft, ping owner).
- Commit: `3ef1f8c`.
- Confidence: high.
- Trust label: `verified-local` for code/tests/smoke, `external-docs` for market scan synthesis.

## Entry: 2026-02-09 (Global Cycle 2)
- Decision: Prioritize operator trust and reliability over new surface-area features.
- Why: Market baseline from LangSmith/Langfuse/AgentOps/Weave emphasizes observable traces, trustworthy exports, and safe runtime controls; this repo still had weak evidence integrity and unsafe import handling.
- Gap map:
  Missing: signed/checksummed evidence exports.
  Weak: state import robustness against malformed payloads.
  Parity: run/SLA visibility existed but used static seeded duration values.
  Differentiator opportunity: compliance-grade evidence handoff from local-first control panel.
- Scoring summary:
  1) Evidence checksum metadata (Impact 9, Effort 3, Fit 9, Diff 7, Risk 2, Confidence 9).
  2) Import-state sanitization (Impact 8, Effort 4, Fit 9, Diff 6, Risk 3, Confidence 8).
  3) Event/timestamp-derived run duration tracking (Impact 7, Effort 4, Fit 8, Diff 5, Risk 3, Confidence 8).
  4) Vite/Vitest security-line upgrade (Impact 8, Effort 4, Fit 8, Diff 4, Risk 4, Confidence 8).
- Evidence:
  Files: `src/App.tsx`, `src/utils/evidence.ts`, `src/utils/runInsights.ts`, `src/App.test.tsx`, `src/types.ts`, `src/data/mockData.ts`, `package.json`, `package-lock.json`.
  Commands: `npm run check`, `npm audit --audit-level=moderate`, local smoke with `npm run dev -- --host 127.0.0.1 --port 4173` + `curl`.
  Market scan references: https://docs.langchain.com/langsmith/observability-concepts, https://langfuse.com/docs/tracing/overview, https://docs.agentops.ai/v2/concepts/traces, https://weave-docs.wandb.ai/.
- Commit: recorded in 2026-02-09 cycle commits on `main`.
- Confidence: high.
- Trust label: `verified-local` for code/tests/commands, `external-docs` for market scan synthesis.
- Follow-ups:
  1. Add evidence-pack verification workflow (upload/verify checksum in UI).
  2. Add alert routing/escalation actions tied to at-risk runs.
  3. Add integration sync health telemetry (last sync/error state per connector).

---

## Entry: 2026-02-09 (Global Cycle 1)
- Decision: Ship an evidence-pack checksum verification flow and clean up CI deprecation noise.
- Why: Evidence exports only increase operator trust when recipients can independently verify integrity; the CodeQL workflow also emitted a near-term deprecation warning that was safe to remove.
- Shipped:
  1) Evidence pack verification modal (paste/upload JSON, validate `integrity.digest` matches computed checksum).
  2) Tracked `AGENTS.md` in git and refreshed the cycle task list in `CLONE_FEATURES.md`.
  3) Upgraded `github/codeql-action` from `v3` to `v4` in `.github/workflows/codeql.yml`.
- Verification evidence (local):
  - `npm run check` (pass).
  - Smoke (pass): `set -euo pipefail; (npm run dev -- --host 127.0.0.1 --port 4173 > /tmp/agent-swarm-dev.log 2>&1 & echo $! > /tmp/agent-swarm-dev.pid); sleep 2; curl -sSf http://127.0.0.1:4173/ > /tmp/agent-swarm-dev.curl.html; kill $(cat /tmp/agent-swarm-dev.pid)`
- Verification evidence (CI):
  - `gh run watch 21812610375 --exit-status` (pass).
  - `gh run watch 21812610393 --exit-status` (pass).
  - `gh run watch 21812647454 --exit-status` (pass).
  - `gh run watch 21812647441 --exit-status` (pass).
- Market scan (bounded, references):
  - LangSmith observability concepts: https://docs.langchain.com/langsmith/observability-concepts
  - Langfuse tracing overview: https://langfuse.com/docs/tracing/overview
  - AgentOps traces concept: https://docs.agentops.ai/v2/concepts/traces
  - Weave docs: https://weave-docs.wandb.ai/
- Commits: `741d499`, `3438ff9`, `af38996`.
- Mistakes and fixes:
  - Root cause: adding a Node-only crypto import under `src/` broke `tsc` because the project does not include Node type declarations.
  - Fix: removed the Node import and made the checksum verification test tolerant of environments where `crypto.subtle` is unavailable.
  - Prevention rule: avoid importing Node built-ins in browser-only source; if truly needed, add Node types intentionally and isolate usage to test-only files.
- Confidence: high.
- Trust label: `verified-local` for code/tests/smoke/commands, `external-docs` for market scan synthesis.
