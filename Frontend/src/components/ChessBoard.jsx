import { Chess } from "chess.js";
import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketProvider";

const ChessBoard = () => {
  const [from, setFrom] = useState(null);
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [playerRole, setPlayerRole] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState("Waiting for opponent...");
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return; // Early return if socket isn't available

    console.log("Socket connected and ready");

    const handlePlayerRole = (role) => {
      console.log("Received player role: ", role );
      setPlayerRole(role);
       if (role === "spectator") {
        setMessage("Room is full. Waiting for a spot to open...");
      } else {
        setMessage(role === "w" ? "You are playing as White" : "You are playing as Black");
      }
    }

    const handleGameStart = ({ white, black }) => {
      console.log("Game started:", { white, black });
      setGameStarted(true);
      setMessage(`Game started! ${white} (White) vs ${black} (Black)`);
    };

    const handleMove = (move) => {
      console.log("Received move:", move);
      chess.move(move);
      setBoard(chess.board());
    };

    // Add event listeners
    socket?.on("playerRole", handlePlayerRole);
    socket?.on("gameStart", handleGameStart);
    socket?.on("move", handleMove);

    // socket.on("playerRole", (role) => {
    //   console.log("Received player role:", role);
    //   setPlayerRole(role);
    //   setMessage(
    //     role === "w" ? "You are playing as White" : "You are playing as Black"
    //   );
    // });

    // socket.on("gameStart", ({ white, black }) => {
    //   console.log("Game started:", { white, black });
    //   setGameStarted(true);
    //   setMessage(`Game started! ${white} (White) vs ${black} (Black)`);
    // });

    // socket.on("move", (move) => {
    //   console.log("move: ", move);
    //   chess.move(move);
    //   setBoard(chess.board());
    // });


    socket.on("boardState", (fen) => {
      console.log("boardState: ", fen);
      chess.load(fen);
      setBoard(chess.board());
    });

    socket.on("invalidMove", () => {
      setMessage("Invalid move!");
      console.log("GameStrted from invalidMove: ", gameStarted);
      setTimeout(
        () => setMessage(gameStarted ? "Your turn" : "Waiting for opponent..."),
        2000
      );
    });

    socket.on("error", (errorMsg) => {
      setMessage(errorMsg);
      setTimeout(
        () => setMessage(gameStarted ? "Your turn" : "Waiting for opponent..."),
        2000
      );
    });

    socket.on("gameOver", (result) => {
      setMessage(result);
      setGameStarted(false);
    });

    socket.on("playerLeft", ({ email }) => {
      setMessage(`${email} has left the game. Waiting for new opponent...`);
      setGameStarted(false);
      setPlayerRole(null);
    });

    return () => {
      socket?.off("playerRole", handlePlayerRole);
      socket?.off("gameStart", handleGameStart);
      socket?.off("move", handleMove);
      // socket.off("playerRole");
      // socket.off("gameStart");
      // socket.off("move");
      socket.off("boardState");
      socket.off("invalidMove");
      socket.off("error");
      socket.off("gameOver");
      socket.off("playerLeft");
    };
  }, [socket, chess, gameStarted]);

  const handleSquareClick = (squareRepresentation) => {
    console.log("gameStarted from handleSqu.. : ", gameStarted);
    if (!gameStarted || playerRole === "spectator") {
      setMessage("Please wait for a spot to open");
      return;
    }

    console.log("playerRole from client " + playerRole);
    if (chess.turn() !== playerRole) {
      setMessage("Not your turn!");
      return;
    }

    if (!from) {
      // Check if the piece belongs to the current player
      const piece = chess.get(squareRepresentation);
      console.log("Piece: ", piece);
      if (piece && piece.color === playerRole) {
        setFrom(squareRepresentation);
        setMessage("Select destination square");
      }
    } else {
      const move = {
        from,
        to: squareRepresentation,
        promotion: "q", // Always promote to queen for simplicity
      };

      socket.emit("move", move);
      setFrom(null);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-white mb-4">{message}</div>
      <div className="text-white-200">
        {board.map((row, i) => (
          <div key={i} className="flex">
            {row.map((square, j) => {
              const squareRepresentation =
                String.fromCharCode(97 + j) + (8 - i);
              return (
                <div
                  onClick={() => handleSquareClick(squareRepresentation)}
                  key={j}
                  className={`w-16 h-16 ${
                    (i + j) % 2 === 0 ? "bg-green-500" : "bg-slate-500"
                  } ${
                    from === squareRepresentation
                      ? "border-2 border-yellow-400"
                      : ""
                  }`}
                >
                  <div className="h-full justify-center flex flex-col">
                    {square && (
                      <img
                        className="w-4"
                        src={`/${
                          square.color === "b"
                            ? square.type
                            : `${square.type.toUpperCase()} copy`
                        }.png`}
                        alt={`${square.color}${square.type}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChessBoard;
