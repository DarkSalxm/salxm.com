/* ==========================================================
   DARKTRIS, DarkSalxm
   Core Tetris preserved with upgraded UI feedback and polish
   ========================================================== */

(() => {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const CELL = 30;
  const NEXT_CELL = 22;
  const HOLD_CELL = 22;
  const BOARD_W = COLS * CELL;
  const BOARD_H = ROWS * CELL;
  const NEXT_W = 120;
  const NEXT_H = 360;
  const HOLD_W = 120;
  const HOLD_H = 120;
  const LB_KEY = "darktris_leaderboard_v1";
  const SETTINGS_KEY = "darktris_settings_v2";
  const LB_SIZE = 10;
  const LOCK_DELAY = 650;
  const MAX_LOCK_RESETS = 15;
  const VISIBLE_NEXT = 5;

  const COLORS = {
    I: { fill: "#2dffa6", glow: "rgba(45,255,166,0.58)" },
    O: { fill: "#d4af37", glow: "rgba(212,175,55,0.58)" },
    T: { fill: "#a45ee5", glow: "rgba(164,94,229,0.54)" },
    S: { fill: "#5fd1a1", glow: "rgba(95,209,161,0.54)" },
    Z: { fill: "#e63950", glow: "rgba(230,57,80,0.62)" },
    J: { fill: "#5a9bff", glow: "rgba(90,155,255,0.54)" },
    L: { fill: "#ff8a3d", glow: "rgba(255,138,61,0.54)" },
    GHOST: { fill: "rgba(242,234,215,0.08)", stroke: "rgba(242,234,215,0.33)" }
  };

  const PIECES = {
    I: [
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[1, 0], [1, 1], [1, 2], [1, 3]]
    ],
    O: [
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]]
    ],
    T: [
      [[1, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [1, 2]],
      [[1, 0], [0, 1], [1, 1], [1, 2]]
    ],
    S: [
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[1, 1], [2, 1], [0, 2], [1, 2]],
      [[0, 0], [0, 1], [1, 1], [1, 2]]
    ],
    Z: [
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[2, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 0], [0, 1], [1, 1], [0, 2]]
    ],
    J: [
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [0, 2], [1, 2]]
    ],
    L: [
      [[2, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 1], [0, 2]],
      [[0, 0], [1, 0], [1, 1], [1, 2]]
    ]
  };

  const KICKS = [
    [0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1], [0, 1]
  ];

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));

  const screens = {
    intro: $("#intro"),
    game: $("#game"),
    board: $("#board-screen")
  };

  const boardCanvas = $("#board");
  const nextCanvas = $("#nextCanvas");
  const holdCanvas = $("#holdCanvas");
  const ctx = boardCanvas.getContext("2d");
  const nctx = nextCanvas.getContext("2d");
  const hctx = holdCanvas.getContext("2d");

  const ui = {
    score: $("#scoreVal"),
    level: $("#levelVal"),
    lines: $("#linesVal"),
    combo: $("#comboVal"),
    comboSub: $("#comboSub"),
    comboPanel: $(".combo-panel"),
    high: $("#highVal"),
    miniHigh: $("#miniHighVal"),
    highSub: $("#highSub"),
    scoreFeed: $("#scoreFeed"),
    speed: $("#speedVal"),
    who: $("#whoLabel"),
    status: $("#statusPill"),
    overlay: $("#overlay"),
    overlayTitle: $("#overlayTitle"),
    overlayBody: $("#overlayBody"),
    overlayBtn: $("#overlayBtn"),
    overlayStats: $("#overlayStats"),
    finalScore: $("#finalScore"),
    finalLevel: $("#finalLevel"),
    finalLines: $("#finalLines"),
    playAgain: $("#playAgainBtn"),
    menu: $("#menuBtn"),
    lbBody: $("#lbBody"),
    lineFlash: $("#lineFlash"),
    scorePop: $("#scorePop"),
    levelBanner: $("#levelBanner"),
    holdHint: $("#holdHint")
  };

  let grid;
  let bag = [];
  let active;
  let nextQueue = [];
  let hold = null;
  let holdUsed = false;
  let score = 0;
  let lines = 0;
  let level = 1;
  let combo = -1;
  let player = "Anonymous Soul";
  let running = false;
  let paused = false;
  let gameOver = false;
  let dropTimer = 0;
  let lockTimer = 0;
  let lockResets = 0;
  let lastTime = 0;
  let highlightedEntry = null;
  let lastScore = 0;
  let clearRowsForFlash = [];
  let inputRepeatTimer = null;
  let inputRepeatInterval = null;

  const defaultSettings = {
    ghost: true,
    fx: true,
    reducedMotion: false
  };

  let settings = loadSettings();

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...defaultSettings };
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }

  function applySettings() {
    document.body.classList.toggle("fx-off", !settings.fx);
    document.body.classList.toggle("reduced-motion", settings.reducedMotion);
    const ghostToggle = $("#ghostToggle");
    const fxToggle = $("#fxToggle");
    const motionToggle = $("#motionToggle");
    if (ghostToggle) ghostToggle.checked = settings.ghost;
    if (fxToggle) fxToggle.checked = settings.fx;
    if (motionToggle) motionToggle.checked = settings.reducedMotion;
    draw();
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, element]) => {
      element.classList.toggle("screen-active", key === name);
    });
  }

  function setStatus(text) {
    ui.status.textContent = text;
  }

  function loadBoard() {
    try {
      const raw = localStorage.getItem(LB_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.slice(0, LB_SIZE);
    } catch {
      return [];
    }
  }

  function saveBoard(list) {
    try {
      localStorage.setItem(LB_KEY, JSON.stringify(list));
    } catch {}
  }

  function recordRun(entryData) {
    const list = loadBoard();
    const entry = { ...entryData, at: Date.now(), id: cryptoId() };
    list.push(entry);
    list.sort((a, b) => b.score - a.score || a.at - b.at);
    const trimmed = list.slice(0, LB_SIZE);
    saveBoard(trimmed);
    const rank = trimmed.findIndex(item => item.id === entry.id);
    return { entry, list: trimmed, rank };
  }

  function cryptoId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function highScore() {
    const list = loadBoard();
    return list.length ? Number(list[0].score) || 0 : 0;
  }

  function renderLeaderboard(highlight = highlightedEntry) {
    const list = loadBoard();
    if (!list.length) {
      ui.lbBody.innerHTML = `<div class="lb-row lb-empty">The ledger is empty. Claim it.</div>`;
      return;
    }

    ui.lbBody.innerHTML = list.map((entry, index) => {
      const classes = ["lb-row"];
      if (index === 0) classes.push("gold");
      if (index === 1) classes.push("silver");
      if (index === 2) classes.push("bronze");
      if (highlight && entry.id === highlight.id) classes.push("you");

      return `
        <div class="${classes.join(" ")}" role="row">
          <span class="lb-rank" role="cell">${index + 1}</span>
          <span class="lb-name" role="cell">${escapeHTML(entry.name)}</span>
          <span class="lb-score" role="cell">${formatNumber(entry.score)}</span>
          <span class="lb-lvl" role="cell">${entry.level}</span>
          <span class="lb-lines" role="cell">${entry.lines}</span>
        </div>
      `;
    }).join("");
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString();
  }

  function makeGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function refillBag() {
    const next = ["I", "O", "T", "S", "Z", "J", "L"];
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

  function ensureQueue() {
    while (nextQueue.length < VISIBLE_NEXT) nextQueue.push(nextPieceType());
  }

  function spawnPiece(type) {
    return {
      type,
      rot: 0,
      x: 3,
      y: type === "I" ? -1 : -1
    };
  }

  function cellsOf(piece) {
    return PIECES[piece.type][piece.rot].map(([cx, cy]) => [piece.x + cx, piece.y + cy]);
  }

  function valid(piece) {
    return cellsOf(piece).every(([x, y]) => {
      if (x < 0 || x >= COLS || y >= ROWS) return false;
      if (y < 0) return true;
      return grid[y][x] === null;
    });
  }

  function isGrounded(piece) {
    return !valid({ ...piece, y: piece.y + 1 });
  }

  function applyLockReset() {
    if (active && isGrounded(active) && lockResets < MAX_LOCK_RESETS) {
      lockTimer = 0;
      lockResets++;
    } else if (active && !isGrounded(active)) {
      lockTimer = 0;
    }
  }

  function tryMove(dx, dy) {
    if (!active || gameOver || paused) return false;
    const moved = { ...active, x: active.x + dx, y: active.y + dy };
    if (valid(moved)) {
      active = moved;
      applyLockReset();
      draw();
      return true;
    }
    return false;
  }

  function tryRotate(dir) {
    if (!active || gameOver || paused) return false;
    const newRot = (active.rot + dir + 4) % 4;
    for (const [kx, ky] of KICKS) {
      const test = { ...active, rot: newRot, x: active.x + kx, y: active.y + ky };
      if (valid(test)) {
        active = test;
        applyLockReset();
        draw();
        return true;
      }
    }
    return false;
  }

  function ghostY() {
    let ghost = { ...active };
    while (valid({ ...ghost, y: ghost.y + 1 })) {
      ghost = { ...ghost, y: ghost.y + 1 };
    }
    return ghost.y;
  }

  function hardDrop() {
    if (!active || paused || gameOver) return;
    const start = active.y;
    active.y = ghostY();
    const distance = Math.max(0, active.y - start);
    score += distance * 2;
    showScorePop(distance > 0 ? `+${distance * 2}` : "Drop");
    lockPiece();
  }

  function holdPiece() {
    if (!active || paused || gameOver || holdUsed) return;
    const current = active.type;
    if (hold === null) {
      hold = current;
      newActive();
    } else {
      const swap = hold;
      hold = current;
      active = spawnPiece(swap);
      if (!valid(active)) endGame();
    }
    holdUsed = true;
    setStatus("Held");
    updateHUD();
    drawSide();
    draw();
  }

  function newActive() {
    ensureQueue();
    active = spawnPiece(nextQueue.shift());
    ensureQueue();
    holdUsed = false;
    lockTimer = 0;
    lockResets = 0;
    dropTimer = 0;

    if (!valid(active)) {
      endGame();
      return;
    }

    drawSide();
  }

  function lockPiece() {
    if (!active || gameOver) return;
    cellsOf(active).forEach(([x, y]) => {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) grid[y][x] = active.type;
    });

    const clearedRows = findFullRows();
    clearRowsForFlash = clearedRows;
    const cleared = clearLines(clearedRows);
    awardScore(cleared);
    newActive();
    updateHUD();
    draw();
  }

  function findFullRows() {
    const full = [];
    for (let y = 0; y < ROWS; y++) {
      if (grid[y].every(cell => cell !== null)) full.push(y);
    }
    return full;
  }

  function clearLines(rows) {
    if (!rows.length) return 0;

    const rowSet = new Set(rows);
    grid = grid.filter((_, y) => !rowSet.has(y));
    while (grid.length < ROWS) grid.unshift(Array(COLS).fill(null));

    triggerLineFlash(rows);
    return rows.length;
  }

  function awardScore(cleared) {
    if (cleared === 0) {
      combo = -1;
      updateCombo();
      return;
    }

    combo += 1;
    const previousLevel = level;
    const baseScores = [0, 100, 300, 500, 800];
    const base = baseScores[cleared] || 800;
    const comboBonus = Math.max(0, combo) * 50 * level;
    const gained = base * level + comboBonus;

    score += gained;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;

    const label = cleared === 4 ? "DARKTRIS" : `${cleared} Line${cleared > 1 ? "s" : ""}`;
    showScorePop(`${label} +${formatNumber(gained)}`);

    if (level > previousLevel) showLevelBanner(level);
    if (score > highScore() && lastScore <= highScore()) celebrateHighScore();
    lastScore = score;

    updateCombo();
  }

  function updateCombo() {
    const display = Math.max(0, combo);
    ui.combo.textContent = `x${display}`;
    ui.comboSub.textContent = display > 0 ? "Chain the pain." : "Start the ritual.";
    ui.comboPanel.classList.toggle("hot", display > 0);
  }

  function dropInterval() {
    return Math.max(60, 800 * Math.pow(0.85, level - 1));
  }

  function update(time = 0) {
    if (!running) return;
    const delta = Math.min(50, time - lastTime || 0);
    lastTime = time;

    if (!paused && !gameOver && active) {
      if (isGrounded(active)) {
        lockTimer += delta;
        if (lockTimer >= LOCK_DELAY) {
          lockPiece();
        }
      } else {
        lockTimer = 0;
        dropTimer += delta;
        if (dropTimer >= dropInterval()) {
          dropTimer = 0;
          tryMove(0, 1);
        }
      }
    }

    draw();
    requestAnimationFrame(update);
  }

  function startGame(resetPlayer = false) {
    if (resetPlayer) {
      const input = $("#playerName");
      player = sanitizeName(input.value) || "Anonymous Soul";
    }

    grid = makeGrid();
    bag = [];
    nextQueue = [];
    active = null;
    hold = null;
    holdUsed = false;
    score = 0;
    lines = 0;
    level = 1;
    combo = -1;
    running = true;
    paused = false;
    gameOver = false;
    dropTimer = 0;
    lockTimer = 0;
    lastTime = 0;
    lastScore = 0;
    clearRowsForFlash = [];

    ensureQueue();
    newActive();
    updateHUD();
    drawSide();
    hideOverlay();
    ui.who.textContent = player;
    setStatus("Playing");
    showScreen("game");
    requestAnimationFrame(update);
  }

  function sanitizeName(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[<>]/g, "")
      .slice(0, 14);
  }

  function togglePause(forceValue) {
    if (!running || gameOver) return;
    paused = typeof forceValue === "boolean" ? forceValue : !paused;
    if (paused) {
      showOverlay({
        title: "Paused",
        body: "The board waits in silence.",
        primary: "Resume",
        mode: "pause"
      });
      setStatus("Paused");
    } else {
      hideOverlay();
      setStatus("Playing");
      lastTime = performance.now();
    }
    updateHUD();
  }

  function endGame() {
    if (gameOver) return;
    gameOver = true;
    paused = false;
    running = false;

    const result = recordRun({ name: player, score, level, lines });
    highlightedEntry = result.rank >= 0 ? result.entry : null;
    renderLeaderboard(highlightedEntry);
    updateFinalStats();

    let rankText;
    if (result.rank >= 0) {
      rankText = `You ranked #${result.rank + 1} in the cursed ledger.`;
    } else {
      const tenth = result.list[LB_SIZE - 1];
      const gap = tenth ? Math.max(0, tenth.score - score) : 0;
      rankText = `The ledger rejected this soul — ${formatNumber(gap)} short of the top ${LB_SIZE}.`;
    }
    showOverlay({
      title: "Game Over",
      body: `${rankText} Final score: ${formatNumber(score)}.`,
      primary: "View Ledger",
      mode: "gameover"
    });
    setStatus("Game Over");
    updateHUD();
  }

  function updateFinalStats() {
    ui.finalScore.textContent = formatNumber(score);
    ui.finalLevel.textContent = level;
    ui.finalLines.textContent = lines;
  }

  function showOverlay({ title, body, primary, mode }) {
    ui.overlayTitle.textContent = title;
    ui.overlayBody.textContent = body;
    ui.overlayBtn.textContent = primary;
    ui.overlay.dataset.mode = mode;
    ui.overlay.classList.remove("hidden");

    const isGameOver = mode === "gameover";
    ui.overlayStats.hidden = !isGameOver;
    ui.playAgain.hidden = !isGameOver;
    ui.menu.hidden = false;

    if (isGameOver) updateFinalStats();
  }

  function hideOverlay() {
    ui.overlay.classList.add("hidden");
  }

  function updateHUD() {
    ui.score.textContent = formatNumber(score);
    ui.level.textContent = level;
    ui.lines.textContent = lines;
    ui.high.textContent = formatNumber(Math.max(highScore(), score));
    ui.miniHigh.textContent = formatNumber(Math.max(highScore(), score));
    ui.speed.textContent = `${Math.round(dropInterval())}ms`;
    ui.holdHint.textContent = holdUsed ? "Locked" : "Shift";
    ui.scoreFeed.textContent = score > 0 ? "The abyss is eating." : "Feed the abyss.";
    ui.highSub.textContent = score >= highScore() && score > 0 ? "New throne?" : "Local throne";
    $("#pauseBtn").textContent = paused ? "Resume" : "Pause";
    updateCombo();
  }

  function draw() {
    drawBoardBackground();
    drawGridBlocks();

    if (active && settings.ghost && !gameOver) {
      const ghostPiece = { ...active, y: ghostY() };
      drawPiece(ctx, ghostPiece, { ghost: true });
    }

    if (active && !gameOver) drawPiece(ctx, active, { glow: true });
  }

  function drawBoardBackground() {
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);

    const bg = ctx.createLinearGradient(0, 0, 0, BOARD_H);
    bg.addColorStop(0, "#09070d");
    bg.addColorStop(0.55, "#050408");
    bg.addColorStop(1, "#030205");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    ctx.save();
    ctx.strokeStyle = "rgba(242,234,215,0.055)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, BOARD_H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(BOARD_W, y * CELL + 0.5);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#b3001b";
    ctx.font = "900 76px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⛧", BOARD_W / 2, BOARD_H / 2);
    ctx.restore();
  }

  function drawGridBlocks() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = grid[y][x];
        if (type) drawCell(ctx, x, y, type, { settled: true });
      }
    }
  }

  function drawPiece(context, piece, options = {}) {
    const cells = cellsOf(piece);
    cells.forEach(([x, y]) => {
      if (y >= 0) drawCell(context, x, y, options.ghost ? "GHOST" : piece.type, options);
    });
  }

  function drawCell(context, x, y, type, options = {}) {
    const px = x * CELL;
    const py = y * CELL;
    const color = COLORS[type];
    if (!color) return;

    if (type === "GHOST") {
      context.save();
      context.fillStyle = color.fill;
      context.strokeStyle = color.stroke;
      context.lineWidth = 2;
      roundedRect(context, px + 5, py + 5, CELL - 10, CELL - 10, 5);
      context.fill();
      context.stroke();
      context.restore();
      return;
    }

    context.save();
    context.shadowColor = options.glow ? color.glow : "transparent";
    context.shadowBlur = options.glow ? 16 : 0;

    const blockGrad = context.createLinearGradient(px, py, px, py + CELL);
    blockGrad.addColorStop(0, lighten(color.fill, 0.28));
    blockGrad.addColorStop(0.5, color.fill);
    blockGrad.addColorStop(1, darken(color.fill, 0.34));

    context.fillStyle = blockGrad;
    roundedRect(context, px + 2, py + 2, CELL - 4, CELL - 4, 6);
    context.fill();

    context.shadowBlur = 0;
    context.strokeStyle = "rgba(255,255,255,0.18)";
    context.lineWidth = 1;
    roundedRect(context, px + 2.5, py + 2.5, CELL - 5, CELL - 5, 6);
    context.stroke();

    context.strokeStyle = "rgba(0,0,0,0.46)";
    context.strokeRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3);

    context.fillStyle = "rgba(255,255,255,0.16)";
    context.fillRect(px + 6, py + 5, CELL - 12, 3);

    context.restore();
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function lighten(hex, amount) {
    return shade(hex, amount);
  }

  function darken(hex, amount) {
    return shade(hex, -amount);
  }

  function shade(hex, amount) {
    const value = parseInt(hex.replace("#", ""), 16);
    let r = (value >> 16) & 255;
    let g = (value >> 8) & 255;
    let b = value & 255;
    r = Math.max(0, Math.min(255, Math.round(r + (amount * 255))));
    g = Math.max(0, Math.min(255, Math.round(g + (amount * 255))));
    b = Math.max(0, Math.min(255, Math.round(b + (amount * 255))));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawSide() {
    drawHold();
    drawNext();
  }

  function drawMiniBackground(context, w, h) {
    context.clearRect(0, 0, w, h);
    const bg = context.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "rgba(14,10,18,0.94)");
    bg.addColorStop(1, "rgba(4,3,6,0.96)");
    context.fillStyle = bg;
    context.fillRect(0, 0, w, h);
    context.strokeStyle = "rgba(242,234,215,0.08)";
    context.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  function drawHold() {
    drawMiniBackground(hctx, HOLD_W, HOLD_H);
    if (!hold) {
      hctx.save();
      hctx.fillStyle = "rgba(242,234,215,0.34)";
      hctx.font = "12px JetBrains Mono, monospace";
      hctx.textAlign = "center";
      hctx.fillText("EMPTY", HOLD_W / 2, HOLD_H / 2);
      hctx.restore();
      return;
    }
    drawPreviewPiece(hctx, hold, HOLD_CELL, HOLD_W / 2, HOLD_H / 2);
  }

  function drawNext() {
    drawMiniBackground(nctx, NEXT_W, NEXT_H);
    nextQueue.slice(0, VISIBLE_NEXT).forEach((type, index) => {
      drawPreviewPiece(nctx, type, NEXT_CELL, NEXT_W / 2, 46 + index * 66);
    });
  }

  function drawPreviewPiece(context, type, cellSize, centerX, centerY) {
    const shape = PIECES[type][0];
    const xs = shape.map(([x]) => x);
    const ys = shape.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = (maxX - minX + 1) * cellSize;
    const height = (maxY - minY + 1) * cellSize;
    const startX = centerX - width / 2;
    const startY = centerY - height / 2;

    shape.forEach(([x, y]) => {
      drawPreviewCell(context, startX + (x - minX) * cellSize, startY + (y - minY) * cellSize, cellSize, type);
    });
  }

  function drawPreviewCell(context, px, py, size, type) {
    const color = COLORS[type];
    context.save();
    context.shadowColor = color.glow;
    context.shadowBlur = 10;
    const grad = context.createLinearGradient(px, py, px, py + size);
    grad.addColorStop(0, lighten(color.fill, 0.24));
    grad.addColorStop(1, darken(color.fill, 0.26));
    context.fillStyle = grad;
    roundedRect(context, px + 1, py + 1, size - 2, size - 2, 5);
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(0,0,0,0.5)";
    context.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
    context.restore();
  }

  function triggerLineFlash(rows) {
    if (!settings.fx || settings.reducedMotion || !rows.length) return;
    const boardRect = boardCanvas.getBoundingClientRect();
    const wrapRect = ui.lineFlash.parentElement.getBoundingClientRect();
    const scale = boardRect.height / (ROWS * CELL);
    const firstRow = rows[0];
    ui.lineFlash.style.top = `${boardRect.top - wrapRect.top + firstRow * CELL * scale}px`;
    ui.lineFlash.style.height = `${CELL * rows.length * scale}px`;
    ui.lineFlash.classList.remove("active");
    void ui.lineFlash.offsetWidth;
    ui.lineFlash.classList.add("active");
  }

  function showScorePop(text) {
    if (!settings.fx || settings.reducedMotion) return;
    ui.scorePop.textContent = text;
    ui.scorePop.classList.remove("active");
    void ui.scorePop.offsetWidth;
    ui.scorePop.classList.add("active");
  }

  function showLevelBanner(newLevel) {
    if (!settings.fx || settings.reducedMotion) return;
    ui.levelBanner.textContent = `Level ${newLevel}`;
    ui.levelBanner.classList.remove("active");
    void ui.levelBanner.offsetWidth;
    ui.levelBanner.classList.add("active");
    setStatus(`Level ${newLevel}`);
  }

  function celebrateHighScore() {
    if (!settings.fx || settings.reducedMotion) return;
    ui.highSub.textContent = "New throne claimed";
    showScorePop("New High Score");
  }

  function handleKeydown(event) {
    const activeElement = document.activeElement;
    const typing = activeElement && ["INPUT", "TEXTAREA"].includes(activeElement.tagName);
    if (typing) return;

    if (document.querySelector("dialog[open]")) return;

    if (!screens.game.classList.contains("screen-active")) return;

    const key = event.key.toLowerCase();
    const gameKeys = ["arrowleft", "arrowright", "arrowdown", "arrowup", " ", "spacebar", "shift", "c", "x", "z", "p", "escape"];
    if (gameKeys.includes(key)) event.preventDefault();

    if (!running && key !== "p") return;

    switch (key) {
      case "arrowleft":
        tryMove(-1, 0);
        break;
      case "arrowright":
        tryMove(1, 0);
        break;
      case "arrowdown":
        if (tryMove(0, 1)) {
          score += 1;
          updateHUD();
        }
        break;
      case "arrowup":
      case "x":
        tryRotate(1);
        break;
      case "z":
        tryRotate(-1);
        break;
      case " ":
      case "spacebar":
        hardDrop();
        break;
      case "shift":
      case "c":
        holdPiece();
        break;
      case "p":
      case "escape":
        togglePause();
        break;
    }
  }

  function bindTouchControls() {
    $$(".tbtn[data-act]").forEach(button => {
      const action = button.dataset.act;

      button.addEventListener("pointerdown", event => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        button.classList.add("is-pressed");
        runTouchAction(action);

        if (["left", "right", "soft"].includes(action)) {
          clearTouchRepeat();
          inputRepeatTimer = setTimeout(() => {
            inputRepeatInterval = setInterval(() => runTouchAction(action), action === "soft" ? 55 : 92);
          }, 210);
        }
      });

      const stop = () => {
        button.classList.remove("is-pressed");
        clearTouchRepeat();
      };

      button.addEventListener("pointerup", stop);
      button.addEventListener("pointercancel", stop);
      button.addEventListener("pointerleave", stop);
    });
  }

  function clearTouchRepeat() {
    clearTimeout(inputRepeatTimer);
    clearInterval(inputRepeatInterval);
    inputRepeatTimer = null;
    inputRepeatInterval = null;
  }

  function runTouchAction(action) {
    if (!running || paused || gameOver) return;
    if (action === "left") tryMove(-1, 0);
    if (action === "right") tryMove(1, 0);
    if (action === "rotate") tryRotate(1);
    if (action === "soft") {
      if (tryMove(0, 1)) {
        score += 1;
        updateHUD();
      }
    }
    if (action === "hard") hardDrop();
    if (action === "hold") holdPiece();
  }

  function bindUI() {
    $("#nameForm").addEventListener("submit", event => {
      event.preventDefault();
      startGame(true);
    });

    $("#viewBoardBtn").addEventListener("click", () => {
      renderLeaderboard();
      showScreen("board");
    });

    $("#lbBack").addEventListener("click", () => showScreen("intro"));

    $("#quitBtn").addEventListener("click", () => {
      if (running && !gameOver) {
        const confirmed = window.confirm("Forfeit this run and return to the pact?");
        if (!confirmed) return;
      }
      running = false;
      paused = false;
      gameOver = false;
      hideOverlay();
      showScreen("intro");
      setStatus("Ready");
    });

    $("#pauseBtn").addEventListener("click", () => togglePause());

    ui.overlayBtn.addEventListener("click", () => {
      const mode = ui.overlay.dataset.mode;
      if (mode === "pause") togglePause(false);
      if (mode === "gameover") showScreen("board");
    });

    ui.playAgain.addEventListener("click", () => startGame(false));

    ui.menu.addEventListener("click", () => {
      running = false;
      paused = false;
      gameOver = false;
      hideOverlay();
      showScreen("intro");
      setStatus("Ready");
    });

    bindDialog("#guideDialog", "#openGuideBtn", "#closeGuideBtn");
    bindDialog("#settingsDialog", "#settingsBtn", "#closeSettingsBtn");

    $("#ghostToggle").addEventListener("change", event => {
      settings.ghost = event.target.checked;
      saveSettings();
      applySettings();
    });

    $("#fxToggle").addEventListener("change", event => {
      settings.fx = event.target.checked;
      saveSettings();
      applySettings();
    });

    $("#motionToggle").addEventListener("change", event => {
      settings.reducedMotion = event.target.checked;
      saveSettings();
      applySettings();
    });
  }

  function bindDialog(dialogSelector, openSelector, closeSelector) {
    const dialog = $(dialogSelector);
    const openButton = $(openSelector);
    const closeButton = $(closeSelector);
    if (!dialog || !openButton || !closeButton) return;

    openButton.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });

    closeButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", event => {
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) dialog.close();
    });
  }

  function setupHiDPI(canvas, context, logicalW, logicalH) {
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    canvas.style.width = logicalW + "px";
    canvas.style.height = logicalH + "px";
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(dpr, dpr);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
  }

  function init() {
    grid = makeGrid();
    setupHiDPI(boardCanvas, ctx, BOARD_W, BOARD_H);
    setupHiDPI(nextCanvas, nctx, NEXT_W, NEXT_H);
    setupHiDPI(holdCanvas, hctx, HOLD_W, HOLD_H);
    applySettings();
    renderLeaderboard();
    updateHUD();
    drawSide();
    drawBoardBackground();
    bindUI();
    bindTouchControls();
    document.addEventListener("keydown", handleKeydown);
  }

  init();
})();
