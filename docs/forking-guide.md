# Forking Guide

Use this checklist to adapt Debug Dungeon without carrying private material into a public fork.

## 1. Replace the Sample Scenario

- Find the fictional fixture or data file under `src/`.
- Replace names, records, copy, dates, and metrics with synthetic examples for your own workflow.
- Keep the shape of the data close to the original until the app builds cleanly.

## 2. Update Public Metadata

- Update `README.md` with your demo URL, repository URL, and use case.
- Replace screenshots with public-safe screenshots from your fork.
- Keep `LICENSE`, `CONTRIBUTING.md`, and `docs/public-safe-data.md` visible.

## 3. Validate Before Publishing

```bash
npm install
npm run typecheck
npm run test --if-present
npm run build
```

## 4. Share the Fork

Open an issue or pull request at https://github.com/foxandhenllc/foxhen-debug-dungeon if your adaptation exposes a reusable scenario, fixture, accessibility improvement, or documentation fix.
