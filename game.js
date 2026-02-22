const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

let board = [];
let currentPlayer = BLACK;
let gameOver = false;

const boardEl = document.getElementById('board');
const blackScoreEl = document.getElementById('black-score');
const whiteScoreEl = document.getElementById('white-score');
const turnIndicatorEl = document.getElementById('turn-indicator');
const messageEl = document.getElementById('message');
const resetBtn = document.getElementById('reset-btn');

function initBoard() {
  board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY));
  board[3][3] = WHITE;
  board[3][4] = BLACK;
  board[4][3] = BLACK;
  board[4][4] = WHITE;
  currentPlayer = BLACK;
  gameOver = false;
  messageEl.textContent = '';
}

function render() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (board[r][c] !== EMPTY) {
        const piece = document.createElement('div');
        piece.classList.add('piece', board[r][c] === BLACK ? 'black' : 'white');
        cell.appendChild(piece);
      }

      if (!gameOver && canPlace(r, c, currentPlayer)) {
        cell.classList.add('valid-move');
      }

      cell.addEventListener('click', () => handleClick(r, c));
      boardEl.appendChild(cell);
    }
  }
  updateScore();
  updateTurnIndicator();
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function opponent(player) {
  return player === BLACK ? WHITE : BLACK;
}

function getFlips(r, c, player) {
  if (board[r][c] !== EMPTY) return [];

  const allFlips = [];
  const opp = opponent(player);

  for (const [dr, dc] of DIRECTIONS) {
    const flips = [];
    let nr = r + dr;
    let nc = c + dc;

    while (inBounds(nr, nc) && board[nr][nc] === opp) {
      flips.push([nr, nc]);
      nr += dr;
      nc += dc;
    }

    if (flips.length > 0 && inBounds(nr, nc) && board[nr][nc] === player) {
      allFlips.push(...flips);
    }
  }

  return allFlips;
}

function canPlace(r, c, player) {
  return getFlips(r, c, player).length > 0;
}

function hasValidMove(player) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (canPlace(r, c, player)) return true;
    }
  }
  return false;
}

function placePiece(r, c, player) {
  const flips = getFlips(r, c, player);
  if (flips.length === 0) return false;

  board[r][c] = player;
  for (const [fr, fc] of flips) {
    board[fr][fc] = player;
  }

  return true;
}

function updateScore() {
  let black = 0;
  let white = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
    }
  }
  blackScoreEl.textContent = black;
  whiteScoreEl.textContent = white;
}

function updateTurnIndicator() {
  if (gameOver) {
    turnIndicatorEl.textContent = 'ゲーム終了';
    return;
  }
  turnIndicatorEl.textContent = currentPlayer === BLACK ? '黒のターン' : '白のターン';
}

function checkGameEnd() {
  if (hasValidMove(BLACK) || hasValidMove(WHITE)) return false;

  gameOver = true;
  const black = parseInt(blackScoreEl.textContent);
  const white = parseInt(whiteScoreEl.textContent);

  if (black > white) {
    messageEl.textContent = `黒の勝ち！ (${black} - ${white})`;
  } else if (white > black) {
    messageEl.textContent = `白の勝ち！ (${black} - ${white})`;
  } else {
    messageEl.textContent = `引き分け！ (${black} - ${white})`;
  }

  return true;
}

function handleClick(r, c) {
  if (gameOver) return;
  if (!canPlace(r, c, currentPlayer)) return;

  placePiece(r, c, currentPlayer);
  currentPlayer = opponent(currentPlayer);

  if (!hasValidMove(currentPlayer)) {
    if (!checkGameEnd()) {
      const skippedColor = currentPlayer === BLACK ? '黒' : '白';
      currentPlayer = opponent(currentPlayer);
      messageEl.textContent = `${skippedColor}は置ける場所がありません。スキップします。`;
      setTimeout(() => {
        if (!gameOver) messageEl.textContent = '';
      }, 2000);
    }
  } else {
    messageEl.textContent = '';
  }

  render();
  checkGameEnd();
}

resetBtn.addEventListener('click', () => {
  initBoard();
  render();
});

initBoard();
render();
