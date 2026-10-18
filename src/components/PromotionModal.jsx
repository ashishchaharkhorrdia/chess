import React from 'react';
import { PieceSVG } from '../utils/pieces';

export default function PromotionModal({ isOpen, color = 'w', onSelect }) {
  if (!isOpen) return null;

  const pieces = [
    { type: 'q', label: 'Queen' },
    { type: 'r', label: 'Rook' },
    { type: 'b', label: 'Bishop' },
    { type: 'n', label: 'Knight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center">
        <h3 className="text-xl font-bold text-white mb-1">Pawn Promotion</h3>
        <p className="text-sm text-slate-400 mb-6">Choose a piece to promote your pawn:</p>
        
        <div className="grid grid-cols-4 gap-3">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-600/30 hover:border-emerald-500/60 border border-slate-700 transition-all duration-150 transform hover:scale-105 active:scale-95 group"
            >
              <div className="w-12 h-12 mb-2 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all">
                <PieceSVG type={p.type} color={color} />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-emerald-400">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
