import { useEffect, useRef, useState } from "react";
import "./styles.css";

type Room = {
  name: string;
  objective: string;
  bug: string;
  fixes: { x: number; y: number; label: string; collected?: boolean }[];
  hazards: { x: number; y: number; w: number; h: number; vx: number }[];
};

const rooms: Room[] = [
  { name: "Contrast Gate", objective: "Collect AA, Focus, and Hover fixes to open the gate.", bug: "Dim button", fixes: [{ x: 180, y: 140, label: "AA" }, { x: 520, y: 210, label: "Focus" }, { x: 310, y: 410, label: "Hover" }], hazards: [{ x: 270, y: 250, w: 150, h: 28, vx: 86 }] },
  { name: "Layout Pit", objective: "Gather Grid, Wrap, and Gap fixes before the layout collapses.", bug: "Broken grid", fixes: [{ x: 160, y: 390, label: "Grid" }, { x: 600, y: 130, label: "Wrap" }, { x: 700, y: 420, label: "Gap" }], hazards: [{ x: 120, y: 250, w: 190, h: 28, vx: 110 }, { x: 540, y: 310, w: 160, h: 28, vx: -95 }] },
  { name: "CTA Torch", objective: "Restore Label, Path, and State so the buyer can act.", bug: "Lost CTA", fixes: [{ x: 180, y: 120, label: "Label" }, { x: 420, y: 410, label: "Path" }, { x: 690, y: 210, label: "State" }], hazards: [{ x: 260, y: 185, w: 140, h: 28, vx: 130 }, { x: 460, y: 330, w: 140, h: 28, vx: -120 }] },
  { name: "Mobile Door", objective: "Collect Viewport, Overflow, and Tap fixes to escape.", bug: "Mobile overflow", fixes: [{ x: 190, y: 430, label: "Viewport" }, { x: 560, y: 160, label: "Overflow" }, { x: 720, y: 390, label: "Tap" }], hazards: [{ x: 130, y: 190, w: 180, h: 28, vx: 125 }, { x: 510, y: 260, w: 180, h: 28, vx: -130 }] },
];

type GameState = {
  mode: "menu" | "playing" | "won";
  room: number;
  player: { x: number; y: number; r: number; speed: number };
  health: number;
  score: number;
  fixes: Room["fixes"];
  hazards: Room["hazards"];
  keys: Record<string, boolean>;
  message: string;
};

const basePlayer = { x: 70, y: 280, r: 18, speed: 215 };

function cloneRoom(roomIndex: number) {
  const room = rooms[roomIndex];
  return {
    fixes: room.fixes.map((fix) => ({ ...fix, collected: false })),
    hazards: room.hazards.map((hazard) => ({ ...hazard })),
  };
}

function freshState(): GameState {
  const first = cloneRoom(0);
  return { mode: "menu", room: 0, player: { ...basePlayer }, health: 3, score: 0, fixes: first.fixes, hazards: first.hazards, keys: {}, message: "Press Start to enter the dungeon." };
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(freshState());
  const [, forceRender] = useState(0);

  function sync() {
    forceRender((value) => value + 1);
  }

  function startGame() {
    (document.activeElement as HTMLElement | null)?.blur();
    const first = freshState();
    first.mode = "playing";
    first.message = rooms[0].objective;
    stateRef.current = first;
    sync();
  }

  function resetRoom(message = "Careful. Bug collision reset the room.") {
    const state = stateRef.current;
    const room = cloneRoom(state.room);
    state.player = { ...basePlayer };
    state.fixes = room.fixes;
    state.hazards = room.hazards;
    state.health = Math.max(1, state.health - 1);
    state.message = message;
    if (state.health <= 1) {
      state.room = 0;
      const first = cloneRoom(0);
      state.fixes = first.fixes;
      state.hazards = first.hazards;
      state.health = 3;
      state.score = Math.max(0, state.score - 50);
      state.message = "The dungeon reset. Start again with cleaner fixes.";
    }
  }

  function advanceRoom() {
    const state = stateRef.current;
    if (state.room === rooms.length - 1) {
      state.mode = "won";
      state.score += 250;
      state.message = "Escaped with a QA closeout report.";
      return;
    }
    state.room += 1;
    const next = cloneRoom(state.room);
    state.player = { ...basePlayer };
    state.fixes = next.fixes;
    state.hazards = next.hazards;
    state.message = rooms[state.room].objective;
  }

  function update(dt: number) {
    const state = stateRef.current;
    if (state.mode !== "playing") return;
    const dx = (state.keys.ArrowRight || state.keys.d ? 1 : 0) - (state.keys.ArrowLeft || state.keys.a ? 1 : 0);
    const dy = (state.keys.ArrowDown || state.keys.s ? 1 : 0) - (state.keys.ArrowUp || state.keys.w ? 1 : 0);
    const length = Math.hypot(dx, dy) || 1;
    state.player.x = Math.max(35, Math.min(865, state.player.x + (dx / length) * state.player.speed * dt));
    state.player.y = Math.max(45, Math.min(515, state.player.y + (dy / length) * state.player.speed * dt));

    for (const hazard of state.hazards) {
      hazard.x += hazard.vx * dt;
      if (hazard.x < 80 || hazard.x + hazard.w > 820) hazard.vx *= -1;
      const nearestX = Math.max(hazard.x, Math.min(state.player.x, hazard.x + hazard.w));
      const nearestY = Math.max(hazard.y, Math.min(state.player.y, hazard.y + hazard.h));
      if (Math.hypot(state.player.x - nearestX, state.player.y - nearestY) < state.player.r) {
        resetRoom();
        break;
      }
    }

    for (const fix of state.fixes) {
      if (!fix.collected && Math.hypot(state.player.x - fix.x, state.player.y - fix.y) < state.player.r + 18) {
        fix.collected = true;
        state.score += 40;
        state.message = `Collected ${fix.label}. ${state.fixes.filter((item) => !item.collected).length} fixes left.`;
      }
    }

    const allCollected = state.fixes.every((fix) => fix.collected);
    if (allCollected && state.player.x > 825 && state.player.y > 220 && state.player.y < 340) {
      advanceRoom();
    } else if (allCollected) {
      state.message = "Door unlocked. Move to the right-side exit.";
    }
  }

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = stateRef.current;
    const room = rooms[state.room];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#121827");
    gradient.addColorStop(1, "#090b14");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    for (let x = 40; x < 900; x += 70) {
      ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x, 540); ctx.stroke();
    }
    ctx.fillStyle = "#fffaf4";
    ctx.font = "900 28px Inter, sans-serif";
    ctx.fillText(room.name, 36, 42);
    ctx.font = "700 14px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,250,244,.66)";
    ctx.fillText(room.objective, 36, 66);
    ctx.fillStyle = state.fixes.every((fix) => fix.collected) ? "#bff3d2" : "rgba(255,255,255,.12)";
    ctx.fillRect(840, 220, 28, 120);
    ctx.fillStyle = "#07121f";
    ctx.font = "900 12px Inter, sans-serif";
    ctx.save();
    ctx.translate(859, 315);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("EXIT", 0, 0);
    ctx.restore();
    for (const hazard of state.hazards) {
      ctx.fillStyle = "#ff6b7a";
      ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
      ctx.fillStyle = "#19050a";
      ctx.font = "900 12px Inter, sans-serif";
      ctx.fillText(room.bug, hazard.x + 12, hazard.y + 19);
    }
    for (const fix of state.fixes) {
      if (fix.collected) continue;
      ctx.beginPath();
      ctx.arc(fix.x, fix.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#ffc76b";
      ctx.fill();
      ctx.fillStyle = "#130c05";
      ctx.font = "900 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(fix.label, fix.x, fix.y + 4);
      ctx.textAlign = "left";
    }
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
    ctx.fillStyle = "#75c7b1";
    ctx.fill();
    ctx.strokeStyle = "#fffaf4";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fffaf4";
    ctx.font = "900 15px Inter, sans-serif";
    ctx.fillText(`Score ${state.score}`, 36, 542);
    ctx.fillText(`Health ${state.health}`, 150, 542);
    ctx.fillText(`Room ${state.room + 1}/${rooms.length}`, 250, 542);
    if (state.mode === "menu" || state.mode === "won") {
      ctx.fillStyle = "rgba(8,8,18,.78)";
      ctx.fillRect(0, 0, 900, 560);
      ctx.fillStyle = "#fffaf4";
      ctx.font = "950 58px Inter, sans-serif";
      ctx.fillText(state.mode === "won" ? "QA Dungeon Escaped" : "Debug Dungeon", 92, 245);
      ctx.font = "700 20px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,250,244,.74)";
      ctx.fillText(state.mode === "won" ? "Final report: defects fixed, route clear, score banked." : "Move with WASD or arrows. Collect fixes. Avoid bugs. Exit right.", 96, 288);
    }
  }

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      update(dt);
      render();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "f") canvasRef.current?.requestFullscreen?.();
      stateRef.current.keys[event.key] = true;
    };
    const up = (event: KeyboardEvent) => {
      stateRef.current.keys[event.key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    window.render_game_to_text = () => {
      const state = stateRef.current;
      return JSON.stringify({
        coordinateSystem: "Canvas 900x560, origin top-left, x right, y down",
        mode: state.mode,
        room: rooms[state.room].name,
        player: state.player,
        score: state.score,
        health: state.health,
        fixesLeft: state.fixes.filter((fix) => !fix.collected).map((fix) => ({ x: fix.x, y: fix.y, label: fix.label })),
        hazards: state.hazards,
        message: state.message,
      });
    };
    window.advanceTime = (ms: number) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let step = 0; step < steps; step += 1) update(1 / 60);
      render();
    };
  }, []);

  const state = stateRef.current;
  return (
    <div className="game-shell">
      <header className="site-header">
        <a className="brand" href="https://foxandhenllc.com"><span className="brand-mark">F&amp;H</span><span><strong>Fox &amp; Hen</strong><small>Debug Dungeon</small></span></a>
        <nav><a href="#play">Play</a><a className="nav-button" href="https://github.com/foxandhenllc/foxhen-debug-dungeon">Repository</a></nav>
      </header>
      <main>
        <aside className="game-info">
          <p>Playable QA game</p>
          <h1>Fix bugs to escape the dungeon.</h1>
          <p className="lede">Each room represents a website defect. Collect the fixes, avoid moving bug bars, then exit through the unlocked right-side door.</p>
          <div className="controls"><span>Move: WASD / arrows</span><span>Fullscreen: F</span><span>Goal: collect all fixes and exit</span></div>
          <div className="action-row"><button id="start-btn" onClick={startGame}>Start / restart</button><button onClick={() => { stateRef.current.mode = "menu"; sync(); }}>Pause to menu</button></div>
          <div className="stat-grid"><article><span>Score</span><strong>{state.score}</strong><small>fixes collected</small></article><article><span>Health</span><strong>{state.health}</strong><small>bug hits left</small></article><article><span>Room</span><strong>{state.room + 1}/4</strong><small>{rooms[state.room].name}</small></article><article><span>Status</span><strong>{state.mode}</strong><small>{state.message}</small></article></div>
        </aside>
        <section id="play" className="game-card"><canvas ref={canvasRef} width={900} height={560} /></section>
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
