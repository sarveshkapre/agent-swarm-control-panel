# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do
- [ ] `P1` Upgrade build toolchain to patched Vite/esbuild line once a no-regression path is confirmed (`npm audit` currently reports moderate dev-server advisory).
- [ ] `P1` Add integrity signing/checksum metadata for exported evidence packs.
- [ ] `P2` Replace static `runDurationMinutes` seed map with event-derived duration tracking.

## Implemented
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
- [x] `P1` Align docs with shipped behavior and verification paths.  
  Date: 2026-02-08  
  Evidence: `README.md`, `CHANGELOG.md`, `UPDATE.md`

## Insights
- The recent CI and CodeQL failures (`2026-02-02`) were cancelled jobs with no executable log steps, not reproducible code/test regressions.
- Highest-impact product issue was queue-action trust: multiple CTA buttons claimed to queue work but did not mutate run state.
- Evidence export quality matters for operator trust; exporting only seed runs hid queued/overridden live state.

## Notes
- This file is maintained by the autonomous clone loop.
