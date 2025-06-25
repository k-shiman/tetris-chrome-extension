const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const btnEasy = document.getElementById('btn-easy');
const btnMedium = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');
const btnTheme = document.getElementById('btn-theme');
const btnPause = document.getElementById('btn-pause');
const messageEl = document.getElementById('message');

const gridSize = 20;
const cols = 10;
const rows = 20;
canvas.width = gridSize * cols;
canvas.height = gridSize * rows;

const shapes = 'TJLOSZI';
const shapeColors = {
  T: '#C864F2',
  J: '#3264F2',
  L: '#F2A464',
  O: '#F2E164',
  S: '#64F268',
  Z: '#F26464',
  I: '#64F2F2'
};

function createMatrix(w, h) {
  return Array.from({ length: h }, () => new Array(w).fill(null));
}

function createPiece(type) {
  if (type === 'T') return [[0,1,0],[1,1,1]];
  if (type === 'J') return [[1,0,0],[1,1,1]];
  if (type === 'L') return [[0,0,1],[1,1,1]];
  if (type === 'O') return [[1,1],[1,1]];
  if (type === 'S') return [[0,1,1],[1,1,0]];
  if (type === 'Z') return [[1,1,0],[0,1,1]];
  if (type === 'I') return [[1,1,1,1]];
}

function collide(arena, player) {
  const { matrix, pos } = player;
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < matrix[y].length; ++x) {
      if (matrix[y][x] &&
         (arena[y + pos.y] && arena[y + pos.y][x + pos.x]) !== null) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) {
        arena[y + player.pos.y][x + player.pos.x] = player.type;
      }
    });
  });
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === null) continue outer;
    }
    arena.splice(y, 1);
    arena.unshift(new Array(cols).fill(null));
    score += rowCount * 10;
    rowCount *= 2;
    scoreEl.textContent = score;
    ++y;
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

function playerRotate(dir) {
  const original = player.matrix;
  let rotated = rotateMatrix(player.matrix);
  if (dir < 0) rotated.reverse();

  const pos = player.pos.x;
  let offset = 1;
  player.matrix = rotated;

  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      player.matrix = original;
      player.pos.x = pos;
      return;
    }
  }
}

let nextPiece = null;

function playerReset() {
  const type = nextPiece || shapes[Math.floor(Math.random() * shapes.length)];
  nextPiece = shapes[Math.floor(Math.random() * shapes.length)];
  player.type = type;
  player.matrix = createPiece(type);
  player.pos.y = 0;
  player.pos.x = ((cols - player.matrix[0].length) / 2) | 0;
  if (collide(arena, player)) {
    messageEl.textContent = "You Lost!";
    gameOver = true;
  }
  drawNext();
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const mat = createPiece(nextPiece);
  const color = shapeColors[nextPiece];
  const offsetX = Math.floor((4 - mat[0].length) / 2);
  const offsetY = Math.floor((4 - mat.length) / 2);

  mat.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) {
        nextCtx.fillStyle = color;
        nextCtx.fillRect((x + offsetX) * 20 + 1, (y + offsetY) * 20 + 1, 18, 18);
      }
    });
  });
}

function drawCell(x, y, type, alpha = 1) {
  if (!type) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = shapeColors[type];
  ctx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
  ctx.globalAlpha = 1;
}

function drawMatrix(matrix, offset, type, alpha = 1) {
  matrix.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) drawCell(x + offset.x, y + offset.y, type, alpha);
    });
  });
}

function getGhostPosition() {
  let ghostY = player.pos.y;
  while (!collide(arena, { matrix: player.matrix, pos: { x: player.pos.x, y: ghostY + 1 } })) {
    ghostY++;
  }
  return { x: player.pos.x, y: ghostY };
}

function draw() {
  ctx.fillStyle = '#101744';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#ffffff10';
  for (let x = 1; x < cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * gridSize, 0);
    ctx.lineTo(x * gridSize, canvas.height);
    ctx.stroke();
  }
  for (let y = 1; y < rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * gridSize);
    ctx.lineTo(canvas.width, y * gridSize);
    ctx.stroke();
  }

  arena.forEach((row, y) => {
    row.forEach((val, x) => drawCell(x, y, val));
  });

  const ghostPos = getGhostPosition();
  drawMatrix(player.matrix, ghostPos, player.type, 0.25);
  drawMatrix(player.matrix, player.pos, player.type);
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let gameOver = false;
let paused = false;

function update(time = 0) {
  if (gameOver || paused) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  timerEl.textContent = Math.floor((time - startTime) / 1000);
  requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
  if (gameOver || paused) return;
  if (event.key === 'ArrowLeft') playerMove(-1);
  else if (event.key === 'ArrowRight') playerMove(1);
  else if (event.key === 'ArrowDown') playerDrop();
  else if (event.key === 'w' || event.key === 'ArrowUp') playerRotate(1);
});

btnEasy.addEventListener('click', () => setLevel(1000));
btnMedium.addEventListener('click', () => setLevel(500));
btnHard.addEventListener('click', () => setLevel(200));
btnPause.addEventListener('click', () => {
  paused = !paused;
  if (!paused) requestAnimationFrame(update);
});
btnTheme.addEventListener('click', () => {
  document.body.classList.toggle('theme-alt');
});

function setLevel(ms) {
  dropInterval = ms;
  resetGame();
}

function resetGame() {
  arena.forEach(row => row.fill(null));
  playerReset();
  score = 0;
  scoreEl.textContent = score;
  messageEl.textContent = '';
  gameOver = false;
  lastTime = 0;
  draw();
  startTime = performance.now();
  requestAnimationFrame(update);
}

const arena = createMatrix(cols, rows);
const player = { pos: {}, matrix: null, type: null };
let startTime = performance.now();
resetGame();
const themes = ['theme-default', 'theme-light', 'theme-neon', 'theme-retro', 'theme-matrix'];
let currentTheme = 0;

document.getElementById('btn-theme').addEventListener('click', () => {
  document.body.classList.remove(themes[currentTheme]);
  currentTheme = (currentTheme + 1) % themes.length;
  document.body.classList.add(themes[currentTheme]);
});
