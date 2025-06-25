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
  return Array.from({ length: h }, () => new Array(w).fill(null));
}

function createPiece(type) {
  if (type === 'T') return [[0, 1, 0], [1, 1, 1]];
  if (type === 'J') return [[1, 0, 0], [1, 1, 1]];
  if (type === 'L') return [[0, 0, 1], [1, 1, 1]];
  if (type === 'O') return [[1, 1], [1, 1]];
  if (type === 'S') return [[0, 1, 1], [1, 1, 0]];
  if (type === 'Z') return [[1, 1, 0], [0, 1, 1]];
  if (type === 'I') return [[1, 1, 1, 1]];
}

function collide(arena, player) {
  const { matrix, pos } = player;
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < matrix[y].length; ++x) {
      if (
        matrix[y][x] &&
        (arena[y + pos.y] && arena[y + pos.y][x + pos.x]) !== null
      ) {
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

function rotate(matrix) {
  const m = matrix.map((row, y) => row.map((_, x) => matrix[matrix.length - 1 - x][y]));
  return m;
}

function playerRotate(dir) {
  const old = player.matrix;
  const rotated = rotate(player.matrix);
  const originalX = player.pos.x;
  let offset = 1;
  player.matrix = rotated;

  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      player.matrix = old;
      player.pos.x = originalX;
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

function drawCell(x, y, type) {
  if (!type) return;
  ctx.fillStyle = shapeColors[type];
  ctx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
}

function drawMatrix(mat, offset, type) {
  mat.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val) drawCell(x + offset.x, y + offset.y, type);
    });
  });
}

function draw() {
  ctx.fillStyle = '#101744';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  arena.forEach((row, y) => {
    row.forEach((val, x) => drawCell(x, y, val));
  });
  drawMatrix(player.matrix, player.pos, player.type);
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
const player = { pos: {}, matrix: null, type: null };
let startTime = performance.now();
resetGame();
