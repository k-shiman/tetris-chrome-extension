const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const btnEasy = document.getElementById('btn-easy');
const btnMedium = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');
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
  return Array.from({length: h}, () => new Array(w).fill(null));
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
  const { matrix: m, pos: o } = player;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== null) {
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

async function arenaSweep() {
  let lines = [];

  for (let y = arena.length - 1; y >= 0; --y) {
    if (arena[y].every(cell => cell !== null)) {
      lines.push(y);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const y = lines[i];
    for (let x = 0; x < cols; x++) {
      arena[y][x] = null;
      draw();
      await new Promise(res => setTimeout(res, 30));
    }
  }

  for (const y of lines) {
    arena.splice(y, 1);
    arena.unshift(new Array(cols).fill(null));
  }

  if (lines.length > 0) {
    score += lines.length * 10;
    scoreEl.textContent = score;
  }
}

function getGhostY() {
  let ghostY = player.pos.y;
  while (!collide(arena, { pos: {x: player.pos.x, y: ghostY + 1}, matrix: player.matrix })) {
    ghostY++;
  }
  return ghostY;
}

function drawCell(x, y, type, ghost = false) {
  if (!type) return;
  ctx.fillStyle = ghost ? 'rgba(255,255,255,0.1)' : shapeColors[type];
  ctx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
}

function drawMatrix(mat, offset, type, ghost = false) {
  mat.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) drawCell(x + offset.x, y + offset.y, type, ghost);
    });
  });
}

function draw() {
  ctx.fillStyle = '#101744';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  arena.forEach((row, y) => {
    row.forEach((val, x) => drawCell(x, y, val));
  });

  const ghostY = getGhostY();
  drawMatrix(player.matrix, {x: player.pos.x, y: ghostY}, player.type, true);

  drawMatrix(player.matrix, player.pos, player.type);
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

function playerRotate(dir) {
  const m = player.matrix;
  const cloned = m.map(row => [...row]);
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [cloned[x][y], cloned[y][x]] = [cloned[y][x], cloned[x][y]];
    }
  }
  if (dir > 0) cloned.forEach(row => row.reverse());
  else cloned.reverse();

  const oldPos = player.pos.x;
  let offset = 1;
  player.matrix = cloned;

  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      player.matrix = m;
      player.pos.x = oldPos;
      return;
    }
  }
}

function playerReset() {
  const type = shapes[Math.floor(Math.random() * shapes.length)];
  player.type = type;
  player.matrix = createPiece(type);
  player.pos.y = 0;
  player.pos.x = ((cols - player.matrix[0].length) / 2) | 0;
  if (collide(arena, player)) {
    messageEl.textContent = "You Lost!";
    gameOver = true;
  }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let gameOver = false;

function update(time = 0) {
  if (gameOver) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  timerEl.textContent = Math.floor((time - startTime) / 1000);
  requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
  if (gameOver) return;
  if (event.key === 'ArrowLeft') playerMove(-1);
  else if (event.key === 'ArrowRight') playerMove(1);
  else if (event.key === 'ArrowDown') playerDrop();
  else if (event.key === 'w' || event.key === 'ArrowUp') playerRotate(1);
});

btnEasy.addEventListener('click', () => setLevel(1000));
btnMedium.addEventListener('click', () => setLevel(500));
btnHard.addEventListener('click', () => setLevel(200));

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
const player = {pos: {}, matrix: null, type: null};
let startTime = performance.now();
resetGame();
