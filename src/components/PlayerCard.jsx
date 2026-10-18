import React from 'react';
import { PieceSVG } from '../utils/pieces';
import { User, Bot, Clock, Loader2 } from 'lucide-react';

export default function PlayerCard({
  name,
  subtitle,
  color, // 'w' or 'b'
  isTurn,
  isAI = false,
  isThinking = false,
  capturedPieces = [], // Array of piece types captured by THIS player
  materialAdvantage = 0, // e.g. +3
  timeRemaining = null, // seconds or null if unlimited
}) {
  const isWhite = color === 'w';

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLowTime = timeRemaining !== null && timeRemaining <= 30;

  // Group captured pieces by piece type
  // Pieces captured by White are Black pieces, and vice versa
  const pieceColor = isWhite ? 'b' : 'w';
  const pieceOrder = ['p', 'n', 'b', 'r', 'q'];
  const counts = {};
  capturedPieces.forEach((p) => {
    counts[p] = (counts[p] || 0) + 1;
  });

  return (
    <div
      className={`w-full flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl transition-all duration-300 border ${
        isTurn
          ? 'bg-gradient-to-r from-slate-900/90 via-slate-800/95 to-slate-900/90 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
          : 'bg-slate-900/70 border-slate-800/80 shadow-md'
      }`}
    >
      {/* Left: Avatar & Player Info */}
      <div className="flex items-center gap-3">
        <div
          className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-lg transition-all ${
            isTurn ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 scale-105' : ''
          } ${
            isWhite
              ? 'bg-gradient-to-tr from-slate-200 to-white text-slate-900 shadow-slate-200/20'
              : 'bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-white border border-slate-700 shadow-black/40'
          }`}
        >
          {isAI ? (
            <Bot className={`w-5 h-5 ${isWhite ? 'text-slate-900' : 'text-slate-100'}`} />
          ) : (
            <User className={`w-5 h-5 ${isWhite ? 'text-slate-900' : 'text-slate-100'}`} />
          )}

          {/* Active Turn Dot */}
          {isTurn && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base text-slate-100 tracking-wide flex items-center gap-1.5">
              {name}
            </span>
            {materialAdvantage > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-950/90 text-emerald-400 border border-emerald-700/60 rounded-md text-[11px] font-mono font-bold shadow-sm">
                +{materialAdvantage}
              </span>
            )}
            {isThinking && (
              <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking...
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <span className={`inline-block w-2 h-2 rounded-full ${isWhite ? 'bg-slate-200' : 'bg-slate-600 border border-slate-400'}`}></span>
            {subtitle}
          </span>
        </div>
      </div>

      {/* Middle: Captured Pieces Display */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-[140px] sm:max-w-[220px] px-2 py-0.5">
        {pieceOrder.map((type) => {
          const count = counts[type] || 0;
          if (count === 0) return null;
          return (
            <div key={type} className="flex items-center -space-x-2 shrink-0 hover:scale-110 transition-transform">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md">
                  <PieceSVG type={type} color={pieceColor} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Right: Chess Clock */}
      {timeRemaining !== null && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono font-bold text-sm sm:text-base border transition-all duration-200 shadow-inner ${
            isLowTime
              ? 'bg-rose-950/90 border-rose-500/80 text-rose-300 animate-pulse shadow-rose-950/50'
              : isTurn
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-emerald-950/30'
                : 'bg-slate-950/70 border-slate-800 text-slate-400'
          }`}
        >
          <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-400 animate-bounce' : isTurn ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      )}
    </div>
  );
}
