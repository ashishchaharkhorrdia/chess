// Minimax Chess AI with Piece-Square Tables and Alpha-Beta Pruning

// Standard Piece Values
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece Square Tables (from White's perspective; mirrored for Black)
// High values = favorable squares
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
  [0,  0,  0,  5,  5,  0,  0,  0],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [0,  0,  5,  5,  5,  5,  0, -5],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_MIDDLE_TABLE = [
  [20, 30, 10,  0,  0, 10, 30, 20],
  [20, 20,  0,  0,  0,  0, 20, 20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30]
];

function getSquareScore(piece, row, col) {
  let table;
  switch (piece.type) {
    case 'p': table = PAWN_TABLE; break;
    case 'n': table = KNIGHT_TABLE; break;
    case 'b': table = BISHOP_TABLE; break;
    case 'r': table = ROOK_TABLE; break;
    case 'q': table = QUEEN_TABLE; break;
    case 'k': table = KING_MIDDLE_TABLE; break;
    default: return 0;
  }

  // If black piece, invert row index
  const r = piece.color === 'w' ? 7 - row : row;
  return table[r][col];
}

/**
 * Static evaluation function.
 * Positive = advantage for White, Negative = advantage for Black.
 */
export function evaluateBoard(chess) {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100000 : 100000;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let totalScore = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseValue = PIECE_VALUES[piece.type] || 0;
      const positionValue = getSquareScore(piece, r, c);
      const pieceScore = baseValue + positionValue;

      if (piece.color === 'w') {
        totalScore += pieceScore;
      } else {
        totalScore -= pieceScore;
      }
    }
  }

  return totalScore;
}

/**
 * Move ordering: captures and checks evaluated first to prune branches faster.
 */
function orderMoves(moves) {
  return [...moves].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.captured) {
      scoreA += (PIECE_VALUES[a.captured] || 0) * 10 - (PIECE_VALUES[a.piece] || 0);
    }
    if (a.promotion) scoreA += 800;

    if (b.captured) {
      scoreB += (PIECE_VALUES[b.captured] || 0) * 10 - (PIECE_VALUES[b.piece] || 0);
    }
    if (b.promotion) scoreB += 800;

    return scoreB - scoreA;
  });
}

/**
 * Minimax with Alpha-Beta Pruning
 */
function minimax(chess, depth, alpha, beta, isMaximizing) {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Beta cut-off
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha cut-off
    }
    return minEval;
  }
}

/**
 * Find the best AI move according to the selected mode
 * modes: 'easy', 'medium', 'hard'
 */
export function getAIMove(chess, mode = 'medium') {
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const isWhite = chess.turn() === 'w';

  // 1. EASY MODE:
  // Random / simple captures, 40% chance of making a casual blunder
  if (mode === 'easy') {
    if (Math.random() < 0.45) {
      // Pick a random legal move
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
    // Otherwise pick a capture or simple 1-ply move
    const captureMoves = legalMoves.filter(m => m.captured);
    if (captureMoves.length > 0 && Math.random() < 0.7) {
      return captureMoves[Math.floor(Math.random() * captureMoves.length)];
    }
    // Search depth 1
    let bestMove = legalMoves[0];
    let bestScore = isWhite ? -Infinity : Infinity;
    for (const move of legalMoves) {
      chess.move(move);
      const score = evaluateBoard(chess);
      chess.undo();
      if (isWhite ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // 2. MEDIUM MODE:
  // Depth 2 minimax with PSTs. Consistent, sound play with minor tactical oversights
  if (mode === 'medium') {
    const depth = 2;
    const orderedMoves = orderMoves(legalMoves);
    let bestMove = orderedMoves[0];
    let bestScore = isWhite ? -Infinity : Infinity;

    // Small randomness to make gameplay feel organic
    const candidateMoves = [];

    for (const move of orderedMoves) {
      chess.move(move);
      const score = minimax(chess, depth - 1, -Infinity, Infinity, !isWhite);
      chess.undo();

      if (isWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      candidateMoves.push({ move, score });
    }

    // 15% chance to pick 2nd best move to avoid robotic predictability
    if (candidateMoves.length > 1 && Math.random() < 0.15) {
      candidateMoves.sort((a, b) => isWhite ? b.score - a.score : a.score - b.score);
      return candidateMoves[1].move;
    }

    return bestMove;
  }

  // 3. HARD MODE:
  // Depth 3-4 minimax with alpha-beta pruning, full PST evaluation & move ordering
  if (mode === 'hard') {
    // Dynamically adjust depth: when piece count drops, depth can safely be 4
    const pieceCount = chess.board().flat().filter(Boolean).length;
    const depth = pieceCount <= 12 ? 4 : 3;

    const orderedMoves = orderMoves(legalMoves);
    let bestMove = orderedMoves[0];
    let bestScore = isWhite ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of orderedMoves) {
      chess.move(move);
      const score = minimax(chess, depth - 1, alpha, beta, !isWhite);
      chess.undo();

      if (isWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
      }
    }

    return bestMove;
  }

  return legalMoves[0];
}
