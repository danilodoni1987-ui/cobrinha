/**
 * Cobrinha Arena — Lógica Principal do Jogo
 * HTML5 Canvas + JavaScript Puro + LocalStorage + Web Audio API
 */

"use strict";

/* ==========================================================================
   1. Configurações e Definição dos 6 Níveis Progressivos
   ========================================================================== */

const STORAGE_KEYS = {
  RANKING: "cobrinha_arena_ranking_v1",
  PLAYER_NAME: "cobrinha_arena_ultimo_jogador_v1",
  SOUND: "cobrinha_arena_som_v1",
};

const POINTS_PER_FOOD = 10;
const MAX_RANKING_ITEMS = 10;

/**
 * Cada nível define:
 * - id: número do nível
 * - name: título exibido na interface
 * - gridSize: quantidade de células por linha/coluna (reduz nos níveis finais)
 * - speedMs: intervalo em milissegundos entre cada passo da cobra (menor = mais rápido)
 * - targetScore: pontuação acumulada necessária para avançar (Infinity no último nível)
 * - start: posição inicial segura da cabeça e direção inicial
 * - obstacles: lista de coordenadas [x, y] que formam muros internos
 */
const LEVELS = [
  {
    id: 1,
    name: "Campo Aberto",
    gridSize: 20,
    speedMs: 145,
    targetScore: 50,
    start: { x: 6, y: 10 },
    obstacles: [],
  },
  {
    id: 2,
    name: "Pilares Simétricos",
    gridSize: 20,
    speedMs: 125,
    targetScore: 120,
    start: { x: 6, y: 10 },
    obstacles: [
      [4, 4], [5, 4], [4, 5], [5, 5],
      [14, 4], [15, 4], [14, 5], [15, 5],
      [4, 14], [5, 14], [4, 15], [5, 15],
      [14, 14], [15, 14], [14, 15], [15, 15],
    ],
  },
  {
    id: 3,
    name: "Cruz Aberta",
    gridSize: 18,
    speedMs: 110,
    targetScore: 200,
    start: { x: 5, y: 6 },
    obstacles: [
      [8, 3], [9, 3], [8, 4], [9, 4],
      [8, 13], [9, 13], [8, 14], [9, 14],
      [3, 8], [4, 8], [3, 9], [4, 9],
      [13, 8], [14, 8], [13, 9], [14, 9],
    ],
  },
  {
    id: 4,
    name: "Fortaleza em L",
    gridSize: 18,
    speedMs: 96,
    targetScore: 300,
    start: { x: 5, y: 6 },
    obstacles: [
      // Cantoneiras em L nos quatro quadrantes
      [3, 3], [4, 3], [5, 3], [3, 4], [3, 5],
      [12, 3], [13, 3], [14, 3], [14, 4], [14, 5],
      [3, 12], [3, 13], [3, 14], [4, 14], [5, 14],
      [14, 12], [14, 13], [14, 14], [12, 14], [13, 14],
      // Núcleo central compacto
      [8, 8], [9, 8], [8, 9], [9, 9],
    ],
  },
  {
    id: 5,
    name: "Corredor Estreito",
    gridSize: 16,
    speedMs: 84,
    targetScore: 420,
    start: { x: 5, y: 6 },
    obstacles: [
      [4, 4], [5, 4], [6, 4], [9, 4], [10, 4], [11, 4],
      [4, 11], [5, 11], [6, 11], [9, 11], [10, 11], [11, 11],
      [2, 7], [2, 8], [13, 7], [13, 8],
    ],
  },
  {
    id: 6,
    name: "Arena Mestra",
    gridSize: 16,
    speedMs: 74,
    targetScore: Infinity,
    start: { x: 4, y: 5 },
    obstacles: [
      // Blocos nos quatro cantos
      [2, 2], [3, 2], [2, 3],
      [12, 2], [13, 2], [13, 3],
      [2, 12], [2, 13], [3, 13],
      [13, 12], [12, 13], [13, 13],
      // Portões centrais
      [6, 7], [6, 8], [9, 7], [9, 8],
    ],
  },
];

const DIRECTIONS = {
  UP: { x: 0, y: -1, opposite: "DOWN" },
  DOWN: { x: 0, y: 1, opposite: "UP" },
  LEFT: { x: -1, y: 0, opposite: "RIGHT" },
  RIGHT: { x: 1, y: 0, opposite: "LEFT" },
};

/* ==========================================================================
   2. Referências de Elementos do DOM
   ========================================================================== */

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hudPlayer = document.getElementById("hud-player");
const hudLevel = document.getElementById("hud-level");
const hudScore = document.getElementById("hud-score");
const hudProgress = document.getElementById("hud-progress");
const hudBest = document.getElementById("hud-best");

const overlayStart = document.getElementById("overlay-start");
const overlayPause = document.getElementById("overlay-pause");
const overlayLevelUp = document.getElementById("overlay-levelup");
const overlayGameOver = document.getElementById("overlay-gameover");

const startForm = document.getElementById("start-form");
const playerNameInput = document.getElementById("player-name");
const nameError = document.getElementById("name-error");

const levelUpKicker = document.getElementById("levelup-kicker");
const levelUpTitle = document.getElementById("levelup-title");
const levelUpDesc = document.getElementById("levelup-desc");
const btnNextLevel = document.getElementById("btn-next-level");

const gameOverReason = document.getElementById("gameover-reason");
const gameOverSummary = document.getElementById("gameover-summary");
const finalScoreEl = document.getElementById("final-score");
const finalLevelEl = document.getElementById("final-level");

const btnSound = document.getElementById("btn-sound");
const btnPause = document.getElementById("btn-pause");
const btnRestart = document.getElementById("btn-restart");
const btnResume = document.getElementById("btn-resume");
const btnRestartPause = document.getElementById("btn-restart-pause");
const btnPlayAgain = document.getElementById("btn-play-again");
const btnChangePlayer = document.getElementById("btn-change-player");

const btnClearRanking = document.getElementById("btn-clear-ranking");
const clearConfirmBar = document.getElementById("clear-confirm");
const btnConfirmClear = document.getElementById("btn-confirm-clear");
const btnCancelClear = document.getElementById("btn-cancel-clear");
const rankingEmpty = document.getElementById("ranking-empty");
const rankingTableWrap = document.getElementById("ranking-table-wrap");
const rankingBody = document.getElementById("ranking-body");
const levelsList = document.getElementById("levels-list");
const dpadButtons = document.querySelectorAll(".dpad-btn");

/* ==========================================================================
   3. Estado Global do Jogo
   ========================================================================== */

const game = {
  // Estados possíveis: TITLE_MENU | PLAYING | PAUSED | LEVEL_UP | GAME_OVER
  state: "TITLE_MENU",
  playerName: "",
  levelIndex: 0,
  score: 0,
  snake: [],
  direction: "RIGHT",
  directionQueue: [],
  food: { x: 0, y: 0 },
  obstacles: [],
  obstacleSet: new Set(),
  lastTickTime: 0,
  rafId: null,
  soundEnabled: true,
  lastSavedRecordId: null,
};

let audioCtx = null;

/* ==========================================================================
   4. Efeitos Sonoros Sintetizados (Web Audio API — sem arquivos externos)
   ========================================================================== */

function ensureAudioContext() {
  if (!game.soundEnabled) return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(frequency, duration, type = "sine", volume = 0.08, delay = 0) {
  const ctxAudio = ensureAudioContext();
  if (!ctxAudio) return;

  const startAt = ctxAudio.currentTime + delay;
  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctxAudio.destination);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

function playEatSound() {
  playTone(540, 0.09, "triangle", 0.09, 0);
  playTone(760, 0.11, "triangle", 0.07, 0.045);
}

function playLevelUpSound() {
  playTone(523.25, 0.12, "triangle", 0.08, 0);
  playTone(659.25, 0.12, "triangle", 0.08, 0.09);
  playTone(783.99, 0.18, "triangle", 0.09, 0.18);
}

function playGameOverSound() {
  playTone(220, 0.16, "sawtooth", 0.06, 0);
  playTone(150, 0.24, "sawtooth", 0.06, 0.12);
}

/* ==========================================================================
   5. Persistência de Ranking e Preferências (localStorage)
   ========================================================================== */

function loadRanking() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RANKING);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRanking(entries) {
  try {
    localStorage.setItem(STORAGE_KEYS.RANKING, JSON.stringify(entries));
  } catch {
    // Ignora caso o navegador bloqueie escrita em modo privado restrito
  }
}

function addScoreToRanking(name, score, levelNumber) {
  const entries = loadRanking();
  const recordId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  entries.push({
    id: recordId,
    name,
    score,
    level: levelNumber,
    createdAt: Date.now(),
  });

  // Ordena da maior pontuação para a menor; em empate, maior nível e partida mais recente
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.level !== a.level) return b.level - a.level;
    return b.createdAt - a.createdAt;
  });

  const topEntries = entries.slice(0, MAX_RANKING_ITEMS);
  saveRanking(topEntries);

  const isTopRecord = topEntries.length > 0 && topEntries[0].id === recordId && score > 0;
  game.lastSavedRecordId = recordId;

  renderRanking();
  updateBestScoreHud();

  return isTopRecord;
}

function renderRanking() {
  const entries = loadRanking();

  if (entries.length === 0) {
    rankingEmpty.hidden = false;
    rankingTableWrap.hidden = true;
    rankingBody.innerHTML = "";
    return;
  }

  rankingEmpty.hidden = true;
  rankingTableWrap.hidden = false;
  rankingBody.innerHTML = "";

  entries.forEach((entry, index) => {
    const tr = document.createElement("tr");
    if (entry.id === game.lastSavedRecordId) {
      tr.classList.add("is-recent");
    }

    const posCell = document.createElement("td");
    posCell.className = "rank-pos";
    posCell.textContent = `${index + 1}º`;

    const nameCell = document.createElement("td");
    nameCell.className = "rank-player";
    nameCell.textContent = entry.name;
    nameCell.title = entry.name;

    const levelCell = document.createElement("td");
    levelCell.className = "tabular";
    levelCell.textContent = `Nv. ${entry.level}`;

    const scoreCell = document.createElement("td");
    scoreCell.className = "num-col tabular";
    scoreCell.textContent = `${entry.score} pts`;

    tr.append(posCell, nameCell, levelCell, scoreCell);
    rankingBody.appendChild(tr);
  });
}

function updateBestScoreHud() {
  const entries = loadRanking();
  const best = entries.length > 0 ? entries[0].score : 0;
  hudBest.textContent = `${best} pts`;
}

/* ==========================================================================
   6. Lista de Níveis e Atualização de HUD
   ========================================================================== */

function renderLevelsSidebar() {
  levelsList.innerHTML = "";

  LEVELS.forEach((lvl, idx) => {
    const li = document.createElement("li");
    li.className = "level-row";

    if (idx === game.levelIndex && game.state !== "TITLE_MENU") {
      li.classList.add("is-active");
    } else if (idx < game.levelIndex && game.state !== "TITLE_MENU") {
      li.classList.add("is-completed");
    }

    const info = document.createElement("div");
    info.className = "level-info";

    const title = document.createElement("span");
    title.className = "level-name";
    title.textContent = `${lvl.id}. ${lvl.name}`;

    const meta = document.createElement("span");
    meta.className = "level-meta";
    const obsLabel =
      lvl.obstacles.length === 0 ? "Sem obstáculos" : `${lvl.obstacles.length} blocos`;
    meta.textContent = `Grade ${lvl.gridSize}×${lvl.gridSize} · ${obsLabel}`;

    const target = document.createElement("span");
    target.className = "level-target";
    target.textContent = Number.isFinite(lvl.targetScore)
      ? `Meta ${lvl.targetScore}`
      : "Modo Infinito";

    info.append(title, meta);
    li.append(info, target);
    levelsList.appendChild(li);
  });
}

function updateHud() {
  const level = LEVELS[game.levelIndex];
  hudPlayer.textContent = game.playerName || "—";
  hudLevel.textContent = `${level.id} / ${LEVELS.length}`;

  if (Number.isFinite(level.targetScore)) {
    const prevTarget = game.levelIndex > 0 ? LEVELS[game.levelIndex - 1].targetScore : 0;
    const span = Math.max(1, level.targetScore - prevTarget);
    const gained = Math.max(0, game.score - prevTarget);
    const pct = Math.min(100, Math.round((gained / span) * 100));

    hudScore.textContent = `${game.score} / ${level.targetScore} pts`;
    hudProgress.style.width = `${pct}%`;
  } else {
    hudScore.textContent = `${game.score} pts`;
    hudProgress.style.width = "100%";
  }

  renderLevelsSidebar();
}

function setOverlay(activeOverlay) {
  overlayStart.hidden = activeOverlay !== overlayStart;
  overlayPause.hidden = activeOverlay !== overlayPause;
  overlayLevelUp.hidden = activeOverlay !== overlayLevelUp;
  overlayGameOver.hidden = activeOverlay !== overlayGameOver;

  const isPlayingOrPaused = game.state === "PLAYING" || game.state === "PAUSED";
  btnPause.disabled = !isPlayingOrPaused;
  btnRestart.disabled = game.state === "TITLE_MENU";
  btnPause.textContent = game.state === "PAUSED" ? "Continuar" : "Pausar";
}

/* ==========================================================================
   7. Preparação de Nível, Colisões e Lógica da Partida
   ========================================================================== */

function setupLevel(index, keepScore = true) {
  game.levelIndex = index;
  if (!keepScore) {
    game.score = 0;
  }

  const level = LEVELS[index];
  const { x, y } = level.start;

  // Cobra começa com 3 segmentos alinhados à esquerda da cabeça, olhando para a direita
  game.snake = [
    { x, y },
    { x: x - 1, y },
    { x: x - 2, y },
  ];
  game.direction = "RIGHT";
  game.directionQueue = [];

  game.obstacles = level.obstacles.map(([ox, oy]) => ({ x: ox, y: oy }));
  game.obstacleSet = new Set(level.obstacles.map(([ox, oy]) => `${ox},${oy}`));

  spawnFood();
  updateHud();
  drawGame();
}

function spawnFood() {
  const gridSize = LEVELS[game.levelIndex].gridSize;
  const occupied = new Set(game.snake.map((seg) => `${seg.x},${seg.y}`));
  const freeCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key) && !game.obstacleSet.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    // Tabuleiro completamente preenchido
    finishGame("Arena completa! Pontuação máxima atingida.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * freeCells.length);
  game.food = freeCells[randomIndex];
}

function getCurrentTickSpeedMs() {
  const level = LEVELS[game.levelIndex];
  if (level.id < LEVELS.length) {
    return level.speedMs;
  }
  // No nível infinito, acelera gradualmente conforme o jogador acumula pontos extras
  const extraSteps = Math.floor(Math.max(0, game.score - 420) / 30);
  return Math.max(58, level.speedMs - extraSteps * 2);
}

function startNewGame() {
  stopLoop();
  game.lastSavedRecordId = null;
  setupLevel(0, false);
  game.state = "PLAYING";
  setOverlay(null);
  startLoop();
}

function pauseGame() {
  if (game.state !== "PLAYING") return;
  game.state = "PAUSED";
  stopLoop();
  setOverlay(overlayPause);
}

function resumeGame() {
  if (game.state !== "PAUSED") return;
  game.state = "PLAYING";
  setOverlay(null);
  startLoop();
}

function advanceToNextLevel() {
  if (game.state !== "LEVEL_UP") return;
  const nextIndex = Math.min(LEVELS.length - 1, game.levelIndex + 1);
  setupLevel(nextIndex, true);
  game.state = "PLAYING";
  setOverlay(null);
  startLoop();
}

function finishGame(reasonText) {
  stopLoop();
  game.state = "GAME_OVER";
  playGameOverSound();

  const currentLevel = LEVELS[game.levelIndex];
  const isNewRecord = addScoreToRanking(game.playerName, game.score, currentLevel.id);

  gameOverReason.textContent = reasonText;
  gameOverSummary.textContent = isNewRecord
    ? `Novo recorde da arena! Parabéns, ${game.playerName}.`
    : "Sua pontuação foi registrada no ranking local deste navegador.";

  finalScoreEl.textContent = `${game.score} pts`;
  finalLevelEl.textContent = `Nível ${currentLevel.id}`;

  setOverlay(overlayGameOver);
  drawGame();
}

function enqueueDirection(nextDir) {
  if (game.state !== "PLAYING") return;
  if (!DIRECTIONS[nextDir]) return;

  // Compara contra a última direção enfileirada (ou a atual se a fila estiver vazia)
  const referenceDir =
    game.directionQueue.length > 0
      ? game.directionQueue[game.directionQueue.length - 1]
      : game.direction;

  if (nextDir === referenceDir || DIRECTIONS[nextDir].opposite === referenceDir) {
    return;
  }

  // Fila de até 2 comandos garante curvas rápidas sem perder teclas
  if (game.directionQueue.length < 2) {
    game.directionQueue.push(nextDir);
  }
}

function stepGame() {
  if (game.directionQueue.length > 0) {
    game.direction = game.directionQueue.shift();
  }

  const level = LEVELS[game.levelIndex];
  const vector = DIRECTIONS[game.direction];
  const currentHead = game.snake[0];
  const nextHead = {
    x: currentHead.x + vector.x,
    y: currentHead.y + vector.y,
  };

  // 1. Verifica colisão com as paredes da grade
  if (
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= level.gridSize ||
    nextHead.y >= level.gridSize
  ) {
    finishGame("Colisão com a parede");
    return;
  }

  // 2. Verifica colisão com obstáculos do nível
  if (game.obstacleSet.has(`${nextHead.x},${nextHead.y}`)) {
    finishGame("Colisão com obstáculo");
    return;
  }

  const willEat = nextHead.x === game.food.x && nextHead.y === game.food.y;

  // 3. Verifica colisão com o próprio corpo (ignora a ponta da cauda se não for crescer)
  const bodyToCheck = willEat ? game.snake : game.snake.slice(0, -1);
  const hitSelf = bodyToCheck.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);
  if (hitSelf) {
    finishGame("Colisão com o próprio corpo");
    return;
  }

  // Move a cobra inserindo a nova cabeça
  game.snake.unshift(nextHead);

  if (willEat) {
    game.score += POINTS_PER_FOOD;
    playEatSound();

    // Verifica se atingiu a meta para avançar ao próximo nível
    if (game.score >= level.targetScore && game.levelIndex < LEVELS.length - 1) {
      stopLoop();
      game.state = "LEVEL_UP";
      playLevelUpSound();

      const nextLevel = LEVELS[game.levelIndex + 1];
      levelUpKicker.textContent = `Nível ${level.id} concluído`;
      levelUpTitle.textContent = `Nível ${nextLevel.id}: ${nextLevel.name}`;

      const gridChanged = nextLevel.gridSize < level.gridSize;
      const obsCount = nextLevel.obstacles.length;
      const details = [
        `Grade ${nextLevel.gridSize}×${nextLevel.gridSize}`,
        obsCount > 0 ? `${obsCount} obstáculos` : "Sem obstáculos",
        gridChanged ? "espaço mais compacto" : "velocidade maior",
      ];
      levelUpDesc.textContent = `Próxima etapa: ${details.join(" · ")}.`;
      btnNextLevel.textContent = `Ir para o Nível ${nextLevel.id}`;

      updateHud();
      drawGame();
      setOverlay(overlayLevelUp);
      return;
    }

    spawnFood();
    updateHud();
  } else {
    game.snake.pop();
  }
}

/* ==========================================================================
   8. Loop Principal (requestAnimationFrame) e Renderização no Canvas
   ========================================================================== */

function startLoop() {
  game.lastTickTime = performance.now();
  const loop = (now) => {
    if (game.state !== "PLAYING") return;

    const elapsed = now - game.lastTickTime;
    const stepMs = getCurrentTickSpeedMs();

    if (elapsed >= stepMs) {
      // Evita múltiplos saltos acumulados se a aba ficou em segundo plano
      game.lastTickTime = now - (elapsed % stepMs);
      stepGame();
      if (game.state === "PLAYING") {
        drawGame(now);
      }
    } else {
      // Atualiza pulsação sutil do alimento mesmo entre ticks
      drawGame(now);
    }

    if (game.state === "PLAYING") {
      game.rafId = requestAnimationFrame(loop);
    }
  };

  game.rafId = requestAnimationFrame(loop);
}

function stopLoop() {
  if (game.rafId !== null) {
    cancelAnimationFrame(game.rafId);
    game.rafId = null;
  }
}

function resizeCanvasForDpr() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetWidth = Math.round(rect.width * dpr);
  const targetHeight = Math.round(rect.height * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }
}

function drawRoundedCell(x, y, size, radius) {
  const r = Math.min(radius, size / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + size, y, x + size, y + size, r);
  ctx.arcTo(x + size, y + size, x, y + size, r);
  ctx.arcTo(x, y + size, x, y, r);
  ctx.arcTo(x, y, x + size, y, r);
  ctx.closePath();
}

function drawGame(now = performance.now()) {
  resizeCanvasForDpr();

  const level = LEVELS[game.levelIndex];
  const gridSize = level.gridSize;
  const width = canvas.width;
  const height = canvas.height;
  const cellSize = width / gridSize;

  // Fundo da arena
  ctx.fillStyle = "#0f1720";
  ctx.fillRect(0, 0, width, height);

  // Grade sutil estilo xadrez discreto para facilitar leitura de distância
  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      if ((row + col) % 2 === 1) {
        ctx.fillStyle = "rgba(148, 163, 184, 0.03)";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  // Linhas finas da grade
  ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < gridSize; i += 1) {
    const pos = Math.round(i * cellSize) + 0.5;
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, height);
    ctx.moveTo(0, pos);
    ctx.lineTo(width, pos);
  }
  ctx.stroke();

  // Desenho dos obstáculos do nível
  const obsPad = Math.max(2, cellSize * 0.1);
  game.obstacles.forEach((obs) => {
    const ox = obs.x * cellSize + obsPad;
    const oy = obs.y * cellSize + obsPad;
    const oSize = cellSize - obsPad * 2;

    ctx.fillStyle = "#334155";
    drawRoundedCell(ox, oy, oSize, cellSize * 0.18);
    ctx.fill();

    ctx.strokeStyle = "rgba(226, 232, 240, 0.22)";
    ctx.lineWidth = Math.max(1, cellSize * 0.06);
    ctx.stroke();
  });

  // Desenho do item (fruto dourado com pulso suave)
  const pulse = 1 + Math.sin(now / 180) * 0.06;
  const fx = (game.food.x + 0.5) * cellSize;
  const fy = (game.food.y + 0.5) * cellSize;
  const foodRadius = cellSize * 0.34 * pulse;

  // Halo suave ao redor do fruto
  ctx.fillStyle = "rgba(245, 158, 11, 0.18)";
  ctx.beginPath();
  ctx.arc(fx, fy, foodRadius * 1.45, 0, Math.PI * 2);
  ctx.fill();

  // Corpo do fruto
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(fx, fy, foodRadius, 0, Math.PI * 2);
  ctx.fill();

  // Brilho interno do fruto
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(fx - foodRadius * 0.28, fy - foodRadius * 0.28, foodRadius * 0.26, 0, Math.PI * 2);
  ctx.fill();

  // Desenho da cobra (do rabo até a cabeça)
  const total = game.snake.length;
  for (let i = total - 1; i >= 0; i -= 1) {
    const seg = game.snake[i];
    const isHead = i === 0;
    const isDead = game.state === "GAME_OVER";

    const pad = isHead ? cellSize * 0.06 : cellSize * 0.1;
    const sx = seg.x * cellSize + pad;
    const sy = seg.y * cellSize + pad;
    const sSize = cellSize - pad * 2;

    if (isHead) {
      ctx.fillStyle = isDead ? "#ef4444" : "#34d399";
    } else {
      // Degradê suave ao longo do corpo
      const ratio = 1 - i / Math.max(total, 1);
      const alpha = 0.55 + ratio * 0.42;
      ctx.fillStyle = isDead
        ? `rgba(239, 68, 68, ${alpha.toFixed(2)})`
        : `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
    }

    drawRoundedCell(sx, sy, sSize, isHead ? cellSize * 0.28 : cellSize * 0.22);
    ctx.fill();

    // Olhos direcionais na cabeça da cobra
    if (isHead) {
      drawSnakeEyes(seg.x * cellSize, seg.y * cellSize, cellSize);
    }
  }
}

function drawSnakeEyes(cellX, cellY, cellSize) {
  const eyeRadius = Math.max(1.8, cellSize * 0.085);
  const center = cellSize / 2;
  const forwardOffset = cellSize * 0.18;
  const sideOffset = cellSize * 0.18;

  let eye1;
  let eye2;

  switch (game.direction) {
    case "UP":
      eye1 = { x: cellX + center - sideOffset, y: cellY + center - forwardOffset };
      eye2 = { x: cellX + center + sideOffset, y: cellY + center - forwardOffset };
      break;
    case "DOWN":
      eye1 = { x: cellX + center - sideOffset, y: cellY + center + forwardOffset };
      eye2 = { x: cellX + center + sideOffset, y: cellY + center + forwardOffset };
      break;
    case "LEFT":
      eye1 = { x: cellX + center - forwardOffset, y: cellY + center - sideOffset };
      eye2 = { x: cellX + center - forwardOffset, y: cellY + center + sideOffset };
      break;
    case "RIGHT":
    default:
      eye1 = { x: cellX + center + forwardOffset, y: cellY + center - sideOffset };
      eye2 = { x: cellX + center + forwardOffset, y: cellY + center + sideOffset };
      break;
  }

  ctx.fillStyle = "#042419";
  [eye1, eye2].forEach((eye) => {
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ==========================================================================
   9. Eventos de Teclado, Toque (Deslize + Botões) e Interface
   ========================================================================== */

function handleKeyDown(event) {
  const tagName = event.target && event.target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA") {
    return;
  }

  const key = event.key;
  let mappedDir = null;

  if (key === "ArrowUp" || key === "w" || key === "W") mappedDir = "UP";
  else if (key === "ArrowDown" || key === "s" || key === "S") mappedDir = "DOWN";
  else if (key === "ArrowLeft" || key === "a" || key === "A") mappedDir = "LEFT";
  else if (key === "ArrowRight" || key === "d" || key === "D") mappedDir = "RIGHT";

  if (mappedDir) {
    event.preventDefault();
    enqueueDirection(mappedDir);
    return;
  }

  if (key === " " || key === "p" || key === "P") {
    if (game.state === "PLAYING") {
      event.preventDefault();
      pauseGame();
    } else if (game.state === "PAUSED") {
      event.preventDefault();
      resumeGame();
    } else if (game.state === "LEVEL_UP") {
      event.preventDefault();
      advanceToNextLevel();
    }
    return;
  }

  if (key === "Enter" && game.state === "LEVEL_UP") {
    event.preventDefault();
    advanceToNextLevel();
  }
}

function setupTouchSwipeControls() {
  let startX = 0;
  let startY = 0;
  let swipeHandled = false;
  const SWIPE_THRESHOLD = 24;

  canvas.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length === 0) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      swipeHandled = false;
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchmove",
    (event) => {
      if (game.state !== "PLAYING" || swipeHandled || event.touches.length === 0) return;

      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;

      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        return;
      }

      event.preventDefault();
      swipeHandled = true;

      if (Math.abs(dx) > Math.abs(dy)) {
        enqueueDirection(dx > 0 ? "RIGHT" : "LEFT");
      } else {
        enqueueDirection(dy > 0 ? "DOWN" : "UP");
      }
    },
    { passive: false }
  );
}

function setupDpadButtons() {
  dpadButtons.forEach((button) => {
    const dir = button.dataset.dir;

    // Resposta imediata ao toque/clique no ponteiro
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      enqueueDirection(dir);
    });

    // Suporte para acionamento via teclado (Enter/Espaço no botão focado)
    button.addEventListener("click", (event) => {
      if (event.detail === 0) {
        enqueueDirection(dir);
      }
    });
  });
}

function updateSoundButton() {
  btnSound.setAttribute("aria-pressed", String(game.soundEnabled));
  btnSound.textContent = game.soundEnabled ? "Som: Ligado" : "Som: Desligado";
}

function bindUiEvents() {
  // Formulário inicial com nome do jogador
  startForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const cleanedName = playerNameInput.value.trim();

    if (!cleanedName) {
      nameError.hidden = false;
      playerNameInput.focus();
      return;
    }

    nameError.hidden = true;
    game.playerName = cleanedName;

    try {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, cleanedName);
    } catch {
      // Ignora erro de armazenamento
    }

    ensureAudioContext();
    startNewGame();
  });

  playerNameInput.addEventListener("input", () => {
    if (!nameError.hidden && playerNameInput.value.trim()) {
      nameError.hidden = true;
    }
  });

  // Botões de controle da partida
  btnPause.addEventListener("click", () => {
    if (game.state === "PLAYING") pauseGame();
    else if (game.state === "PAUSED") resumeGame();
  });

  btnResume.addEventListener("click", resumeGame);
  btnRestart.addEventListener("click", startNewGame);
  btnRestartPause.addEventListener("click", startNewGame);
  btnNextLevel.addEventListener("click", advanceToNextLevel);
  btnPlayAgain.addEventListener("click", startNewGame);

  btnChangePlayer.addEventListener("click", () => {
    stopLoop();
    game.state = "TITLE_MENU";
    setupLevel(0, false);
    setOverlay(overlayStart);
    playerNameInput.focus();
    playerNameInput.select();
  });

  // Controle de áudio
  btnSound.addEventListener("click", () => {
    game.soundEnabled = !game.soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, game.soundEnabled ? "1" : "0");
    } catch {
      // Ignora erro de armazenamento
    }
    updateSoundButton();
    if (game.soundEnabled) {
      playTone(620, 0.08, "sine", 0.06, 0);
    }
  });

  // Limpeza do ranking com confirmação em linha
  btnClearRanking.addEventListener("click", () => {
    if (loadRanking().length === 0) return;
    clearConfirmBar.hidden = false;
  });

  btnCancelClear.addEventListener("click", () => {
    clearConfirmBar.hidden = true;
  });

  btnConfirmClear.addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.RANKING);
    } catch {
      // Ignora erro de armazenamento
    }
    game.lastSavedRecordId = null;
    clearConfirmBar.hidden = true;
    renderRanking();
    updateBestScoreHud();
  });

  // Redimensionamento responsivo do canvas
  window.addEventListener("resize", () => {
    drawGame();
  });

  document.addEventListener("keydown", handleKeyDown);
}

/* ==========================================================================
   10. Inicialização da Aplicação
   ========================================================================== */

function init() {
  try {
    const savedName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    if (savedName) {
      playerNameInput.value = savedName;
      game.playerName = savedName;
    }

    const savedSound = localStorage.getItem(STORAGE_KEYS.SOUND);
    if (savedSound === "0") {
      game.soundEnabled = false;
    }
  } catch {
    // Ignora falha de leitura no localStorage
  }

  updateSoundButton();
  renderRanking();
  updateBestScoreHud();
  setupLevel(0, false);
  setOverlay(overlayStart);

  setupTouchSwipeControls();
  setupDpadButtons();
  bindUiEvents();
}

init();
