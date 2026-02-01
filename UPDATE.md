# Update (2026-02-01)

## What changed
- Fixed local persisted state hydration (no first-render overwrite).
- Improved robustness around log streaming, JSON import/export, and keyboard shortcuts.
- Added regression tests for the above.

## How to verify
- `make check`
- `make dev` then open the app and validate:
  - Theme/search fields persist across reloads.
  - `/` focuses “Search runs” unless you are typing in an input.
  - Start/Pause stream doesn’t spam intervals.

## PR instructions
If a PR is not created automatically, run:
- `git checkout -b fix/persistence-hydration`
- `git commit -am "Fix persistence hydration + add regression tests"`
- `git push -u origin fix/persistence-hydration`
- `gh pr create --fill`

