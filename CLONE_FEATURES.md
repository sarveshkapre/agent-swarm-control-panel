# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do
- [ ] `P0` Add an operator "Emergency stop" to pause new run queueing (policy setting + disable queue CTAs + visible banner).
- [ ] `P1` Add alert routing/escalation actions from run-health card (owner ping, pause policy, incident draft + copy to clipboard).
- [ ] `P1` Add integration sync health telemetry (last sync, error state, reconnect action) and persist integration state in local storage + state export/import.
- [ ] `P2` Add shareable deep-link to selected run/approval drawers (URL state + copy link).
- [ ] `P2` Add evidence export viewer (schema/meta preview + copy-to-clipboard snippets).
- [ ] `P2` Add template import/export as JSON for sharing playbooks (separate from full workspace state).
- [ ] `P2` Add lightweight telemetry toggles (local-only counters: runs queued, approvals approved/denied, exports).
- [ ] `P3` Add run annotations + tags (operator notes) with tag-based filtering.
- [ ] `P3` Add trace waterfall mock view in run details (spans + timing) to set observability baseline.
- [ ] `P3` Accessibility pass for new escalation/integration flows (keyboard-only, focus management, aria labels) + regression tests.

## Implemented
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

## Insights
- The recent CI and CodeQL failures (`2026-02-02`) were cancelled jobs with no executable log steps, not reproducible code/test regressions.
- Highest-impact product issue was queue-action trust: multiple CTA buttons claimed to queue work but did not mutate run state.
- Evidence export quality matters for operator trust; exporting only seed runs hid queued/overridden live state.
- Bounded market scan indicates baseline expectations include trace observability, replay/debug context, and operational monitoring; checksum-backed exports align with trust/compliance expectations.
- Gap map after 2026-02-09: escalation workflows, integration sync observability, and deep-link handoffs remain weak.

## Notes
- This file is maintained by the autonomous clone loop.
