# AGENTS

## Guardrails
- Keep scope local-first; no auth or multi-tenant features yet.
- Follow the Makefile targets; `make check` is the quality gate.
- Update docs and `CHANGELOG.md` for user-facing changes.
- Prefer small, composable React components.

## Conventions
- TypeScript strict mode stays on.
- Use semantic HTML and a11y-friendly labels.
- Keep mock data in `src/data` until a backend exists.

## Commands
- `make setup`
- `make dev`
- `make check`
