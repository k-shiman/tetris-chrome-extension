const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const btnEasy = document.getElementById('btn-easy');
const btnMedium = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');
const messageEl = document.getElementById('message');

let dropInterval = 1000;
let lastTime = 0;
let dropCounter = 0;
let score = 0;
let startTime = null;
let elapsed = 0;
let gameOver = false;

const gridSize = 10;
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
  const m = [];
  while (h--) m.push(new Array(w).fill(0));
  return m;
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
  const [m, o] = [player.matrix, player.pos];
  return m.some((row, y) =>
    row.some((val, x) =>
      val && (arena[y + o.y]?.[x + o.x]) !== 0
    )
  );
}

function merge(arena, player) {
  player.matrix.forEach((row, y) =>
    row.forEach((val, x) => {
      if (val) arena[y + player.pos.y][x + player.pos.x] = val;
    })
  );
}

function arenaSweep() {
  outer:
  for (let y = rows - 1; y >= 0; --y) {
    if (arena[y].every(val => val !== 0)) {
      arena.splice(y, 1);
      arena.unshift(new Array(cols).fill(0));
      ++y;
      score += 10;
      scoreEl.textContent = score;
    }
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    if (gameOver) return;
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}

function playerRotate(dir) {
  const m = player.matrix;
  for (let y=0; y < m.length; ++y)
    for (let x=0; x < y; ++x)
      [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
  dir > 0 ? m.forEach(r => r.reverse()) : m.reverse();
  if (collide(arena, player)) playerRotate(-dir);
}

function playerReset() {
  const type = shapes[Math.floor(Math.random() * shapes.length)];
  player.matrix = createPiece(type);
  player.pos.y = 0;
  player.pos.x = ((cols / 2)|0) - ((player.matrix[0].length / 2)|0);
  if (collide(arena, player)) {
    gameOver = true;
    messageEl.textContent = "Game Over";
  }
}

function draw() {
  ctx.fillStyle = '#101744';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, {x:0, y:0});
  drawMatrix(player.matrix, player.pos);
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
  ctx.strokeStyle = '#081244';
  ctx.lineWidth = 1;
  ctx.strokeRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) =>
    row.forEach((val, x) => {
      if (val) drawCell(x + offset.x, y + offset.y, shapeColors[val]);
    })
  );
}

function update(time = 0) {
  if (startTime && !gameOver) observedTime = time - startTime;
  lastTime = time;
  dropCounter += time - lastTime;
  if (dropCounter > dropInterval && !gameOver) playerDrop();
  timerEl.textContent = gameOver ? timerEl.textContent : Math.floor((performance.now() - startTime) / 1000);
  draw();
  if (!gameOver) requestAnimationFrame(update);
}

document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  if (e.key === 'ArrowLeft') playerMove(-1);
  else if (e.key === 'ArrowRight') playerMove(1);
  else if (e.key === 'ArrowDown') playerDrop();
  else if (e.key === 'q') playerRotate(-1);
  else if (e.key === 'w') playerRotate(1);
});

btnEasy.onclick = () => setLevel(1000);
btnMedium.onclick = () => setLevel(500);
btnHard.onclick = () => setLevel(200);
function setLevel(ms) {
  dropInterval = ms;
  resetGame();
}

function resetGame() {
  arena.forEach(row => row.fill(0));
  score = 0;
  scoreEl.textContent = score;
  messageEl.textContent = '';
  gameOver = false;
  playerReset();
  startTime = performance.now();
  requestAnimationFrame(update);
}

const arena = createMatrix(cols, rows);
const player = {pos: {x:0,y:0}, matrix: null};
resetGame();
