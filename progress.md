Original prompt: Please go ahead and actually like, make the stuff, though. Please. Like https://foxhen-debug-dungeon.vercel.app/ should actually have a game in it fully developed and playable. I need all repos/demos fully working.

- Upgraded from brochure demo to a working interactive sample.
- Includes deterministic test hooks for browser/game verification.
- Verified working interaction after upgrade using local preview and Playwright/browser automation.
- Final QA artifacts saved under `/Users/chrisfox/git/staging/temp/game-qa/`.
- TODO: Next iteration can add art assets/audio, but core play loop and scoring are working now.
- 2026-05-20: Upgraded Debug Dungeon again from a simple collector into a four-room maze game with wall collision, dash, pulse stun, switches, locked exits, moving enemies, health, score, timer, pause/restart, and win/loss states.
- Re-verified local gameplay with the web-game Playwright client; artifacts are under `/Users/chrisfox/git/staging/temp/game-qa/debug-dungeon-full/`.
