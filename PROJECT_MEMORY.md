# Project Memory

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
