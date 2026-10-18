import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Eye, Sparkles, Award } from 'lucide-react';

export default function GameOverModal({
  isOpen,
  status, // { winner: 'w'|'b'|'draw', reason: string }
  gameMode, // 'easy' | 'medium' | 'hard' | 'two-player'
  playerColor = 'w',
  onNewGame,
  onChangeMode,
  onReviewBoard,
}) {
  const isDraw = status?.winner === 'draw';
  const isHumanWinner =
    gameMode === 'two-player'
      ? true
      : !isDraw && status?.winner === playerColor;

  useEffect(() => {
    if (isOpen && status && isHumanWinner && !isDraw) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [isOpen, status, isHumanWinner, isDraw]);

  if (!isOpen || !status) return null;

  // Title and subtitle determination
  let title = '';
  let subtitle = '';

  if (isDraw) {
    title = 'Draw!';
    subtitle = status.reason || 'Game ended in a draw';
  } else if (gameMode === 'two-player') {
    title = status.winner === 'w' ? 'White Wins!' : 'Black Wins!';
    subtitle = `Won by ${status.reason || 'checkmate'}`;
  } else {
    if (status.winner === playerColor) {
      title = 'Victory!';
      subtitle = `You conquered the ${gameMode.toUpperCase()} AI by ${status.reason || 'checkmate'}!`;
    } else {
      title = 'Defeat!';
      subtitle = `The AI won by ${status.reason || 'checkmate'}. Keep practicing!`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm sm:max-w-md w-full text-center overflow-hidden">
        {/* Decorative background glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isDraw
              ? 'bg-amber-500/20'
              : isHumanWinner
                ? 'bg-emerald-500/25'
                : 'bg-rose-500/20'
          }`}
        />

        {/* Big Icon */}
        <div className="flex justify-center mb-4 relative">
          <div
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl border ${
              isDraw
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : isHumanWinner
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {isDraw ? (
              <Award className="w-10 h-10 sm:w-11 sm:h-11" />
            ) : isHumanWinner ? (
              <Trophy className="w-10 h-10 sm:w-11 sm:h-11 animate-bounce" />
            ) : (
              <Sparkles className="w-10 h-10 sm:w-11 sm:h-11" />
            )}
          </div>
        </div>

        {/* Result Titles */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-slate-300 mb-6 font-medium">
          {subtitle}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onNewGame}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            Play Again
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onChangeMode}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all hover:text-white"
            >
              Choose Mode
            </button>
            <button
              onClick={onReviewBoard}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all hover:text-white"
            >
              <Eye className="w-4 h-4" />
              Review Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
