import React from 'react';

export default function EvaluationBar({ score, orientation = 'white' }) {
  // score is in centipawns: positive = White advantage, negative = Black advantage
  // Convert score to a percentage for the bar (clamp between -1000 and +1000 for display)
  const isMate = Math.abs(score) >= 90000;
  
  // Logistic curve to smoothly map centipawn score to percentage
  // 0 -> 50%
  // +500 (+5 pawns) -> ~88%
  // -500 (-5 pawns) -> ~12%
  let whitePercent = 50;
  if (isMate) {
    whitePercent = score > 0 ? 100 : 0;
  } else {
    // 2 / (1 + exp(-0.004 * score)) - 1 maps roughly -1000..+1000
    const clampedScore = Math.max(-1500, Math.min(1500, score));
    whitePercent = 50 + (clampedScore / 1500) * 45;
    whitePercent = Math.max(5, Math.min(95, whitePercent));
  }

  // Display score in pawn format (e.g., +1.5)
  const pawnScore = (Math.abs(score) / 100).toFixed(1);
  const scoreText = isMate 
    ? 'M' 
    : score === 0 
      ? '0.0' 
      : score > 0 
        ? `+${pawnScore}` 
        : `-${pawnScore}`;

  // If orientation is black, flip the bar display so Black is on bottom
  const fillHeight = orientation === 'white' ? whitePercent : 100 - whitePercent;

  return (
    <div className="flex flex-col items-center select-none mr-2 sm:mr-3">
      {/* Eval Bar Container */}
      <div className="relative w-3.5 sm:w-4.5 h-[340px] sm:h-[480px] md:h-[560px] bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 shadow-inner flex flex-col justify-end">
        {/* White evaluation fill */}
        <div
          className="w-full bg-slate-100 transition-all duration-500 ease-out relative"
          style={{ height: `${fillHeight}%` }}
        />
        {/* Mid-point line indicator */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-400/80 -translate-y-1/2 z-10 pointer-events-none" />
      </div>

      {/* Numerical score tag */}
      <div className="mt-1.5 px-1.5 py-0.5 bg-slate-800/90 border border-slate-700 rounded text-[10px] font-mono font-bold text-slate-300">
        {scoreText}
      </div>
    </div>
  );
}
