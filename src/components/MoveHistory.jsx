import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check, ScrollText } from 'lucide-react';

export default function MoveHistory({
  history = [],
  currentMoveIndex = -1,
  onSelectMove,
  pgn = '',
}) {
  const scrollRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Group moves into pairs (turn: { white, black })
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      turn: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIndex: i,
      black: history[i + 1] || null,
      blackIndex: i + 1,
    });
  }

  // Auto scroll to bottom when new moves occur
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  const handleCopyPGN = () => {
    if (!pgn) return;
    navigator.clipboard.writeText(pgn).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
            Move History
          </h3>
        </div>
        <button
          onClick={handleCopyPGN}
          disabled={history.length === 0}
          title="Copy PGN"
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>PGN</span>
            </>
          )}
        </button>
      </div>

      {/* Move List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs sm:text-sm max-h-[180px] sm:max-h-[240px] md:max-h-[300px]"
      >
        {movePairs.length === 0 ? (
          <div className="flex items-center justify-center h-28 text-slate-500 italic text-xs">
            No moves played yet
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.turn}
              className={`flex items-center rounded-lg px-2 py-1 transition-colors ${
                pair.turn % 2 === 0 ? 'bg-slate-800/20' : 'bg-transparent'
              }`}
            >
              {/* Turn Number */}
              <span className="w-8 text-slate-500 font-semibold text-[11px]">
                {pair.turn}.
              </span>

              {/* White Move */}
              <button
                onClick={() => onSelectMove && onSelectMove(pair.whiteIndex)}
                className={`flex-1 text-left px-2 py-1 rounded transition-colors font-medium ${
                  currentMoveIndex === pair.whiteIndex
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {pair.white.san}
              </button>

              {/* Black Move */}
              {pair.black ? (
                <button
                  onClick={() => onSelectMove && onSelectMove(pair.blackIndex)}
                  className={`flex-1 text-left px-2 py-1 rounded transition-colors font-medium ${
                    currentMoveIndex === pair.blackIndex
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  {pair.black.san}
                </button>
              ) : (
                <span className="flex-1 px-2 py-1 text-slate-600">-</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Total: {history.length} moves</span>
        <span>{Math.ceil(history.length / 2)} turns</span>
      </div>
    </div>
  );
}
