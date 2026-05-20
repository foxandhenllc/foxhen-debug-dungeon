# Debug Dungeon

A playable visual QA mini-game where each dungeon room is a website bug to fix.

![Demo screenshot](docs/demo-screenshot.png)

## Live Demo

- Demo: [https://foxhen-debug-dungeon.vercel.app](https://foxhen-debug-dungeon.vercel.app)
- Repository: [https://github.com/foxandhenllc/foxhen-debug-dungeon](https://github.com/foxandhenllc/foxhen-debug-dungeon)

## Fully Working Behaviors

- Playable local state with scoring and success/failure conditions.
- Keyboard or click controls documented in the interface.
- Deterministic test hooks exposed as `window.render_game_to_text` and `window.advanceTime`.
- No backend, auth, external service calls, production data, or customer work.

## Local Run

```bash
npm install
npm run dev
npm run build
```
