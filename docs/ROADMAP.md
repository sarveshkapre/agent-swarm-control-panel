# ROADMAP

## Shipped (2026-02-09)
- Run templates and saved playbooks (local-only) + state import/export
- Evidence bundle checksum metadata + verification flow
- Deep-linkable run/approval drawers (URL state + copy link)
- Evidence export viewer (schema/meta preview + copy/click download)
- Emergency stop (pause new runs) + run-health escalation draft copying
- Integration Hub sync-health telemetry + reconnect (local-only)

## Shipped (2026-02-10)
- Agent workload heatmap + SLA alerting (local-only, derived from current run state).
- Trace waterfall mock view in run details (spans + timing bars).

## Shipped (2026-02-11)
- Run annotations + tags with tag-based filtering in the runs triage view.
- Operator handoff bundle copy action from run details (summary + approvals + last 5 logs + notes).
- Template library import/export as JSON (separate from workspace state import/export).

## Near-term
- Accessibility pass for drawers/modals (keyboard-only, focus management, aria labels) + regression tests.
- Empty-state UX for combined run filters (status/search/tag) with one-click "clear filters".
- Include run annotations in evidence export payload and verification summary metadata.

## Later
- Pluggable data adapters for real agent runtimes
- Multi-workspace routing
- Evidence pack signing and integrity checks
