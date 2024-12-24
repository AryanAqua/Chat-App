import { useState } from 'react';

const ChessBoard = () => {
  const [selectedPiece, setSelectedPiece] = useState(null);
  
  // Initial board setup
  const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    Array(8).fill(''),
    Array(8).fill(''),
    Array(8).fill(''),
    Array(8).fill(''),
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ];

  const [board, setBoard] = useState(initialBoard);

  // Chess piece Unicode characters
  const pieces = {
    'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
    'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
  };

  const handlePieceClick = (row, col) => {
    if (selectedPiece) {
      // Move piece logic
      const newBoard = [...board];
      const [selectedRow, selectedCol] = selectedPiece;
      newBoard[row][col] = board[selectedRow][selectedCol];
      newBoard[selectedRow][selectedCol] = '';
      setBoard(newBoard);
      setSelectedPiece(null);
    } else if (board[row][col]) {
      setSelectedPiece([row, col]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-8 gap-0 border-2 border-gray-800">
        {board.map((row, rowIndex) => (
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected = selectedPiece && 
              selectedPiece[0] === rowIndex && 
              selectedPiece[1] === colIndex;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handlePieceClick(rowIndex, colIndex)}
                className={`
                  w-16 h-16 flex items-center justify-center text-4xl
                  cursor-pointer transition-colors
                  ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                  ${isSelected ? 'bg-blue-400' : ''}
                  hover:bg-blue-200
                `}
              >
                {piece && pieces[piece]}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default ChessBoard;