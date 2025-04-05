import React, { useState, useEffect } from 'react';
import { XIcon, CircleIcon, RotateCcwIcon, AlertCircleIcon } from 'lucide-react';
import type { Player, GameState } from './types';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
];

function App() {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('players');
    return saved ? JSON.parse(saved) : [];
  });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    currentTurn: null,
    winner: null,
    winningLine: null,
    board: Array(9).fill(null),
    settings: {
      visualEffects: true
    },
    lastMove: null
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('players', JSON.stringify(players));
  }, [players]);

  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      setError('Please enter a player name');
      return;
    }
    if (players.length >= 2) {
      setError('Maximum 2 players allowed');
      return;
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      symbol: players.length === 0 ? 'X' : 'O',
      score: 0,
      highScore: 0
    };

    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    setError(null);
  };

  useEffect(() => {
    if (players.length === 2 && gameState.status === 'waiting') {
      setGameState({
        ...gameState,
        status: 'playing',
        currentTurn: players[0].id
      });
    }
  }, [players]);

  const handleCellClick = (index: number) => {
    if (
      gameState.status !== 'playing' ||
      gameState.board[index] ||
      !gameState.currentTurn
    ) {
      return;
    }

    const currentPlayer = players.find(p => p.id === gameState.currentTurn);
    if (!currentPlayer) return;

    const newBoard = [...gameState.board];
    newBoard[index] = currentPlayer.symbol;

    let winner = null;
    let winningLine = null;

    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (
        newBoard[a] &&
        newBoard[a] === newBoard[b] &&
        newBoard[a] === newBoard[c]
      ) {
        winner = currentPlayer.id;
        winningLine = combination;
        break;
      }
    }

    const isDraw = !winner && newBoard.every(cell => cell !== null);

    setGameState({
      ...gameState,
      status: winner || isDraw ? 'finished' : 'playing',
      currentTurn: winner ? null : players.find(p => p.id !== currentPlayer.id)?.id ?? null,
      winner,
      winningLine,
      board: newBoard,
      lastMove: index
    });

    // Update scores if game is finished
    if (winner || isDraw) {
      const updatedPlayers = players.map(player => {
        if (winner && player.id === winner) {
          // Winner gets 3 points
          const newScore = player.score + 3;
          return {
            ...player,
            score: newScore,
            highScore: Math.max(newScore, player.highScore)
          };
        } else if (isDraw) {
          // Both players get 1 point for a draw
          const newScore = player.score + 1;
          return {
            ...player,
            score: newScore,
            highScore: Math.max(newScore, player.highScore)
          };
        }
        return player;
      });
      setPlayers(updatedPlayers);
    }
  };

  const resetGame = () => {
    setGameState({
      ...gameState,
      status: players.length === 2 ? 'playing' : 'waiting',
      currentTurn: players.length === 2 ? players[0].id : null,
      winner: null,
      winningLine: null,
      board: Array(9).fill(null),
      lastMove: null
    });
  };

  const startNewGame = () => {
    // Reset scores but keep player names
    const resetPlayers = players.map(player => ({
      ...player,
      score: 0
    }));
    setPlayers(resetPlayers);
    setGameState({
      ...gameState,
      status: 'playing',
      currentTurn: resetPlayers[0].id,
      winner: null,
      winningLine: null,
      board: Array(9).fill(null),
      lastMove: null
    });
  };

  const newPlayers = () => {
    setPlayers([]);
    setGameState({
      ...gameState,
      status: 'waiting',
      currentTurn: null,
      winner: null,
      winningLine: null,
      board: Array(9).fill(null),
      lastMove: null
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-lg mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tic-Tac-Toe</h1>
          
          {players.length > 0 && (
            <div className="flex justify-center gap-8 mb-4">
              {players.map(player => (
                <div key={player.id} className="text-center">
                  <div className="flex items-center gap-2 justify-center">
                    {player.symbol === 'X' ? (
                      <XIcon className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <CircleIcon className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-sm text-gray-400">Score: </span>
                    <span className="font-bold">{player.score}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    High Score: {player.highScore}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-gray-300">
            {gameState.status === 'waiting'
              ? `Waiting for players (${2 - players.length} more needed)`
              : gameState.status === 'playing'
              ? `${players.find(p => p.id === gameState.currentTurn)?.name}'s turn (${players.find(p => p.id === gameState.currentTurn)?.symbol})`
              : gameState.winner
              ? `${players.find(p => p.id === gameState.winner)?.name} wins! (+3 points)`
              : 'Game Over - Draw! (+1 point each)'}
          </p>
        </header>

        {gameState.status === 'waiting' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <form onSubmit={addPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {players.length === 0 ? 'Enter Player 1 (X)' : 'Enter Player 2 (O)'}
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name"
                    className="flex-1 bg-gray-700 px-4 py-2 rounded-md border border-gray-600 focus:border-gray-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  >
                    Add Player
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircleIcon className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}
            </form>

            <div className="mt-4 space-y-2">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-2">
                  {player.symbol === 'X' ? (
                    <XIcon className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <CircleIcon className="w-5 h-5 text-blue-500" />
                  )}
                  <span>{player.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 aspect-square">
          {gameState.board.map((cell, index) => {
            // Determine if this cell is part of the winning line
            const isWinningCell = gameState.winningLine?.includes(index) || false;
            
            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={gameState.status !== 'playing' || cell !== null}
                className={`
                  aspect-square bg-gray-800/30 rounded-lg flex items-center justify-center
                  text-4xl font-bold transition-all duration-200
                  ${gameState.status === 'playing' && !cell ? 'hover:bg-gray-800/50' : ''}
                  ${isWinningCell ? 'bg-gray-700/50' : ''}
                  disabled:cursor-not-allowed
                  relative
                `}
              >
                {cell === 'X' && (
                  <div className={`
                    relative
                    marker-x
                    ${gameState.lastMove === index ? 'marker-placed' : ''}
                  `}>
                    <XIcon className="w-12 h-12 text-yellow-500" />
                  </div>
                )}
                {cell === 'O' && (
                  <div className={`
                    relative
                    marker-o
                    ${gameState.lastMove === index ? 'marker-placed' : ''}
                  `}>
                    <CircleIcon className="w-12 h-12 text-blue-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          {gameState.status === 'finished' && (
            <>
              <button
                onClick={resetGame}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                <RotateCcwIcon className="w-5 h-5" />
                Play Again
              </button>
              <button
                onClick={startNewGame}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                Reset Scores
              </button>
              <button
                onClick={newPlayers}
                className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                New Players
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;