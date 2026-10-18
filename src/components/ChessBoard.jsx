import React, { useState } from 'react';
import { PieceSVG } from '../utils/pieces';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function ChessBoard({
  chess,
  orientation = 'white',
  theme,
  lastMove = null,
  validMoves = [],
  selectedSquare = null,
  hintMove = null,
  isInteractive = true,
  onSquareClick,
  onMovePiece,
}) {
  const [draggedSquare, setDraggedSquare] = useState(null);

  // Files and ranks order based on orientation
  const filesOrder = orientation === 'white' ? FILES : [...FILES].reverse();
  const ranksOrder = orientation === 'white' ? [...RANKS].reverse() : RANKS;

  // Find King square if in check
  const inCheck = chess.inCheck();
  let checkKingSquare = null;
  if (inCheck) {
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          checkKingSquare = piece.square;
          break;
        }
      }
      if (checkKingSquare) break;
    }
  }

  // Handle Drag & Drop
  const handleDragStart = (e, square, piece) => {
    if (!isInteractive) {
      e.preventDefault();
      return;
    }
    if (!piece || piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    onSquareClick(square);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSquare) => {
    e.preventDefault();
    if (!isInteractive || !draggedSquare) return;

    if (draggedSquare !== targetSquare) {
      onMovePiece(draggedSquare, targetSquare);
    }
    setDraggedSquare(null);
  };

  const handleSquareClick = (square) => {
    if (!isInteractive) return;
    onSquareClick(square);
  };

  return (
    <div className="relative select-none touch-manipulation">
      {/* Outer Board Frame with Premium Shadow and Border */}
      <div
        className="p-2 sm:p-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-slate-700/60 transition-all duration-300"
        style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          boxShadow: `0 10px 40px -10px ${theme.glowColor}25, 0 20px 40px rgba(0,0,0,0.8)`,
        }}
      >
        <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] rounded-lg overflow-hidden border border-slate-900/80 shadow-inner">
          {ranksOrder.map((rank, rankIdx) =>
            filesOrder.map((file, fileIdx) => {
              const square = `${file}${rank}`;
              const piece = chess.get(square);

              // Standard chess square coloring
              const fileNumber = file.charCodeAt(0) - 97;
              const rankNumber = parseInt(rank, 10);
              const isLight = (fileNumber + rankNumber) % 2 === 0;

              const isSelected = selectedSquare === square;
              const isValidTarget = validMoves.includes(square);
              const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
              const isKingInCheck = checkKingSquare === square;
              const isHint = hintMove && (hintMove.from === square || hintMove.to === square);

              // Show coordinates on border edges
              const showRankLabel = fileIdx === 0;
              const showFileLabel = rankIdx === 7;

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  className="relative flex items-center justify-center cursor-pointer transition-colors duration-150"
                  style={{
                    backgroundColor: isLight ? theme.lightSquare : theme.darkSquare,
                  }}
                >
                  {/* Last Move Highlight */}
                  {isLastMove && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity"
                      style={{ backgroundColor: theme.lastMove }}
                    />
                  )}

                  {/* Selected Square Highlight */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 ring-4 ring-inset ring-sky-400/80 pointer-events-none transition-all duration-150"
                      style={{ backgroundColor: theme.selected }}
                    />
                  )}

                  {/* King in Check Red Pulse Highlight */}
                  {isKingInCheck && (
                    <div className="absolute inset-0 check-pulse bg-rose-600/50 rounded-sm pointer-events-none z-10" />
                  )}

                  {/* Hint Highlight */}
                  {isHint && (
                    <div className="absolute inset-0 ring-4 ring-inset ring-amber-400 bg-amber-400/30 hint-glow pointer-events-none z-10" />
                  )}

                  {/* Coordinate Labels */}
                  {showRankLabel && (
                    <span
                      className="absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-bold pointer-events-none leading-none select-none"
                      style={{ color: isLight ? theme.lightSquareText : theme.darkSquareText }}
                    >
                      {rank}
                    </span>
                  )}
                  {showFileLabel && (
                    <span
                      className="absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-bold pointer-events-none leading-none select-none"
                      style={{ color: isLight ? theme.lightSquareText : theme.darkSquareText }}
                    >
                      {file}
                    </span>
                  )}

                  {/* Piece Display */}
                  {piece && (
                    <div
                      draggable={isInteractive && piece.color === chess.turn()}
                      onDragStart={(e) => handleDragStart(e, square, piece)}
                      className={`relative z-10 w-[84%] h-[84%] flex items-center justify-center transition-transform duration-100 ${
                        isInteractive && piece.color === chess.turn()
                          ? 'cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95'
                          : 'cursor-pointer'
                      } ${draggedSquare === square ? 'opacity-40 scale-110' : 'opacity-100'}`}
                    >
                      <PieceSVG type={piece.type} color={piece.color} />
                    </div>
                  )}

                  {/* Legal Move Indicators */}
                  {isValidTarget && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      {piece ? (
                        // Capture Target: Subtle Corner Ring
                        <div className="w-[88%] h-[88%] rounded-full border-4 sm:border-[5px] border-emerald-400/70 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-transform duration-150 animate-pulse" />
                      ) : (
                        // Empty Square Move Target: Small Centered Dot
                        <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.7)] transition-all duration-150" />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
