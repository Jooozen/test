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
let gameMode = 'ai'; // 'ai' or 'pvp'

const boardEl = document.getElementById('board');
const blackScoreEl = document.getElementById('black-score');
const whiteScoreEl = document.getElementById('white-score');
const turnIndicatorEl = document.getElementById('turn-indicator');
const messageEl = document.getElementById('message');
const resetBtn = document.getElementById('reset-btn');
const modeAIBtn = document.getElementById('mode-ai');
const modePVPBtn = document.getElementById('mode-pvp');

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

function getAIMove() {
  const corners = [[0,0],[0,7],[7,0],[7,7]];
  const edges = [];
  for (let i = 0; i < 8; i++) {
    edges.push([0,i],[7,i],[i,0],[i,7]);
  }

  // 1. 角を最優先
  for (const [r,c] of corners) {
    if (canPlace(r, c, WHITE)) return [r, c];
  }

  // 2. 全ての有効手を取得し、最も多くひっくり返せる手を選ぶ（角の隣は避ける）
  const badCells = new Set(['0,1','1,0','1,1','0,6','1,7','1,6','6,0','7,1','6,1','6,7','7,6','6,6']);
  let bestMove = null;
  let bestFlips = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const flips = getFlips(r, c, WHITE);
      if (flips.length === 0) continue;
      const isBad = badCells.has(`${r},${c}`);
      const score = isBad ? flips.length * 0.5 : flips.length;
      if (score > bestFlips) {
        bestFlips = score;
        bestMove = [r, c];
      }
    }
  }

  return bestMove;
}

function aiTurn() {
  if (gameOver || currentPlayer !== WHITE) return;

  if (!hasValidMove(WHITE)) {
    if (!checkGameEnd()) {
      messageEl.textContent = '白は置ける場所がありません。スキップします。';
      currentPlayer = BLACK;
      render();
      setTimeout(() => {
        if (!gameOver) messageEl.textContent = '';
      }, 2000);
    }
    return;
  }

  const move = getAIMove();
  if (!move) return;

  placePiece(move[0], move[1], WHITE);
  currentPlayer = BLACK;

  if (!hasValidMove(BLACK)) {
    if (!checkGameEnd()) {
      messageEl.textContent = '黒は置ける場所がありません。スキップします。';
      currentPlayer = WHITE;
      render();
      setTimeout(() => {
        if (!gameOver) {
          messageEl.textContent = '';
          aiTurn();
        }
      }, 2000);
      return;
    }
  } else {
    messageEl.textContent = '';
  }

  render();
  checkGameEnd();
}

function handleClick(r, c) {
  if (gameOver) return;
  if (!canPlace(r, c, currentPlayer)) return;

  if (gameMode === 'ai') {
    if (currentPlayer !== BLACK) return;
    placePiece(r, c, BLACK);
    currentPlayer = WHITE;

    if (!hasValidMove(WHITE)) {
      if (!checkGameEnd()) {
        messageEl.textContent = '白は置ける場所がありません。スキップします。';
        currentPlayer = BLACK;
        render();
        setTimeout(() => {
          if (!gameOver) messageEl.textContent = '';
        }, 2000);
        return;
      }
    } else {
      messageEl.textContent = '';
    }

    render();
    checkGameEnd();

    if (!gameOver && currentPlayer === WHITE) {
      setTimeout(aiTurn, 500);
    }
  } else {
    // PVPモード
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
}

function setMode(mode) {
  gameMode = mode;
  modeAIBtn.classList.toggle('active', mode === 'ai');
  modePVPBtn.classList.toggle('active', mode === 'pvp');
  initBoard();
  render();
}

modeAIBtn.addEventListener('click', () => setMode('ai'));
modePVPBtn.addEventListener('click', () => setMode('pvp'));

resetBtn.addEventListener('click', () => {
  initBoard();
  render();
});

initBoard();
render();
