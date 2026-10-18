import React, { useState } from 'react';
import { Users, Shield, Zap, Flame, Clock, Play, Sparkles } from 'lucide-react';
import { PieceSVG } from '../utils/pieces';

export default function ModeSelectorModal({
  isOpen,
  currentMode = 'medium',
  currentColor = 'w',
  currentTimeLimit = null,
  onStartGame,
  onClose,
}) {
  const [selectedMode, setSelectedMode] = useState(currentMode);
  const [selectedColor, setSelectedColor] = useState(currentColor); // 'w', 'b', or 'random'
  const [selectedTime, setSelectedTime] = useState(currentTimeLimit); // null, 60, 180, 300, 600

  if (!isOpen) return null;

  const MODES = [
    {
      id: 'easy',
      name: 'Easy AI',
      subtitle: 'Single Player • Casual & Relaxed',
      desc: 'Forgiving moves and beginner-friendly tactics. Perfect for learning.',
      icon: Shield,
      accentColor: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/50 text-emerald-400',
      badge: 'Beginner',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'medium',
      name: 'Medium AI',
      subtitle: 'Single Player • Tactical & Balanced',
      desc: 'Evaluates positions with 2-ply Minimax & piece-square tables.',
      icon: Zap,
      accentColor: 'from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-400',
      badge: 'Intermediate',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'hard',
      name: 'Hard AI',
      subtitle: 'Single Player • Master Engine',
      desc: 'Alpha-Beta pruning, deeper search depth, and aggressive tactical play.',
      icon: Flame,
      accentColor: 'from-rose-500/20 to-red-500/20 border-rose-500/50 text-rose-400',
      badge: 'Advanced',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'two-player',
      name: 'Two Players',
      subtitle: 'Double Mode • Pass & Play',
      desc: 'Play head-to-head with a friend on the same screen or device.',
      icon: Users,
      accentColor: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/50 text-indigo-400',
      badge: 'Multiplayer',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    },
  ];

  const TIME_OPTIONS = [
    { label: 'Unlimited', value: null },
    { label: '1 min', value: 60 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
  ];

  const handleStart = () => {
    let finalColor = selectedColor;
    if (selectedColor === 'random') {
      finalColor = Math.random() < 0.5 ? 'w' : 'b';
    }
    onStartGame({
      mode: selectedMode,
      color: finalColor,
      timeLimit: selectedTime,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-emerald-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Select Your Game Mode
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Grandmaster Arena
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose between 3 AI difficulty tiers or challenge a friend in 2-Player mode
          </p>
        </div>

        {/* 4 Mode Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  isSelected
                    ? `bg-gradient-to-br ${mode.accentColor} shadow-lg ring-2 ring-emerald-400/80 scale-[1.01]`
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/80">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-white text-sm sm:text-base">
                      {mode.name}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${mode.badgeColor}`}>
                    {mode.badge}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 mt-0.5">
                  {mode.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Options Row: Play As Color (Only for single player) & Time Control */}
        <div className="space-y-4 pt-3 border-t border-slate-800">
          {selectedMode !== 'two-player' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Play As
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedColor('w')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                    selectedColor === 'w'
                      ? 'bg-slate-200 text-slate-950 border-white ring-2 ring-emerald-400'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-4 h-4">
                    <PieceSVG type="k" color="w" />
                  </div>
                  White
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedColor('random')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                    selectedColor === 'random'
                      ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 ring-2 ring-emerald-400'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  🎲 Random
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedColor('b')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                    selectedColor === 'b'
                      ? 'bg-slate-950 text-white border-slate-600 ring-2 ring-emerald-400'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-4 h-4">
                    <PieceSVG type="k" color="b" />
                  </div>
                  Black
                </button>
              </div>
            </div>
          )}

          {/* Time Control Options */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Time Control</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setSelectedTime(opt.value)}
                  className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedTime === opt.value
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold ring-1 ring-emerald-400'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Button & Cancel */}
        <div className="mt-6 flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-xs sm:text-sm font-semibold transition-all"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleStart}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/50 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-white" />
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
}
