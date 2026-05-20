import { useEffect, useRef, useState } from "react";
import "./styles.css";

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;
const TILE_SIZE = 40;

type GameMode = "menu" | "playing" | "paused" | "won" | "lost";
type EnemyAxis = "horizontal" | "vertical";

type TilePoint = {
  row: number;
  column: number;
};

type FixSeed = TilePoint & {
  id: string;
  label: string;
};

type SwitchSeed = TilePoint & {
  id: string;
  label: string;
};

type EnemySeed = TilePoint & {
  id: string;
  label: string;
  axis: EnemyAxis;
  patrolStart: number;
  patrolEnd: number;
  speed: number;
};

type LevelDefinition = {
  name: string;
  objective: string;
  tip: string;
  layout: string[];
  fixes: FixSeed[];
  switches: SwitchSeed[];
  enemies: EnemySeed[];
};

type EnemyRuntime = {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  axis: EnemyAxis;
  patrolStart: number;
  patrolEnd: number;
  speed: number;
  direction: 1 | -1;
  stunnedFor: number;
};

type Player = {
  x: number;
  y: number;
  radius: number;
  speed: number;
};

type LevelRuntime = {
  definition: LevelDefinition;
  spawn: { x: number; y: number };
  exit: { x: number; y: number; width: number; height: number };
  fixes: Array<FixSeed & { collected: boolean; x: number; y: number }>;
  switches: Array<SwitchSeed & { active: boolean; x: number; y: number }>;
  enemies: EnemyRuntime[];
};

type GameState = {
  mode: GameMode;
  levelIndex: number;
  player: Player;
  health: number;
  score: number;
  elapsed: number;
  dashCooldown: number;
  pulseCooldown: number;
  invulnerableFor: number;
  keys: Record<string, boolean>;
  level: LevelRuntime;
  message: string;
  pulseRing: { x: number; y: number; age: number } | null;
};

const levels: LevelDefinition[] = [
  {
    name: "Contrast Gate",
    objective: "Collect contrast fixes, trigger the focus switch, and exit through the open gate.",
    tip: "Start simple: collect every gold fix, press E near the switch, avoid the moving bug.",
    layout: [
      "########################",
      "#S....#.........#.....E#",
      "#.###.#..##..#..#.####.#",
      "#...#....#...#....#....#",
      "###.#####.#.######.###.#",
      "#...#.....#....#.....#.#",
      "#.#.#.########.#.###.#.#",
      "#.#.......#....#...#...#",
      "#.#######.#.######.###.#",
      "#.......#.#......#.....#",
      "#.#####.#.####.#.#####.#",
      "#.....#........#.......#",
      "#.###.##########.#####.#",
      "#......................#",
      "########################",
    ],
    fixes: [
      { id: "aa", row: 2, column: 8, label: "AA" },
      { id: "focus", row: 6, column: 16, label: "Focus" },
      { id: "hover", row: 11, column: 4, label: "Hover" },
    ],
    switches: [{ id: "focus-switch", row: 12, column: 19, label: "Focus switch" }],
    enemies: [{ id: "dim-button", row: 7, column: 11, label: "Dim button", axis: "horizontal", patrolStart: 9, patrolEnd: 15, speed: 86 }],
  },
  {
    name: "Layout Pit",
    objective: "Repair the broken grid, wrap rule, and spacing system before the layout pit resets.",
    tip: "Use dash to cross open lanes. Pulse can stun bugs long enough to slip through.",
    layout: [
      "########################",
      "#S.....#..............E#",
      "#.###..#.######.#####..#",
      "#...#....#....#.....#..#",
      "###.######.##.#####.#.##",
      "#.........#..#.....#...#",
      "#.#########..#####.###.#",
      "#.#..............#.....#",
      "#.#.#####.###########..#",
      "#...#...#.....#........#",
      "#.###.#.#####.#.######.#",
      "#.....#.......#......#.#",
      "#.#########.#######.#..#",
      "#......................#",
      "########################",
    ],
    fixes: [
      { id: "grid", row: 3, column: 9, label: "Grid" },
      { id: "wrap", row: 7, column: 14, label: "Wrap" },
      { id: "gap", row: 12, column: 5, label: "Gap" },
      { id: "breakpoint", row: 10, column: 20, label: "Breakpoint" },
    ],
    switches: [{ id: "grid-switch", row: 5, column: 18, label: "Grid switch" }],
    enemies: [
      { id: "overflow", row: 5, column: 8, label: "Overflow", axis: "horizontal", patrolStart: 3, patrolEnd: 10, speed: 112 },
      { id: "wrap-bug", row: 10, column: 15, label: "Wrap bug", axis: "vertical", patrolStart: 7, patrolEnd: 12, speed: 92 },
    ],
  },
  {
    name: "CTA Torch",
    objective: "Restore labels, states, and the conversion path while bugs patrol the call-to-action hall.",
    tip: "Enemies stay stunned for a short window after pulse. Use that to cross tight corridors.",
    layout: [
      "########################",
      "#S..#.................E#",
      "#.#.#.###############..#",
      "#.#.#.....#........#...#",
      "#.#.#####.#.######.#.###",
      "#.#.......#.#....#.#...#",
      "#.#########.#.##.#.###.#",
      "#...........#..#.#.....#",
      "#######.######.#.#####.#",
      "#.....#......#.#.......#",
      "#.###.######.#.#######.#",
      "#...#........#.....#...#",
      "#.#.#############.#.#..#",
      "#......................#",
      "########################",
    ],
    fixes: [
      { id: "label", row: 3, column: 7, label: "Label" },
      { id: "state", row: 5, column: 16, label: "State" },
      { id: "path", row: 11, column: 11, label: "Path" },
      { id: "copy", row: 13, column: 19, label: "Copy" },
    ],
    switches: [
      { id: "cta-switch-left", row: 9, column: 3, label: "CTA switch" },
      { id: "cta-switch-right", row: 12, column: 21, label: "Path switch" },
    ],
    enemies: [
      { id: "lost-cta", row: 7, column: 8, label: "Lost CTA", axis: "horizontal", patrolStart: 6, patrolEnd: 13, speed: 118 },
      { id: "dead-link", row: 10, column: 18, label: "Dead link", axis: "vertical", patrolStart: 6, patrolEnd: 12, speed: 96 },
    ],
  },
  {
    name: "Mobile Door",
    objective: "Patch viewport, overflow, tap target, and final QA notes to ship the closeout.",
    tip: "This final room expects every mechanic: movement, dash, interact, pulse, and exit timing.",
    layout: [
      "########################",
      "#S....#...............E#",
      "####..#.##############.#",
      "#.....#......#.........#",
      "#.##########.#.#########",
      "#.#..........#.........#",
      "#.#.#################..#",
      "#.#.....#..............#",
      "#.#####.#.############.#",
      "#.....#.#......#.......#",
      "#####.#.######.#.#####.#",
      "#.....#........#.....#.#",
      "#.###########.#####.#..#",
      "#......................#",
      "########################",
    ],
    fixes: [
      { id: "viewport", row: 3, column: 4, label: "Viewport" },
      { id: "overflow", row: 7, column: 9, label: "Overflow" },
      { id: "tap", row: 11, column: 18, label: "Tap" },
      { id: "handoff", row: 13, column: 5, label: "Handoff" },
      { id: "qa", row: 5, column: 20, label: "QA" },
    ],
    switches: [
      { id: "mobile-switch", row: 9, column: 17, label: "Mobile switch" },
      { id: "final-switch", row: 12, column: 21, label: "Final switch" },
    ],
    enemies: [
      { id: "tiny-tap", row: 3, column: 13, label: "Tiny tap", axis: "horizontal", patrolStart: 8, patrolEnd: 16, speed: 130 },
      { id: "viewport-bug", row: 8, column: 12, label: "Viewport", axis: "vertical", patrolStart: 7, patrolEnd: 13, speed: 105 },
      { id: "overflow-final", row: 11, column: 8, label: "Overflow", axis: "horizontal", patrolStart: 4, patrolEnd: 12, speed: 124 },
    ],
  },
];

const basePlayer: Player = { x: 60, y: 60, radius: 13, speed: 190 };

function tileCenter(point: TilePoint) {
  return {
    x: point.column * TILE_SIZE + TILE_SIZE / 2,
    y: point.row * TILE_SIZE + TILE_SIZE / 2,
  };
}

function createLevelRuntime(levelIndex: number): LevelRuntime {
  const definition = levels[levelIndex];
  let spawn = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };
  let exit = { x: CANVAS_WIDTH - TILE_SIZE * 1.4, y: TILE_SIZE * 1.5, width: TILE_SIZE * 0.8, height: TILE_SIZE * 1.2 };

  definition.layout.forEach((rowText, rowIndex) => {
    [...rowText].forEach((tile, columnIndex) => {
      if (tile === "S") {
        spawn = tileCenter({ row: rowIndex, column: columnIndex });
      }
      if (tile === "E") {
        const center = tileCenter({ row: rowIndex, column: columnIndex });
        exit = { x: center.x - 14, y: center.y - 24, width: 28, height: 48 };
      }
    });
  });

  return {
    definition,
    spawn,
    exit,
    fixes: definition.fixes.map((fix) => ({ ...fix, ...tileCenter(fix), collected: false })),
    switches: definition.switches.map((switchSeed) => ({ ...switchSeed, ...tileCenter(switchSeed), active: false })),
    enemies: definition.enemies.map((enemy) => {
      const center = tileCenter(enemy);
      const patrolStart = enemy.axis === "horizontal" ? enemy.patrolStart * TILE_SIZE + TILE_SIZE / 2 : enemy.patrolStart * TILE_SIZE + TILE_SIZE / 2;
      const patrolEnd = enemy.axis === "horizontal" ? enemy.patrolEnd * TILE_SIZE + TILE_SIZE / 2 : enemy.patrolEnd * TILE_SIZE + TILE_SIZE / 2;
      return {
        id: enemy.id,
        label: enemy.label,
        x: center.x,
        y: center.y,
        radius: 16,
        axis: enemy.axis,
        patrolStart,
        patrolEnd,
        speed: enemy.speed,
        direction: 1,
        stunnedFor: 0,
      };
    }),
  };
}

function freshState(mode: GameMode = "menu"): GameState {
  const level = createLevelRuntime(0);
  return {
    mode,
    levelIndex: 0,
    player: { ...basePlayer, x: level.spawn.x, y: level.spawn.y },
    health: 5,
    score: 0,
    elapsed: 0,
    dashCooldown: 0,
    pulseCooldown: 0,
    invulnerableFor: 0,
    keys: {},
    level,
    message: mode === "menu" ? "Start the run to begin the QA dungeon." : level.definition.objective,
    pulseRing: null,
  };
}

function isWall(definition: LevelDefinition, row: number, column: number) {
  if (row < 0 || column < 0 || row >= definition.layout.length || column >= definition.layout[0].length) {
    return true;
  }
  return definition.layout[row][column] === "#";
}

function circleHitsWall(definition: LevelDefinition, x: number, y: number, radius: number) {
  const minColumn = Math.floor((x - radius) / TILE_SIZE);
  const maxColumn = Math.floor((x + radius) / TILE_SIZE);
  const minRow = Math.floor((y - radius) / TILE_SIZE);
  const maxRow = Math.floor((y + radius) / TILE_SIZE);

  for (let tileRow = minRow; tileRow <= maxRow; tileRow += 1) {
    for (let tileColumn = minColumn; tileColumn <= maxColumn; tileColumn += 1) {
      if (!isWall(definition, tileRow, tileColumn)) {
        continue;
      }
      const rectLeft = tileColumn * TILE_SIZE;
      const rectTop = tileRow * TILE_SIZE;
      const nearestX = Math.max(rectLeft, Math.min(x, rectLeft + TILE_SIZE));
      const nearestY = Math.max(rectTop, Math.min(y, rectTop + TILE_SIZE));
      if (Math.hypot(x - nearestX, y - nearestY) < radius) {
        return true;
      }
    }
  }
  return false;
}

function rectContainsCircle(rect: { x: number; y: number; width: number; height: number }, player: Player) {
  return player.x > rect.x - player.radius && player.x < rect.x + rect.width + player.radius && player.y > rect.y - player.radius && player.y < rect.y + rect.height + player.radius;
}

function allFixesCollected(level: LevelRuntime) {
  return level.fixes.every((fix) => fix.collected);
}

function allSwitchesActive(level: LevelRuntime) {
  return level.switches.every((switchSeed) => switchSeed.active);
}

function exitUnlocked(level: LevelRuntime) {
  return allFixesCollected(level) && allSwitchesActive(level);
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(freshState());
  const [, forceRender] = useState(0);

  function sync() {
    forceRender((value) => value + 1);
  }

  function loadLevel(levelIndex: number) {
    const current = stateRef.current;
    const level = createLevelRuntime(levelIndex);
    current.levelIndex = levelIndex;
    current.level = level;
    current.player = { ...basePlayer, x: level.spawn.x, y: level.spawn.y };
    current.message = level.definition.objective;
    current.dashCooldown = Math.min(current.dashCooldown, 0.2);
    current.pulseCooldown = Math.min(current.pulseCooldown, 0.2);
    current.invulnerableFor = 1;
    current.pulseRing = null;
    sync();
  }

  function startGame() {
    (document.activeElement as HTMLElement | null)?.blur();
    stateRef.current = freshState("playing");
    sync();
  }

  function togglePause() {
    const state = stateRef.current;
    if (state.mode === "playing") {
      state.mode = "paused";
      state.message = "Paused. Press P or Resume to continue.";
    } else if (state.mode === "paused") {
      state.mode = "playing";
      state.message = state.level.definition.objective;
    }
    sync();
  }

  function damagePlayer(reason: string) {
    const state = stateRef.current;
    if (state.invulnerableFor > 0 || state.mode !== "playing") {
      return;
    }
    state.health -= 1;
    state.score = Math.max(0, state.score - 35);
    state.invulnerableFor = 1.2;
    state.player.x = state.level.spawn.x;
    state.player.y = state.level.spawn.y;
    state.message = `${reason}. Reset to checkpoint.`;
    if (state.health <= 0) {
      state.mode = "lost";
      state.message = "Run failed. Restart to clear the dungeon.";
    }
    sync();
  }

  function movePlayer(deltaX: number, deltaY: number) {
    const state = stateRef.current;
    const nextX = state.player.x + deltaX;
    if (!circleHitsWall(state.level.definition, nextX, state.player.y, state.player.radius)) {
      state.player.x = Math.max(state.player.radius, Math.min(CANVAS_WIDTH - state.player.radius, nextX));
    }
    const nextY = state.player.y + deltaY;
    if (!circleHitsWall(state.level.definition, state.player.x, nextY, state.player.radius)) {
      state.player.y = Math.max(state.player.radius, Math.min(CANVAS_HEIGHT - state.player.radius, nextY));
    }
  }

  function movementVector() {
    const state = stateRef.current;
    const horizontal = (state.keys.ArrowRight || state.keys.d ? 1 : 0) - (state.keys.ArrowLeft || state.keys.a ? 1 : 0);
    const vertical = (state.keys.ArrowDown || state.keys.s ? 1 : 0) - (state.keys.ArrowUp || state.keys.w ? 1 : 0);
    const length = Math.hypot(horizontal, vertical) || 1;
    return { horizontal: horizontal / length, vertical: vertical / length, hasInput: horizontal !== 0 || vertical !== 0 };
  }

  function dash() {
    const state = stateRef.current;
    const vector = movementVector();
    if (state.mode !== "playing" || state.dashCooldown > 0 || !vector.hasInput) {
      return;
    }
    const dashSteps = 9;
    const dashDistance = 13;
    for (let dashStep = 0; dashStep < dashSteps; dashStep += 1) {
      movePlayer(vector.horizontal * dashDistance, vector.vertical * dashDistance);
    }
    state.dashCooldown = 1.25;
    state.message = "Dash used. Reposition before the next bug sweep.";
    sync();
  }

  function pulse() {
    const state = stateRef.current;
    if (state.mode !== "playing" || state.pulseCooldown > 0) {
      return;
    }
    let stunned = 0;
    for (const enemy of state.level.enemies) {
      if (Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) <= 125) {
        enemy.stunnedFor = 2.4;
        stunned += 1;
      }
    }
    state.score += stunned * 25;
    state.pulseCooldown = 2.8;
    state.pulseRing = { x: state.player.x, y: state.player.y, age: 0 };
    state.message = stunned > 0 ? `Debug pulse stunned ${stunned} bug${stunned === 1 ? "" : "s"}.` : "Debug pulse fired, but no bugs were in range.";
    sync();
  }

  function interact() {
    const state = stateRef.current;
    if (state.mode !== "playing") {
      return;
    }
    const nearbySwitch = state.level.switches.find((switchSeed) => !switchSeed.active && Math.hypot(switchSeed.x - state.player.x, switchSeed.y - state.player.y) < 48);
    if (nearbySwitch) {
      nearbySwitch.active = true;
      state.score += 75;
      state.message = `${nearbySwitch.label} activated.`;
      sync();
      return;
    }
    state.message = "No switch in range. Stand close and press E.";
    sync();
  }

  function advanceOrWin() {
    const state = stateRef.current;
    if (state.levelIndex === levels.length - 1) {
      state.mode = "won";
      state.score += Math.max(0, Math.round(1000 - state.elapsed * 3));
      state.message = "Dungeon cleared. QA closeout packaged.";
    } else {
      loadLevel(state.levelIndex + 1);
      state.score += 150;
    }
    sync();
  }

  function update(dt: number) {
    const state = stateRef.current;
    if (state.mode !== "playing") {
      return;
    }

    state.elapsed += dt;
    state.dashCooldown = Math.max(0, state.dashCooldown - dt);
    state.pulseCooldown = Math.max(0, state.pulseCooldown - dt);
    state.invulnerableFor = Math.max(0, state.invulnerableFor - dt);
    if (state.pulseRing) {
      state.pulseRing.age += dt;
      if (state.pulseRing.age > 0.55) {
        state.pulseRing = null;
      }
    }

    const vector = movementVector();
    if (vector.hasInput) {
      movePlayer(vector.horizontal * state.player.speed * dt, vector.vertical * state.player.speed * dt);
    }

    for (const enemy of state.level.enemies) {
      if (enemy.stunnedFor > 0) {
        enemy.stunnedFor = Math.max(0, enemy.stunnedFor - dt);
      } else {
        const movement = enemy.speed * enemy.direction * dt;
        if (enemy.axis === "horizontal") {
          enemy.x += movement;
          if (enemy.x < enemy.patrolStart || enemy.x > enemy.patrolEnd) {
            enemy.direction *= -1;
            enemy.x = Math.max(enemy.patrolStart, Math.min(enemy.patrolEnd, enemy.x));
          }
        } else {
          enemy.y += movement;
          if (enemy.y < enemy.patrolStart || enemy.y > enemy.patrolEnd) {
            enemy.direction *= -1;
            enemy.y = Math.max(enemy.patrolStart, Math.min(enemy.patrolEnd, enemy.y));
          }
        }
      }

      if (Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < enemy.radius + state.player.radius) {
        damagePlayer(`${enemy.label} caught the run`);
      }
    }

    for (const fix of state.level.fixes) {
      if (!fix.collected && Math.hypot(fix.x - state.player.x, fix.y - state.player.y) < state.player.radius + 18) {
        fix.collected = true;
        state.score += 60;
        state.message = `Collected ${fix.label}. ${state.level.fixes.filter((candidate) => !candidate.collected).length} fixes left.`;
        sync();
      }
    }

    if (rectContainsCircle(state.level.exit, state.player)) {
      if (exitUnlocked(state.level)) {
        advanceOrWin();
      } else {
        state.message = `Gate locked: ${state.level.fixes.filter((fix) => !fix.collected).length} fixes and ${state.level.switches.filter((switchSeed) => !switchSeed.active).length} switches remain.`;
      }
    }
  }

  function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const state = stateRef.current;
    const level = state.level;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const background = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    background.addColorStop(0, "#111827");
    background.addColorStop(0.6, "#090d17");
    background.addColorStop(1, "#060912");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let tileRow = 0; tileRow < level.definition.layout.length; tileRow += 1) {
      for (let tileColumn = 0; tileColumn < level.definition.layout[tileRow].length; tileColumn += 1) {
        const tile = level.definition.layout[tileRow][tileColumn];
        const tileX = tileColumn * TILE_SIZE;
        const tileY = tileRow * TILE_SIZE;
        if (tile === "#") {
          const wallGradient = ctx.createLinearGradient(tileX, tileY, tileX + TILE_SIZE, tileY + TILE_SIZE);
          wallGradient.addColorStop(0, "#223047");
          wallGradient.addColorStop(1, "#111827");
          ctx.fillStyle = wallGradient;
          ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "rgba(255,255,255,.06)";
          ctx.strokeRect(tileX + 0.5, tileY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else {
          ctx.fillStyle = (tileRow + tileColumn) % 2 === 0 ? "rgba(255,255,255,.025)" : "rgba(255,255,255,.015)";
          ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    ctx.fillStyle = exitUnlocked(level) ? "#bff3d2" : "rgba(255,255,255,.16)";
    drawRoundedRect(ctx, level.exit.x, level.exit.y, level.exit.width, level.exit.height, 8);
    ctx.fillStyle = exitUnlocked(level) ? "#07351f" : "rgba(255,250,244,.64)";
    ctx.save();
    ctx.translate(level.exit.x + level.exit.width / 2 + 4, level.exit.y + level.exit.height / 2 + 14);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "950 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(exitUnlocked(level) ? "OPEN" : "LOCKED", 0, 0);
    ctx.restore();

    for (const switchSeed of level.switches) {
      ctx.beginPath();
      ctx.arc(switchSeed.x, switchSeed.y, 17, 0, Math.PI * 2);
      ctx.fillStyle = switchSeed.active ? "#75c7b1" : "#8b5cf6";
      ctx.fill();
      ctx.strokeStyle = "#fffaf4";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fffaf4";
      ctx.font = "950 10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("E", switchSeed.x, switchSeed.y + 4);
      ctx.textAlign = "left";
    }

    for (const fix of level.fixes) {
      if (fix.collected) {
        continue;
      }
      ctx.save();
      ctx.translate(fix.x, fix.y);
      ctx.rotate(state.elapsed * 1.4);
      ctx.fillStyle = "#ffc76b";
      ctx.beginPath();
      for (let pointIndex = 0; pointIndex < 8; pointIndex += 1) {
        const radius = pointIndex % 2 === 0 ? 17 : 8;
        const angle = (Math.PI * 2 * pointIndex) / 8;
        const pointX = Math.cos(angle) * radius;
        const pointY = Math.sin(angle) * radius;
        if (pointIndex === 0) {
          ctx.moveTo(pointX, pointY);
        } else {
          ctx.lineTo(pointX, pointY);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#120c05";
      ctx.font = "950 9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(fix.label, fix.x, fix.y + 3);
      ctx.textAlign = "left";
    }

    for (const enemy of level.enemies) {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fillStyle = enemy.stunnedFor > 0 ? "#9ca3af" : "#ff637d";
      ctx.fill();
      ctx.strokeStyle = enemy.stunnedFor > 0 ? "#e5e7eb" : "#ffd1da";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#19050a";
      ctx.font = "950 10px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(enemy.stunnedFor > 0 ? "Z" : "!", enemy.x, enemy.y + 4);
      ctx.textAlign = "left";
    }

    if (state.pulseRing) {
      const radius = 30 + state.pulseRing.age * 220;
      ctx.beginPath();
      ctx.arc(state.pulseRing.x, state.pulseRing.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(117,199,177,${Math.max(0, 0.65 - state.pulseRing.age)})`;
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.radius + (state.invulnerableFor > 0 ? 3 : 0), 0, Math.PI * 2);
    ctx.fillStyle = state.invulnerableFor > 0 && Math.floor(state.elapsed * 12) % 2 === 0 ? "#ffffff" : "#75c7b1";
    ctx.fill();
    ctx.strokeStyle = "#fffaf4";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#08211a";
    ctx.font = "950 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("QA", state.player.x, state.player.y + 4);
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(5,8,18,.78)";
    drawRoundedRect(ctx, 16, 14, 435, 76, 18);
    ctx.fillStyle = "#fffaf4";
    ctx.font = "950 24px Inter, sans-serif";
    ctx.fillText(level.definition.name, 34, 46);
    ctx.font = "750 13px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,250,244,.68)";
    ctx.fillText(level.definition.objective, 34, 70);

    ctx.fillStyle = "rgba(5,8,18,.78)";
    drawRoundedRect(ctx, 476, 14, 468, 76, 18);
    ctx.fillStyle = "#fffaf4";
    ctx.font = "900 14px Inter, sans-serif";
    ctx.fillText(`Score ${state.score}`, 494, 42);
    ctx.fillText(`Health ${"♥".repeat(Math.max(0, state.health))}`, 604, 42);
    ctx.fillText(`Room ${state.levelIndex + 1}/${levels.length}`, 736, 42);
    ctx.fillText(`Time ${Math.floor(state.elapsed)}s`, 838, 42);
    ctx.fillStyle = "rgba(255,250,244,.68)";
    ctx.fillText(`Dash ${state.dashCooldown <= 0 ? "ready" : state.dashCooldown.toFixed(1)} · Pulse ${state.pulseCooldown <= 0 ? "ready" : state.pulseCooldown.toFixed(1)}`, 494, 68);

    if (state.mode !== "playing") {
      ctx.fillStyle = "rgba(7,9,20,.82)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = "#fffaf4";
      ctx.font = "950 62px Inter, sans-serif";
      const title = state.mode === "won" ? "Dungeon Cleared" : state.mode === "lost" ? "Run Failed" : state.mode === "paused" ? "Paused" : "Debug Dungeon";
      ctx.fillText(title, 105, 235);
      ctx.font = "750 19px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,250,244,.76)";
      const body = state.mode === "won"
        ? "Final QA package complete. Restart for a faster score."
        : state.mode === "lost"
          ? "Bugs overwhelmed the sprint. Restart and use pulse/dash more aggressively."
          : "Move through four rooms, collect fixes, activate switches, stun bugs, and escape.";
      ctx.fillText(body, 110, 278);
      ctx.font = "900 14px Inter, sans-serif";
      ctx.fillStyle = "#ffc76b";
      ctx.fillText("Controls: WASD/arrows move · Shift/Space dash · J/Enter pulse · E interact · P pause · R restart", 110, 315);
    }
  }

  useEffect(() => {
    let animationFrame = 0;
    let lastTimestamp = performance.now();
    const tick = (timestamp: number) => {
      const deltaSeconds = Math.min(0.033, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;
      update(deltaSeconds);
      render();
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
      }
      stateRef.current.keys[event.key] = true;
      stateRef.current.keys[event.key.toLowerCase()] = true;
      if (event.key === "r" || event.key === "R") {
        startGame();
      }
      if (event.key === "p" || event.key === "P") {
        togglePause();
      }
      if (event.key === "f" || event.key === "F") {
        canvasRef.current?.requestFullscreen?.();
      }
      if (event.key === "Shift" || event.key === " ") {
        dash();
      }
      if (event.key === "j" || event.key === "J" || event.key === "Enter") {
        pulse();
      }
      if (event.key === "e" || event.key === "E") {
        interact();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      stateRef.current.keys[event.key] = false;
      stateRef.current.keys[event.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    window.render_game_to_text = () => {
      const state = stateRef.current;
      return JSON.stringify({
        coordinateSystem: "Canvas 960x600, origin top-left, x right, y down",
        mode: state.mode,
        level: state.level.definition.name,
        player: { x: Math.round(state.player.x), y: Math.round(state.player.y), radius: state.player.radius },
        health: state.health,
        score: state.score,
        elapsed: Number(state.elapsed.toFixed(2)),
        dashCooldown: Number(state.dashCooldown.toFixed(2)),
        pulseCooldown: Number(state.pulseCooldown.toFixed(2)),
        fixesLeft: state.level.fixes.filter((fix) => !fix.collected).map((fix) => ({ label: fix.label, x: fix.x, y: fix.y })),
        switchesLeft: state.level.switches.filter((switchSeed) => !switchSeed.active).map((switchSeed) => ({ label: switchSeed.label, x: switchSeed.x, y: switchSeed.y })),
        exitUnlocked: exitUnlocked(state.level),
        enemies: state.level.enemies.map((enemy) => ({ label: enemy.label, x: Math.round(enemy.x), y: Math.round(enemy.y), stunnedFor: Number(enemy.stunnedFor.toFixed(2)) })),
        message: state.message,
      });
    };
    window.advanceTime = (ms: number) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
        update(1 / 60);
      }
      render();
    };
  }, []);

  const state = stateRef.current;
  const fixesRemaining = state.level.fixes.filter((fix) => !fix.collected).length;
  const switchesRemaining = state.level.switches.filter((switchSeed) => !switchSeed.active).length;

  return (
    <div className="game-shell">
      <header className="site-header">
        <a className="brand" href="https://foxandhenllc.com">
          <span className="brand-mark">F&amp;H</span>
          <span>
            <strong>Fox &amp; Hen</strong>
            <small>Debug Dungeon</small>
          </span>
        </a>
        <nav>
          <a href="#play">Play</a>
          <a className="nav-button" href="https://github.com/foxandhenllc/foxhen-debug-dungeon">Repository</a>
        </nav>
      </header>
      <main>
        <aside className="game-info">
          <p>Full playable QA game</p>
          <h1>Clear four rooms of website bugs.</h1>
          <p className="lede">This is now an actual keyboard-driven game: move through maze rooms, collect fixes, activate switches, dash past hazards, pulse-stun bugs, and unlock exits.</p>
          <div className="controls">
            <span>Move: WASD / arrows</span>
            <span>Dash: Shift / Space</span>
            <span>Pulse stun: J / Enter</span>
            <span>Interact: E near switches</span>
            <span>Pause: P · Restart: R · Fullscreen: F</span>
          </div>
          <div className="action-row">
            <button id="start-btn" onClick={startGame}>Start / restart</button>
            <button onClick={togglePause}>{state.mode === "paused" ? "Resume" : "Pause"}</button>
            <button onClick={dash}>Dash</button>
            <button onClick={pulse}>Pulse</button>
          </div>
          <div className="stat-grid">
            <article><span>Score</span><strong>{state.score}</strong><small>fixes, switches, speed</small></article>
            <article><span>Health</span><strong>{"♥".repeat(Math.max(0, state.health))}</strong><small>{state.health} hits left</small></article>
            <article><span>Room</span><strong>{state.levelIndex + 1}/4</strong><small>{state.level.definition.name}</small></article>
            <article><span>Objective</span><strong>{fixesRemaining + switchesRemaining}</strong><small>{fixesRemaining} fixes · {switchesRemaining} switches</small></article>
            <article><span>Dash</span><strong>{state.dashCooldown <= 0 ? "ready" : state.dashCooldown.toFixed(1)}</strong><small>mobility cooldown</small></article>
            <article><span>Pulse</span><strong>{state.pulseCooldown <= 0 ? "ready" : state.pulseCooldown.toFixed(1)}</strong><small>stun cooldown</small></article>
          </div>
          <p className="game-log">{state.message}</p>
        </aside>
        <section id="play" className="game-card">
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
        </section>
      </main>
    </div>
  );
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

export default App;
