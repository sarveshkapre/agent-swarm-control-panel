# Incidents

## Incident: 2026-02-02 GitHub Actions False-Failure Noise
- Status: closed.
- Impact: `CI` and `CodeQL` appeared failed in history for `main` and PR contexts, reducing trust in release health.
- Detection: Run IDs `21606807350`, `21606807353`, `21606784172`, `21606784191` flagged as failures.
- Root cause: jobs were cancelled before step execution; logs contained no actionable failure traces.
- Evidence:
  `gh run view 21606807350 --json jobs,conclusion,url`
  `gh run view 21606807353 --json jobs,conclusion,url`
  `gh run view 21606784172 --json jobs,conclusion,url`
  `gh run view 21606784191 --json jobs,conclusion,url`
- Corrective actions taken:
  1. Re-verified latest `main` workflows are green.
  2. Logged incident context in repository memory to prevent unnecessary churn on cancelled-only runs.
- Prevention rules:
  1. Treat cancelled runs with empty step logs as non-actionable unless repeated on latest commit.
  2. Prioritize failures only when a reproducible failing step/log exists.
  3. Verify current head SHA workflow status before allocating fix effort.
