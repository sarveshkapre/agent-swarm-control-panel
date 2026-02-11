# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do
- [ ] `P2` Accessibility pass for drawers/modals (keyboard-only, focus management, aria labels) + regression tests.
- [ ] `P2` Add role/label coverage tests for newly added run-note and template-import actions.
- [ ] `P2` Add stale-localStorage recovery banner with one-click reset when persisted payload parsing fails.
- [ ] `P2` Add empty states for run filters (status/tag/search) with "clear filters" action.
- [ ] `P2` Add per-run quick links to related approvals from run cards (not only run drawer).
- [ ] `P2` Add structured evidence fields for run annotations in export payload and checksum verification path.
- [ ] `P2` Add keyboard shortcut `Shift+N` to open new template modal directly.
- [ ] `P3` Lightweight telemetry counters (runs queued, approvals approved/denied, exports) persisted locally.
- [ ] `P3` Allow filtering logs by selected run context from run drawer.
- [ ] `P3` Add undo for destructive template actions (delete) with timeout toast.
- [ ] `P3` Add template schema migration helper for future breaking changes.
- [ ] `P3` Add optional auto-tag suggestions based on run status/SLA tone.
- [ ] `P3` Add package-size guard in CI (build artifact budget + failure threshold).
- [ ] `P3` Add runtime performance budget check for initial render in CI smoke.
- [ ] `P3` Refactor run lifecycle helpers from `src/App.tsx` into dedicated `src/utils/runLifecycle.ts`.
- [ ] `P3` Add docs split for long operator runbooks under `docs/` and keep README to 1-2 screens.
- [ ] `P3` Add integration-card inline diagnostics timeline (last 3 sync attempts) for trust/debuggability.

## Implemented
- [x] `P1` Run annotations + tags with tag-based filtering (operator notes persisted in workspace state, searchable/triage-ready).  
  Date: 2026-02-11  
  Evidence: `src/App.tsx`, `src/components/RunDetailDrawer.tsx`, `src/components/AgentsRunsSection.tsx`, `src/utils/storedState.ts`, `src/types.ts`, `src/App.test.tsx`
- [x] `P1` Operator handoff bundle copy action from run details (run summary + approvals + last 5 logs + notes).  
  Date: 2026-02-11  
  Evidence: `src/App.tsx`, `src/components/RunDetailDrawer.tsx`, `src/App.test.tsx`
- [x] `P1` Template library import/export JSON flow (separate from full workspace state export/import).  
  Date: 2026-02-11  
  Evidence: `src/App.tsx`, `src/components/RunTemplatesCard.tsx`, `src/utils/storedState.ts`, `src/App.test.tsx`
- [x] `P1` Agent workload heatmap + SLA alerting (per-agent queued/running/waiting counts, at-risk/breached highlights, local-only).  
  Date: 2026-02-10  
  Evidence: `src/components/AgentWorkloadCard.tsx`, `src/App.tsx`, `src/styles.css`, `src/App.test.tsx`
- [x] `P2` Trace waterfall mock view in run details (spans + timing bars) to set observability UX baseline.  
  Date: 2026-02-10  
  Evidence: `src/components/TraceWaterfall.tsx`, `src/components/RunDetailDrawer.tsx`, `src/App.tsx`, `src/types.ts`, `src/styles.css`, `src/App.test.tsx`
- [x] `P1` Deep-linkable run + approval drawers (URL state, copy link, back/forward sync).  
  Date: 2026-02-09  
  Evidence: `src/App.tsx`, `src/components/ApprovalDrawer.tsx`, `src/components/RunDetailDrawer.tsx`, `src/App.test.tsx`
- [x] `P1` Evidence export viewer (schema/meta preview + copy/download).  
  Date: 2026-02-09  
  Evidence: `src/components/EvidenceExportViewerModal.tsx`, `src/components/LogsCard.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`
- [x] `P0` Add an operator "Emergency stop" to pause new run queueing (policy setting + disable queue CTAs + visible banner).  
  Date: 2026-02-09  
  Evidence: `src/App.tsx`, `src/components/PolicyModal.tsx`, `src/components/TopBar.tsx`, `src/components/AgentsRunsSection.tsx`, `src/components/RunComposerCard.tsx`, `src/components/RunTemplatesCard.tsx`, `src/styles.css`, `src/App.test.tsx`
- [x] `P1` Add alert routing/escalation actions from run-health card (owner ping, pause policy, incident draft + copy to clipboard).  
  Date: 2026-02-09  
  Evidence: `src/components/RunHealthCard.tsx`, `src/App.tsx`, `src/utils/clipboard.ts`, `src/styles.css`, `src/App.test.tsx`
- [x] `P1` Add integration sync health telemetry (last sync, error state, reconnect action) and persist integration state in local storage + state export/import.  
  Date: 2026-02-09  
  Evidence: `src/components/IntegrationHubCard.tsx`, `src/App.tsx`, `src/types.ts`, `src/data/mockData.ts`, `src/styles.css`, `src/App.test.tsx`
- [x] `P0` Persist user-edited run templates/playbooks (CRUD + localStorage persistence + state export/import).  
  Date: 2026-02-09  
  Evidence: `src/App.tsx`, `src/components/TemplateModal.tsx`, `src/components/RunTemplatesCard.tsx`, `src/types.ts`, `src/App.test.tsx`
- [x] `P1` Add run filtering chips (status) + persist selection for fast triage.  
  Date: 2026-02-09  
  Evidence: `src/components/AgentsRunsSection.tsx`, `src/App.tsx`, `src/styles.css`, `src/types.ts`, `src/App.test.tsx`
- [x] `P0` Fix run creation bug for top-bar, runs-panel, and template queue actions.  
  Date: 2026-02-08  
  Evidence: `src/App.tsx`, `src/App.test.tsx`
- [x] `P0` Add run health summary card with at-risk runs, approvals pending, error count, and spend-at-risk.  
  Date: 2026-02-08  
  Evidence: `src/components/RunHealthCard.tsx`, `src/App.tsx`, `src/styles.css`, `src/App.test.tsx`
- [x] `P1` Export evidence from live UI state (run data, queued runs, run overrides, health snapshot).  
  Date: 2026-02-08  
  Evidence: `src/App.tsx`
- [x] `P1` Add regression tests for queue paths and run health summary rendering.  
  Date: 2026-02-08  
  Evidence: `src/App.test.tsx` (`12` tests passing)
- [x] `P1` Harden GitHub Actions workflows with explicit job timeouts and manual dispatch triggers.  
  Date: 2026-02-08  
  Evidence: `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`
- [x] `P2` Bump GitHub CodeQL Action to `v4` to avoid deprecation warnings.  
  Date: 2026-02-09  
  Evidence: `.github/workflows/codeql.yml`
- [x] `P1` Align docs with shipped behavior and verification paths.  
  Date: 2026-02-08  
  Evidence: `README.md`, `CHANGELOG.md`, `UPDATE.md`
- [x] `P0` Add evidence-pack integrity metadata with schema versioning + SHA-256 digest.  
  Date: 2026-02-09  
  Evidence: `src/utils/evidence.ts`, `src/App.tsx`, `src/App.test.tsx`
- [x] `P0` Harden imported/hydrated local state with runtime sanitization and safe fallbacks.  
  Date: 2026-02-09  
  Evidence: `src/App.tsx`, `src/types.ts`, `src/App.test.tsx`
- [x] `P1` Replace static run-duration seed map with timestamp/event-derived tracking.  
  Date: 2026-02-09  
  Evidence: `src/utils/runInsights.ts`, `src/data/mockData.ts`, `src/App.tsx`
- [x] `P1` Upgrade toolchain to non-vulnerable Vite/esbuild path and verify no regressions.  
  Date: 2026-02-09  
  Evidence: `package.json`, `package-lock.json`, `npm audit --audit-level=moderate` (0 vulnerabilities)
- [x] `P2` Persist cycle memory and incident prevention docs.  
  Date: 2026-02-09  
  Evidence: `PROJECT_MEMORY.md`, `INCIDENTS.md`
- [x] `P2` Refresh docs for cycle-2 behavior and verification evidence.  
  Date: 2026-02-09  
  Evidence: `README.md`, `CHANGELOG.md`, `UPDATE.md`
- [x] `P0` Add evidence-pack checksum verification flow in UI (paste/upload + digest validation against `integrity.digest`).  
  Date: 2026-02-09  
  Evidence: `src/components/EvidenceVerifyModal.tsx`, `src/utils/evidence.ts`, `src/components/LogsCard.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`
- [x] `P0` Ensure `AGENTS.md`, `PROJECT_MEMORY.md`, and `INCIDENTS.md` are tracked and current (repo contract hygiene).  
  Date: 2026-02-09  
  Evidence: `AGENTS.md`, `PROJECT_MEMORY.md`, `INCIDENTS.md`
- [x] `P3` Refactor stored-state hydration/sanitization into utilities (no behavior change).  
  Date: 2026-02-10  
  Evidence: `src/utils/storedState.ts`, `src/utils/json.ts`, `src/App.tsx`

## Insights
- The recent CI and CodeQL failures (`2026-02-02`) were cancelled jobs with no executable log steps, not reproducible code/test regressions.
- Highest-impact product issue was queue-action trust: multiple CTA buttons claimed to queue work but did not mutate run state.
- Evidence export quality matters for operator trust; exporting only seed runs hid queued/overridden live state.
- Bounded market scan indicates baseline expectations include trace observability, replay/debug context, and operational monitoring; checksum-backed exports align with trust/compliance expectations.
- Gap map after cycle-3 (`2026-02-09`): escalation workflows, integration sync observability, and deep-link handoffs were the weakest operator loops.
- After shipping cycle-4 escalation and sync-health work, the next highest-leverage gaps are deep-link handoffs (run/approval URL state) and an evidence viewer to reduce JSON-only workflows.
- Market baseline signals (untrusted, web): visual trace exploration and replay/time-travel debugging are common UX expectations in agent orchestration tooling; representative references:
  - LangGraph Studio: https://langchain-ai.github.io/langgraph/concepts/langgraph_studio/
  - OpenAI Agents SDK tracing: https://openai.github.io/openai-agents-python/tracing/
- Bounded market scan update (`2026-02-11`, untrusted external): operator UIs in this segment consistently emphasize observability/traces, iterative workflow editing, and production telemetry baselines:
  - OpenAI Agents SDK tracing: https://openai.github.io/openai-agents-python/tracing/
  - CrewAI observability/traces positioning: https://www.crewai.com/open-source
  - Langfuse docs and product framing: https://www.langfuse.com/docs
  - AutoGen Studio user guide: https://microsoft.github.io/autogen/stable/user-guide/autogenstudio-user-guide/index.html

## Notes
- This file is maintained by the autonomous clone loop.
