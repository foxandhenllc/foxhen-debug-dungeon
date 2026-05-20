# Debug Dungeon Fork Guide

Debug Dungeon is intentionally built as a small, forkable browser game template. The core loop lives in `src/App.tsx` so builders can inspect the complete canvas loop, collision checks, level data, and test hooks without chasing framework glue.

## Remix The Game

1. Duplicate one object in the `levels` array.
2. Edit the `layout` strings. Each row is a tile row; every row should stay 24 characters wide.
3. Use `#` for walls, `S` for spawn, `E` for the room exit, and `.` for open floor.
4. Add fixes, switches, and enemies using row/column coordinates.
5. Run `npm run build` and test the room in the Practice selector.

## Useful Extension Ideas

- Add sprite images for the player, bugs, fixes, and switches.
- Add a level-select menu with locked progression.
- Add more bug archetypes: broken forms, slow loading states, missing alt text, and checkout blockers.
- Add custom win reports that map each cleared room to a real QA checklist.

## Public-Safe Boundaries

This demo uses fictional labels only. It has no backend, external services, credentials, analytics, or customer data.
