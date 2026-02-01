# PLAN

## Goal
Ship a local-first control panel that lets operators orchestrate multiple agents with approvals, logs, and policy guardrails.

## MVP scope
- Single-page dashboard with agent status, runs, approvals, and logs
- Keyboard shortcuts for quick search and new run
- Mocked data layer for iteration
- No auth, no backend, no multi-user state

## Architecture
- React + Vite SPA
- Mock data in `src/data`
- UI state in React hooks

## Milestones
1. Scaffold repo, docs, CI, and baseline UI (MVP)
2. Add configurable approvals + policy editor views
3. Add evidence bundle export and persistence

## Risks
- UI scope creep without backend integration
- Overloading the dashboard with too many panels
- Inconsistent a11y without tests

## Non-goals
- Multi-tenant admin model
- Cloud sync or hosted backend
- Agent execution engine (separate project)
