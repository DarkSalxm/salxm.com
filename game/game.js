/* =====================================================================
   DARKTRIS — DarkSalxm
   - Standard 10x20 board, 7-bag randomizer, SRS-ish rotations + kicks
   - Hold, ghost piece, hard drop, soft drop, lock delay
   - Endless levels (speed asymptotically approaches floor)
   - Leaderboard in localStorage (top 25)
   ===================================================================== */

(() => {
  // ----- constants -----
  const COLS = 10;
  const ROWS = 20;
  const CELL = 30;            // px on desktop board
  const NEXT_CELL = 22;
  const HOLD_CELL = 22;
  const LB_KEY = "darktris_leaderboard_v1";
  const LB_SIZE = 25;

  // colors keyed by piece — gothic palette
  const COLORS = {
    I: { fill: "#2dffa6", glow: "rgba(45, 255, 166, 0.6)" },   // emerald
    O: { fill: "#d4af37", glow: "rgba(212, 175, 55, 0.6)" },   // gold
    T: { fill: "#a45ee5", glow: "rgba(164, 94, 229, 0.55)" },  // wraith violet
    S: { fill: "#5fd1a1", glow: "rgba(95, 209, 161, 0.55)" },  // poison
    Z: { fill: "#e63950", glow: "rgba(230, 57, 80, 0.6)" },    // blood
    J: { fill: "#5a9bff", glow: "rgba(90, 155, 255, 0.55)" },  // soul blue
    L: { fill: "#ff8a3d", glow: "rgba(255, 138, 61, 0.55)" },  // ember
    GHOST: { fill: "rgba(236, 228, 210, 0.1)", stroke: "rgba(236, 228, 210, 0.3)" }
  };

  // SRS-ish tetromino definitions; each piece has 4 rotation states as 4x4 cell coords
  const PIECES = {
    I: [
      [[0,1],[1,1],[2,1],[3,1]],
      [[2,0],[2,1],[2,2],[2,3]],
      [[0,2],[1,2],[2,2],[3,2]],
      [[1,0],[1,1],[1,2],[1,3]]
    ],
    O: [
      [[1,0],[2,0],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[2,1]]
    ],
    T: [
      [[1,0],[0,1],[1,1],[2,1]],
      [[1,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[2,1],[1,2]],
      [[1,0],[0,1],[1,1],[1,2]]
    ],
    S: [
      [[1,0],[2,0],[0,1],[1,1]],
      [[1,0],[1,1],[2,1],[2,2]],
      [[1,1],[2,1],[0,2],[1,2]],
      [[0,0],[0,1],[1,1],[1,2]]
    ],
    Z: [
      [[0,0],[1,0],[1,1],[2,1]],
      [[2,0],[1,1],[2,1],[1,2]],
      [[0,1],[1,1],[1,2],[2,2]],
      [[1,0],[0,1],[1,1],[0,2]]
    ],
    J: [
      [[0,0],[0,1],[1,1],[2,1]],
      [[1,0],[2,0],[1,1],[1,2]],
      [[0,1],[1,1],[2,1],[2,2]],
      [[1,0],[1,1],[0,2],[1,2]]
    ],
    L: [
      [[2,0],[0,1],[1,1],[2,1]],
      [[1,0],[1,1],[1,2],[2,2]],
      [[0,1],[1,1],[2,1],[0,2]],
      [[0,0],[1,0],[1,1],[1,2]]
    ]
  };

  // basic wall kick offsets (simplified SRS, common kicks)
  const KICKS = [
    [0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1]
  ];

  // ----- DOM -----
  const $ = sel => document.querySelector(sel);
  const screens = {
    intro: $("#intro"),
    game:  $("#game"),
    board: $("#board-screen")
  };
  const boardCanvas = $("#board");
  const nextCanvas  = $("#nextCanvas");
  const holdCanvas  = $("#holdCanvas");
  const ctx     = boardCanvas.getContext("2d");
  const nctx    = nextCanvas.getContext("2d");
  const hctx    = holdCanvas.getContext("2d");

  const ui = {
    score: $("#scoreVal"),
    level: $("#levelVal"),
    lines: $("#linesVal"),
    high:  $("#highVal"),
    who:   $("#whoLabel"),
    overlay: $("#overlay"),
    overlayTitle: $("#overlayTitle"),
    overlayBody:  $("#overlayBody"),
    overlayBtn:   $("#overlayBtn"),
    lbBody: $("#lbBody")
  };

  // ----- state -----
  let grid;                // 2D ROWS x COLS of {color} or null
  let bag = [];
  let active;              // {type, rot, x, y}
  let nextQueue = [];      // upcoming 5 pieces
  let hold = null;
  let holdUsed = false;
  let score = 0;
  let lines = 0;
  let level = 1;
  let player = "Anonymous Soul";
  let running = false;
  let paused = false;
  let gameOver = false;
  let dropTimer = 0;
  let lockTimer = 0;
  let LOCK_DELAY = 500;    // ms
  let lastTime = 0;
  let combo = -1;          // chain counter
  let board2dKey = 0;      // increments on flash to reset animation

  // ----- screen routing -----
  function showScreen(name) {
    Object.entries(screens).forEach(([k, el]) => {
      el.classList.toggle("screen-active", k === name);
    });
  }

  // ----- leaderboard -----
  function loadBoard() {
    try {
      const raw = localStorage.getItem(LB_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function saveBoard(list) {
    try { localStorage.setItem(LB_KEY, JSON.stringify(list)); } catch {}
  }
  function recordRun({ name, score, level, lines }) {
    const list = loadBoard();
    const entry = { name, score, level, lines, at: Date.now() };
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    const trimmed = list.slice(0, LB_SIZE);
    saveBoard(trimmed);
    return { list: trimmed, rank: trimmed.indexOf(entry) }; // -1 if not in top
  }
  function highScore() {
    const list = loadBoard();
    return list.length ? list[0].score : 0;
  }
  function renderBoard(highlightEntry = null) {
    const list = loadBoard();
    if (!list.length) {
      ui.lbBody.innerHTML = `<div class="lb-row lb-empty">— the ledger is empty. claim it. —</div>`;
      return;
    }
    ui.lbBody.innerHTML = list.map((e, i) => {
      const classes = ["lb-row"];
      if (i === 0) classes.push("gold");
      else if (i === 1) classes.push("silver");
      else if (i === 2) classes.push("bronze");
      if (highlightEntry && e.at === highlightEntry.at && e.name === highlightEntry.name) {
        classes.push("you");
      }
      return `
        <div class="${classes.join(" ")}">
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-name">${escapeHTML(e.name)}</span>
          <span class="lb-score">${e.score.toLocaleString()}</span>
          <span class="lb-lvl">${e.level}</span>
          <span class="lb-lines">${e.lines}</span>
        </div>`;
    }).join("");
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  // ----- piece generation: 7-bag -----
  function refillBag() {
    const next = ["I","O","T","S","Z","J","L"];
    // shuffle
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    bag.push(...next);
  }
  function nextPieceType() {
    if (bag.length < 7) refillBag();
    return bag.shift();
  }
  function spawnPiece(type) {
    const piece = {
      type,
      rot: 0,
      x: 3,
      y: -1   // top edge; will display from row 0
    };
    // I and O start a bit higher so they're visible
    return piece;
  }
  function ensureQueue() {
    while (nextQueue.length < 5) nextQueue.push(nextPieceType());
  }

  // ----- collision / movement -----
  function cellsOf(piece) {
    return PIECES[piece.type][piece.rot].map(([cx, cy]) => [piece.x + cx, piece.y + cy]);
  }
  function valid(piece) {
    return cellsOf(piece).every(([x, y]) => {
      if (x < 0 || x >= COLS || y >= ROWS) return false;
      if (y < 0) return true;                  // above-top cells are allowed during spawn
      return grid[y][x] === null;
    });
  }
  function tryMove(dx, dy) {
    const moved = { ...active, x: active.x + dx, y: active.y + dy };
    if (valid(moved)) {
      active = moved;
      if (dy !== 0) lockTimer = 0; // reset lock timer on downward motion that succeeded
      return true;
    }
    return false;
  }
  function tryRotate(dir) {
    const newRot = (active.rot + dir + 4) % 4;
    for (const [kx, ky] of KICKS) {
      const test = { ...active, rot: newRot, x: active.x + kx, y: active.y + ky };
      if (valid(test)) {
        active = test;
        lockTimer = 0;
        return true;
      }
    }
    return false;
  }
  function ghostY() {
    let g = { ...active };
    while (true) {
      const test = { ...g, y: g.y + 1 };
      if (!valid(test)) break;
      g = test;
    }
    return g.y;
  }
  function hardDrop() {
    const start = active.y;
    active.y = ghostY();
    score += (active.y - start) * 2;
    lockPiece();
  }
  function holdPiece() {
    if (holdUsed) return;
    const cur = active.type;
    if (hold === null) {
      hold = cur;
      newActive();
    } else {
      const swap = hold;
      hold = cur;
      active = spawnPiece(swap);
      if (!valid(active)) endGame();
    }
    holdUsed = true;
    drawSide();
  }
  function newActive() {
    ensureQueue();
    active = spawnPiece(nextQueue.shift());
    ensureQueue();
    holdUsed = false;
    lockTimer = 0;
    dropTimer = 0;
    if (!valid(active)) endGame();
    drawSide();
  }

  // ----- lock + line clear -----
  function lockPiece() {
    cellsOf(active).forEach(([x, y]) => {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) grid[y][x] = active.type;
    });
    const cleared = clearLines();
    awardScore(cleared);
    if (cleared > 0) board2dKey++;
    newActive();
  }
  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y].every(c => c !== null)) {
        grid.splice(y, 1);
        grid.unshift(Array(COLS).fill(null));
        cleared++;
        y++; // re-check this row index
      }
    }
    return cleared;
  }
  function awardScore(cleared) {
    if (cleared === 0) { combo = -1; return; }
    combo++;
    const base = [0, 100, 300, 500, 800][cleared] || 800;
    score += base * level;
    score += Math.max(0, combo) * 50 * level;   // combo bonus
    lines += cleared;
    // endless level: every 10 lines = next level, no cap
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) {
      level = newLevel;
      flashBoard();
    }
    updateHUD();
  }
  function dropInterval() {
    // endless curve: starts ~800ms at lvl 1, asymptotes toward ~60ms
    // f(L) = max(60, 800 * 0.85^(L-1))
    return Math.max(60, 800 * Math.pow(0.85, level - 1));
  }

  // ----- drawing -----
  function drawCell(c, x, y, type, opts = {}) {
    const px = x * CELL, py = y * CELL;
    const col = COLORS[type];
    if (!col) return;
    // outer
    c.fillStyle = col.fill;
    c.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    // inner shading (gothic bevel)
    const grad = c.createLinearGradient(px, py, px, py + CELL);
    grad.addColorStop(0, "rgba(255,255,255,0.18)");
    grad.addColorStop(0.5, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.45)");
    c.fillStyle = grad;
    c.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    // border
    c.strokeStyle = "rgba(0,0,0,0.5)";
    c.lineWidth = 1;
    c.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
    // glow if active
    if (opts.glow) {
      c.save();
      c.globalCompositeOperation = "lighter";
      c.fillStyle = col.glow;
      c.fillRect(px + 6, py + 6, CELL - 12, CELL - 12);
      c.restore();
    }
  }
  function drawGhost(c, x, y) {
    const px = x * CELL, py = y * CELL;
    c.fillStyle = COLORS.GHOST.fill;
    c.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
    c.strokeStyle = COLORS.GHOST.stroke;
    c.setLineDash([3, 3]);
    c.lineWidth = 1;
    c.strokeRect(px + 2.5, py + 2.5, CELL - 5, CELL - 5);
    c.setLineDash([]);
  }

  function drawBoard() {
    // clear
    ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

    // settled cells
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = grid[y][x];
        if (cell) drawCell(ctx, x, y, cell);
      }
    }

    if (!active) return;

    // ghost
    const gy = ghostY();
    if (gy !== active.y) {
      cellsOf({ ...active, y: gy }).forEach(([x, y]) => {
        if (y >= 0) drawGhost(ctx, x, y);
      });
    }

    // active piece (with glow)
    cellsOf(active).forEach(([x, y]) => {
      if (y >= 0) drawCell(ctx, x, y, active.type, { glow: true });
    });
  }

  function drawMini(c, type, cellSize, w, h) {
    c.clearRect(0, 0, w, h);
    if (!type) return;
    const shape = PIECES[type][0];
    // compute bbox to center
    let minX = 4, minY = 4, maxX = -1, maxY = -1;
    shape.forEach(([x, y]) => {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    });
    const pw = (maxX - minX + 1) * cellSize;
    const ph = (maxY - minY + 1) * cellSize;
    const offX = (w - pw) / 2 - minX * cellSize;
    const offY = (h - ph) / 2 - minY * cellSize;
    const col = COLORS[type];
    shape.forEach(([x, y]) => {
      const px = offX + x * cellSize, py = offY + y * cellSize;
      c.fillStyle = col.fill;
      c.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
      const grad = c.createLinearGradient(px, py, px, py + cellSize);
      grad.addColorStop(0, "rgba(255,255,255,0.2)");
      grad.addColorStop(1, "rgba(0,0,0,0.4)");
      c.fillStyle = grad;
      c.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
      c.strokeStyle = "rgba(0,0,0,0.5)";
      c.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
    });
  }

  function drawSide() {
    // hold
    drawMini(hctx, hold, HOLD_CELL, holdCanvas.width, holdCanvas.height);
    // next queue (3 visible)
    nctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const slotH = nextCanvas.height / 3;
    for (let i = 0; i < 3 && i < nextQueue.length; i++) {
      const subCanvas = document.createElement("canvas");
      subCanvas.width = nextCanvas.width;
      subCanvas.height = slotH;
      const sctx = subCanvas.getContext("2d");
      drawMini(sctx, nextQueue[i], NEXT_CELL, nextCanvas.width, slotH);
      nctx.drawImage(subCanvas, 0, i * slotH);
    }
  }

  // ----- HUD / overlays -----
  function updateHUD() {
    ui.score.textContent = score.toLocaleString();
    ui.level.textContent = level;
    ui.lines.textContent = lines;
    ui.high.textContent = Math.max(highScore(), score).toLocaleString();
  }
  function flashBoard() {
    boardCanvas.classList.remove("flash");
    void boardCanvas.offsetWidth;
    boardCanvas.classList.add("flash");
  }
  function showOverlay(title, body, btn = "Resume", onClick) {
    ui.overlayTitle.textContent = title;
    ui.overlayBody.textContent = body;
    ui.overlayBtn.textContent = btn;
    ui.overlay.classList.remove("hidden");
    ui.overlayBtn.onclick = onClick || (() => {
      ui.overlay.classList.add("hidden");
      paused = false;
      lastTime = performance.now();
    });
  }
  function hideOverlay() { ui.overlay.classList.add("hidden"); }

  // ----- game lifecycle -----
  function resetState() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    bag = [];
    nextQueue = [];
    hold = null;
    holdUsed = false;
    score = 0;
    lines = 0;
    level = 1;
    combo = -1;
    paused = false;
    gameOver = false;
    refillBag();
    ensureQueue();
    newActive();
    updateHUD();
    drawBoard();
    drawSide();
  }
  function startGame() {
    showScreen("game");
    resetState();
    ui.who.textContent = player;
    hideOverlay();
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
  function endGame() {
    if (gameOver) return;
    gameOver = true;
    running = false;
    const { rank } = recordRun({ name: player, score, level, lines });
    const msg = rank === 0
      ? "A new sovereign of the void. The ledger trembles."
      : rank > 0 && rank < LB_SIZE
        ? `You take rank #${rank + 1}. The damned remember you.`
        : "The void claims another. Try again, mortal.";
    showOverlay(
      "DAMNED",
      msg,
      "View the Ledger",
      () => { renderBoard(); showScreen("board"); }
    );
  }
  function togglePause() {
    if (gameOver || !running) return;
    paused = !paused;
    if (paused) {
      showOverlay("PAUSED", "The void waits.", "Resume");
    } else {
      hideOverlay();
      lastTime = performance.now();
    }
  }

  // ----- main loop -----
  function loop(t) {
    if (!running) return;
    const dt = t - lastTime;
    lastTime = t;
    if (!paused && !gameOver) {
      dropTimer += dt;
      const interval = dropInterval();
      if (dropTimer >= interval) {
        dropTimer = 0;
        if (!tryMove(0, 1)) {
          // touching ground — start/continue lock timer
          lockTimer += interval;
          if (lockTimer >= LOCK_DELAY) {
            lockPiece();
          }
        } else {
          lockTimer = 0;
        }
      }
      drawBoard();
    }
    requestAnimationFrame(loop);
  }

  // ----- input -----
  // DAS-like repeat for arrows
  const heldKeys = {};
  let dasTimers = {};
  const DAS = 140;   // initial delay before repeat
  const ARR = 40;    // repeat interval

  function handleAction(act) {
    if (!running || paused || gameOver) return;
    switch (act) {
      case "left":   tryMove(-1, 0); break;
      case "right":  tryMove(1, 0); break;
      case "soft":   if (tryMove(0, 1)) score += 1; break;
      case "rotate": tryRotate(1); break;
      case "rotateCCW": tryRotate(-1); break;
      case "hard":   hardDrop(); break;
      case "hold":   holdPiece(); break;
    }
    drawBoard();
    updateHUD();
  }

  window.addEventListener("keydown", e => {
    // intro: enter triggers form submit naturally; do nothing else
    if (screens.intro.classList.contains("screen-active")) return;
    if (screens.board.classList.contains("screen-active")) {
      if (e.key === "Escape") { showScreen("intro"); }
      return;
    }

    if (e.repeat) return;
    if (heldKeys[e.code]) return;
    heldKeys[e.code] = true;

    switch (e.code) {
      case "ArrowLeft":
        handleAction("left");
        startRepeat("ArrowLeft", () => handleAction("left"));
        e.preventDefault();
        break;
      case "ArrowRight":
        handleAction("right");
        startRepeat("ArrowRight", () => handleAction("right"));
        e.preventDefault();
        break;
      case "ArrowDown":
        handleAction("soft");
        startRepeat("ArrowDown", () => handleAction("soft"), 50);
        e.preventDefault();
        break;
      case "ArrowUp":
      case "KeyX":
        handleAction("rotate"); e.preventDefault(); break;
      case "KeyZ":
        handleAction("rotateCCW"); e.preventDefault(); break;
      case "Space":
        handleAction("hard"); e.preventDefault(); break;
      case "ShiftLeft":
      case "ShiftRight":
      case "KeyC":
        handleAction("hold"); e.preventDefault(); break;
      case "KeyP":
      case "Escape":
        togglePause(); e.preventDefault(); break;
    }
  });

  window.addEventListener("keyup", e => {
    heldKeys[e.code] = false;
    stopRepeat(e.code);
  });

  function startRepeat(key, fn, arr = ARR) {
    stopRepeat(key);
    dasTimers[key] = setTimeout(function tick() {
      if (!heldKeys[key]) return;
      fn();
      dasTimers[key] = setTimeout(tick, arr);
    }, DAS);
  }
  function stopRepeat(key) {
    if (dasTimers[key]) { clearTimeout(dasTimers[key]); dasTimers[key] = null; }
  }

  // mobile touchpad
  document.getElementById("touchpad").addEventListener("click", e => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    handleAction(btn.dataset.act);
  });

  // ----- buttons -----
  $("#nameForm").addEventListener("submit", e => {
    e.preventDefault();
    const v = $("#playerName").value.trim();
    player = v || "Anonymous Soul";
    startGame();
  });
  $("#viewBoardBtn").addEventListener("click", () => {
    renderBoard();
    showScreen("board");
  });
  $("#lbBack").addEventListener("click", () => showScreen("intro"));
  $("#lbClear").addEventListener("click", () => {
    if (confirm("Burn the ledger? All scores will be lost to the void.")) {
      saveBoard([]);
      renderBoard();
    }
  });
  $("#quitBtn").addEventListener("click", () => {
    if (gameOver || confirm("Forfeit this run? Your soul will be tallied.")) {
      if (!gameOver) {
        if (score > 0) recordRun({ name: player, score, level, lines });
        running = false;
      }
      renderBoard();
      showScreen("board");
    }
  });

  // ----- init -----
  ui.high.textContent = highScore().toLocaleString();
  // sync next/hold canvas backing size to css size if needed (we keep fixed)
})();
