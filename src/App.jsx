import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import {
  RotateCcw,
  Undo2,
  Lightbulb,
  Volume2,
  VolumeX,
  Palette,
  Swords,
  Crown,
  RefreshCw,
  Trophy,
  ChevronDown
} from 'lucide-react';

import ChessBoard from './components/ChessBoard';
import PlayerCard from './components/PlayerCard';
import EvaluationBar from './components/EvaluationBar';
import MoveHistory from './components/MoveHistory';
import GameOverModal from './components/GameOverModal';
import ModeSelectorModal from './components/ModeSelectorModal';
import PromotionModal from './components/PromotionModal';

import { THEMES } from './utils/themes';
import { evaluateBoard, getAIMove } from './utils/ai';
import { sounds } from './utils/audio';

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };

export default function App() {
  // Game engine instance
  const [chess] = useState(() => new Chess());

  // Game configuration
  const [gameMode, setGameMode] = useState('medium'); // 'easy', 'medium', 'hard', 'two-player'
  const [playerColor, setPlayerColor] = useState('w'); // 'w' or 'b'
  const [orientation, setOrientation] = useState('white');
  const [currentThemeKey, setCurrentThemeKey] = useState('emerald');
  const [soundOn, setSoundOn] = useState(sounds.enabled);

  // Board state & UI
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [hintMove, setHintMove] = useState(null);
  const [evalScore, setEvalScore] = useState(0);
  const isAIThinking = gameMode !== 'two-player' && !chess.isGameOver() && chess.turn() !== playerColor;

  // Promotion handling
  const [pendingPromotion, setPendingPromotion] = useState(null);

  // History & Captures
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });

  // Clock state
  const [timeLimit, setTimeLimit] = useState(null); // in seconds, or null for casual
  const [timers, setTimers] = useState({ w: null, b: null });

  // Modals
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [gameOverState, setGameOverState] = useState(null); // { isOpen: bool, winner: 'w'|'b'|'draw', reason: string }

  const currentTheme = THEMES[currentThemeKey] || THEMES.emerald;

  // Calculate material difference
  const calculateMaterial = useCallback(() => {
    let whiteTotal = 0;
    let blackTotal = 0;
    chess.board().forEach((row) => {
      row.forEach((sq) => {
        if (sq) {
          const val = PIECE_VALUES[sq.type] || 0;
          if (sq.color === 'w') whiteTotal += val;
          else blackTotal += val;
        }
      });
    });
    return {
      whiteDiff: Math.max(0, whiteTotal - blackTotal),
      blackDiff: Math.max(0, blackTotal - whiteTotal),
    };
  }, [chess]);

  const [materialScores, setMaterialScores] = useState({ whiteDiff: 0, blackDiff: 0 });

  // Update game status and check for game over
  const checkGameEnd = useCallback(() => {
    if (chess.isGameOver()) {
      let winner = 'draw';
      let reason = 'Game Drawn';

      if (chess.isCheckmate()) {
        winner = chess.turn() === 'w' ? 'b' : 'w';
        reason = 'Checkmate';
        sounds.playGameOver(gameMode === 'two-player' ? true : winner === playerColor);
      } else if (chess.isStalemate()) {
        reason = 'Stalemate';
        sounds.playGameOver(false);
      } else if (chess.isThreefoldRepetition()) {
        reason = 'Threefold Repetition';
        sounds.playGameOver(false);
      } else if (chess.isInsufficientMaterial()) {
        reason = 'Insufficient Material';
        sounds.playGameOver(false);
      } else if (chess.isDraw()) {
        reason = '50-Move Rule';
        sounds.playGameOver(false);
      }

      setGameOverState({
        isOpen: true,
        winner,
        reason,
      });
      return true;
    }
    return false;
  }, [chess, gameMode, playerColor]);

  // Execute a chess move
  const applyMove = useCallback(
    (moveObj) => {
      try {
        const move = chess.move(moveObj);
        if (!move) return false;

        // Sound cues
        if (move.captured) {
          sounds.playCapture();
        } else if (move.flags.includes('k') || move.flags.includes('q')) {
          sounds.playCastle();
        } else if (chess.inCheck()) {
          sounds.playCheck();
        } else {
          sounds.playMove();
        }

        // Track captured pieces
        if (move.captured) {
          const capturingColor = move.color;
          setCapturedPieces((prev) => ({
            ...prev,
            [capturingColor]: [...prev[capturingColor], move.captured],
          }));
        }

        // Update state
        setFen(chess.fen());
        setLastMove({ from: move.from, to: move.to });
        setMoveHistory((prev) => [...prev, move]);
        setSelectedSquare(null);
        setValidMoves([]);
        setHintMove(null);

        // Update evaluation and material
        const newScore = evaluateBoard(chess);
        setEvalScore(newScore);
        setMaterialScores(calculateMaterial());

        // Check for game end
        checkGameEnd();
        return true;
      } catch (err) {
        console.error('Invalid move:', err);
        return false;
      }
    },
    [chess, calculateMaterial, checkGameEnd]
  );

  // Trigger AI move if single player mode and it's AI's turn
  useEffect(() => {
    if (gameMode === 'two-player' || chess.isGameOver()) return;

    const currentTurn = chess.turn();
    const isAITurn = currentTurn !== playerColor;

    if (isAITurn) {
      // Small realistic pause so player feels the AI "thinking"
      const delay = gameMode === 'easy' ? 400 : gameMode === 'medium' ? 650 : 850;

      const timerId = setTimeout(() => {
        try {
          const bestMove = getAIMove(chess, gameMode);
          if (bestMove) {
            applyMove(bestMove);
          }
        } catch (e) {
          console.error('AI Move Error:', e);
        }
      }, delay);

      return () => clearTimeout(timerId);
    }
  }, [fen, gameMode, playerColor, chess, applyMove]);

  // Clock countdown timer
  useEffect(() => {
    if (timeLimit === null || chess.isGameOver() || (gameOverState && gameOverState.isOpen)) return;

    const interval = setInterval(() => {
      const turn = chess.turn();
      setTimers((prev) => {
        const currentRemaining = prev[turn];
        if (currentRemaining === null) return prev;

        if (currentRemaining <= 1) {
          // Time expired!
          clearInterval(interval);
          const winner = turn === 'w' ? 'b' : 'w';
          setGameOverState({
            isOpen: true,
            winner,
            reason: 'Timeout',
          });
          sounds.playGameOver(gameMode === 'two-player' ? true : winner === playerColor);
          return { ...prev, [turn]: 0 };
        }

        return { ...prev, [turn]: currentRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fen, timeLimit, chess, gameOverState, gameMode, playerColor]);

  // Handle Square Selection and Clicking
  const handleSquareClick = (square) => {
    if (chess.isGameOver()) return;

    // In single player, block interactions when it's AI's turn
    if (gameMode !== 'two-player' && chess.turn() !== playerColor) return;

    // If square already selected and clicked again, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // If a piece is already selected and target is in valid moves:
    if (selectedSquare && validMoves.includes(square)) {
      handleMoveAttempt(selectedSquare, square);
      return;
    }

    // Otherwise, select the piece if it belongs to current player
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setValidMoves(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // Move attempt checking for pawn promotion
  const handleMoveAttempt = (from, to) => {
    const piece = chess.get(from);
    if (!piece) return;

    // Check for pawn promotion
    const isPawn = piece.type === 'p';
    const isPromoting =
      isPawn &&
      ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

    if (isPromoting) {
      setPendingPromotion({ from, to, color: piece.color });
    } else {
      applyMove({ from, to });
    }
  };

  // Complete pawn promotion
  const handlePromotionSelect = (pieceType) => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    applyMove({ from, to, promotion: pieceType });
    setPendingPromotion(null);
  };

  // Undo Move
  const handleUndo = () => {
    if (moveHistory.length === 0 || isAIThinking) return;

    if (gameMode === 'two-player') {
      chess.undo();
      setMoveHistory((prev) => prev.slice(0, -1));
    } else {
      // In single player, undo both AI and player moves
      chess.undo();
      if (chess.turn() !== playerColor) {
        chess.undo();
        setMoveHistory((prev) => prev.slice(0, -2));
      } else {
        setMoveHistory((prev) => prev.slice(0, -1));
      }
    }

    setFen(chess.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setHintMove(null);
    setLastMove(null);
    setEvalScore(evaluateBoard(chess));
    setMaterialScores(calculateMaterial());

    // Reconstruct captured pieces
    const newCaptured = { w: [], b: [] };
    chess.history({ verbose: true }).forEach((m) => {
      if (m.captured) newCaptured[m.color].push(m.captured);
    });
    setCapturedPieces(newCaptured);
  };

  // Hint Generation
  const handleGetHint = () => {
    if (chess.isGameOver() || isAIThinking) return;
    if (gameMode !== 'two-player' && chess.turn() !== playerColor) return;

    const bestMove = getAIMove(chess, 'hard');
    if (bestMove) {
      setHintMove({ from: bestMove.from, to: bestMove.to });
      setTimeout(() => setHintMove(null), 3500);
    }
  };

  // Flip Board
  const handleFlipBoard = () => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  };

  // Sound Toggle
  const handleToggleSound = () => {
    const updated = sounds.toggleSound();
    setSoundOn(updated);
  };

  // Start New Game with Options
  const startNewGame = ({ mode, color, timeLimit: selectedTime }) => {
    chess.reset();
    setGameMode(mode);
    setPlayerColor(color);
    setOrientation(color === 'b' ? 'black' : 'white');
    setTimeLimit(selectedTime);
    setTimers({ w: selectedTime, b: selectedTime });

    setFen(chess.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setHintMove(null);
    setEvalScore(0);
    setMoveHistory([]);
    setCapturedPieces({ w: [], b: [] });
    setMaterialScores({ whiteDiff: 0, blackDiff: 0 });
    setGameOverState(null);
    setIsModeModalOpen(false);
  };

  // Quick Reset current match
  const handleQuickReset = () => {
    startNewGame({
      mode: gameMode,
      color: playerColor,
      timeLimit,
    });
  };

  // Human-friendly mode title
  const getModeTitle = () => {
    switch (gameMode) {
      case 'easy':
        return { label: 'Easy AI', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'medium':
        return { label: 'Medium AI', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'hard':
        return { label: 'Hard AI', badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      case 'two-player':
        return { label: 'Two Players', badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      default:
        return { label: 'Chess Match', badge: 'bg-slate-700 text-slate-300' };
    }
  };

  const modeInfo = getModeTitle();

  // Players configuration for PlayerCards
  const topColor = orientation === 'white' ? 'b' : 'w';
  const bottomColor = orientation === 'white' ? 'w' : 'b';

  const getPlayerDetails = (col) => {
    const isWhite = col === 'w';
    if (gameMode === 'two-player') {
      return {
        name: isWhite ? 'Player 1' : 'Player 2',
        subtitle: isWhite ? 'White Pieces' : 'Black Pieces',
        isAI: false,
      };
    }
    const isUser = col === playerColor;
    return {
      name: isUser ? 'You' : `AI Engine (${gameMode.toUpperCase()})`,
      subtitle: isUser ? `${isWhite ? 'White' : 'Black'} • Player` : 'Computer Opponent',
      isAI: !isUser,
    };
  };

  const topPlayer = getPlayerDetails(topColor);
  const bottomPlayer = getPlayerDetails(bottomColor);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Crown className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-emerald-300 bg-clip-text text-transparent">
                  CHESS GRANDMASTER
                </span>
                <span
                  className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${modeInfo.badge}`}
                >
                  {modeInfo.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Interactive Multi-Mode Chess Experience
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2">
            {/* Theme Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsThemeDropdownOpen((prev) => !prev)}
                title="Board Theme"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <Palette className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">{currentTheme.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isThemeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl z-40 backdrop-blur-lg animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Select Board Theme
                  </div>
                  {Object.values(THEMES).map((th) => (
                    <button
                      key={th.id}
                      onClick={() => {
                        setCurrentThemeKey(th.id);
                        setIsThemeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        currentThemeKey === th.id
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex gap-0.5 w-4 h-4 rounded overflow-hidden shrink-0 border border-slate-600">
                        <div className="w-2 h-4" style={{ backgroundColor: th.lightSquare }} />
                        <div className="w-2 h-4" style={{ backgroundColor: th.darkSquare }} />
                      </div>
                      <span>{th.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              title={soundOn ? 'Mute Sounds' : 'Unmute Sounds'}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Change Mode Button */}
            <button
              onClick={() => setIsModeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Swords className="w-4 h-4" />
              <span>Modes</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
        {/* Left Arena: Eval Bar + Chessboard + Player Cards */}
        <div className="flex flex-col items-center w-full max-w-[580px]">
          {/* Top Player Card */}
          <div className="w-full mb-2 sm:mb-3">
            <PlayerCard
              name={topPlayer.name}
              subtitle={topPlayer.subtitle}
              color={topColor}
              isTurn={chess.turn() === topColor && !chess.isGameOver()}
              isAI={topPlayer.isAI}
              isThinking={topPlayer.isAI && isAIThinking}
              capturedPieces={capturedPieces[topColor]}
              materialAdvantage={
                topColor === 'w' ? materialScores.whiteDiff : materialScores.blackDiff
              }
              timeRemaining={timers[topColor]}
            />
          </div>

          {/* Board Center Area with Evaluation Bar */}
          <div className="flex items-center justify-center w-full my-1">
            {/* Live Evaluation Bar */}
            <EvaluationBar score={evalScore} orientation={orientation} />

            {/* Interactive Chessboard */}
            <ChessBoard
              chess={chess}
              orientation={orientation}
              theme={currentTheme}
              lastMove={lastMove}
              validMoves={validMoves}
              selectedSquare={selectedSquare}
              hintMove={hintMove}
              isInteractive={!isAIThinking && !chess.isGameOver()}
              onSquareClick={handleSquareClick}
              onMovePiece={handleMoveAttempt}
            />
          </div>

          {/* Bottom Player Card */}
          <div className="w-full mt-2 sm:mt-3">
            <PlayerCard
              name={bottomPlayer.name}
              subtitle={bottomPlayer.subtitle}
              color={bottomColor}
              isTurn={chess.turn() === bottomColor && !chess.isGameOver()}
              isAI={bottomPlayer.isAI}
              isThinking={bottomPlayer.isAI && isAIThinking}
              capturedPieces={capturedPieces[bottomColor]}
              materialAdvantage={
                bottomColor === 'w' ? materialScores.whiteDiff : materialScores.blackDiff
              }
              timeRemaining={timers[bottomColor]}
            />
          </div>

          {/* Controls Bar under board */}
          <div className="w-full mt-4 flex items-center justify-between gap-2 bg-slate-900/70 border border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-lg backdrop-blur-md">
            <button
              onClick={handleUndo}
              disabled={moveHistory.length === 0 || isAIThinking}
              title="Undo Move"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4 text-amber-400" />
              <span>Undo</span>
            </button>

            <button
              onClick={handleGetHint}
              disabled={chess.isGameOver() || isAIThinking}
              title="Get Move Hint"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lightbulb className="w-4 h-4 text-yellow-300" />
              <span>Hint</span>
            </button>

            <button
              onClick={handleFlipBoard}
              title="Flip Board Orientation"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
              <span>Flip</span>
            </button>

            <button
              onClick={handleQuickReset}
              title="Restart Game"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Restart</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Match Info, History, Stats */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          {/* Match Status Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Current Match
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${modeInfo.badge}`}>
                {modeInfo.label}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Turn</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      chess.turn() === 'w' ? 'bg-white' : 'bg-slate-900 border border-slate-500'
                    }`}
                  />
                  {chess.turn() === 'w' ? 'White to move' : 'Black to move'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Status</span>
                <span className="font-semibold text-slate-200">
                  {chess.inCheck() ? (
                    <span className="text-rose-400 font-bold animate-pulse">CHECK!</span>
                  ) : chess.isGameOver() ? (
                    <span className="text-amber-400 font-bold">Game Over</span>
                  ) : (
                    'In Progress'
                  )}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">Clock</span>
                <span className="font-semibold text-slate-200">
                  {timeLimit ? `${Math.floor(timeLimit / 60)} min timer` : 'Casual (No clock)'}
                </span>
              </div>
            </div>
          </div>

          {/* Move History Panel */}
          <div className="flex-1 min-h-[220px]">
            <MoveHistory
              history={moveHistory}
              pgn={chess.pgn()}
            />
          </div>

          {/* Quick Tips or Mode Info Card */}
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800/80 rounded-2xl p-4 shadow-md text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Features Available</span>
            </div>
            <p className="leading-relaxed">
              Drag & drop pieces or click to move. Evaluation bar calculates real-time advantage. You can undo moves, ask for tactical hints, customize themes, or change time limits.
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      {/* 1. Mode Selector Modal */}
      <ModeSelectorModal
        isOpen={isModeModalOpen}
        currentMode={gameMode}
        currentColor={playerColor}
        currentTimeLimit={timeLimit}
        onStartGame={startNewGame}
        onClose={() => setIsModeModalOpen(false)}
      />

      {/* 2. Pawn Promotion Modal */}
      <PromotionModal
        isOpen={pendingPromotion !== null}
        color={pendingPromotion?.color || 'w'}
        onSelect={handlePromotionSelect}
      />

      {/* 3. Game Over Celebration Modal */}
      <GameOverModal
        isOpen={gameOverState?.isOpen || false}
        status={gameOverState}
        gameMode={gameMode}
        playerColor={playerColor}
        onNewGame={handleQuickReset}
        onChangeMode={() => {
          setGameOverState(null);
          setIsModeModalOpen(true);
        }}
        onReviewBoard={() => setGameOverState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
