// In ChessBoard.jsx
useEffect(() => {
  if (!socket) return;

  const handlePlayerRole = (role) => {
    console.log("Received player role: ", role);
    setPlayerRole(role);
    setMessage(
      role === "spectator" 
        ? "Room is full. Waiting for a spot to open..." 
        : role === "w" 
          ? "You are playing as White" 
          : "You are playing as Black"
    );
  };

  const handleGameStart = ({ white, black }) => {
    console.log("Game started:", { white, black });
    setGameStarted(true);
    setMessage(`Game started! ${white} (White) vs ${black} (Black)`);
    
    // Add this to ensure the board state is correct
    setBoard(chess.board());
  };

  socket.on("playerRole", handlePlayerRole);
  socket.on("gameStart", handleGameStart);
  // ... rest of the event handlers
});