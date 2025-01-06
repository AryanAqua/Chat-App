import { Server } from "socket.io";
import http from "http";
import express from "express";
import { Chess } from "chess.js";

const app = express();
const server = http.createServer(app);
const chess = new Chess();

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

const rooms = new Map();
const games = new Map();

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  //Chats Logic
  socket.on("send_message", (messageData) => {
    // Broadcast message to all other users
    socket.broadcast.emit("receive_message", messageData);
  });

  socket.on("room:create", ({ name }) => {
    const roomId = `room_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    rooms.set(roomId, {
      id: roomId,
      name,
      players: 0,
      // You can add more room metadata here
    });
    socket.emit("room:created", roomId);
    io.emit("rooms:list", Array.from(rooms.values()));
  });

  // Handle room list requests
  socket.on("get:rooms", () => {
    socket.emit("rooms:list", Array.from(rooms.values()));
  });

  //Bideo Logic 😂😂
  socket.on("room:join", (data) => {
    const { email, room } = data;

    if (!rooms.has(room)) {
      socket.emit("error", "Room does not exist");
      return;
    }

    if (rooms.has(room)) {
      const roomData = rooms.get(room);
      if (roomData.players < 2) {
        roomData.players += 1;
        rooms.set(room, roomData);
        io.emit("rooms:list", Array.from(rooms.values()));
      }
    }

    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);

    socket.join(room);

    if (!games.has(room)) {
      games.set(room, {
        chess: new Chess(),
        players: {
          white: null,
          black: null,
          emails: {
            white: null,
            black: null,
          },
        },
        gameStarted: false,
      });
    }

    const game = games.get(room);

    // Assign players for this room
    const isWhitePlayer = game.players.white === socket.id;
    const isBlackPlayer = game.players.black === socket.id;

    if (isWhitePlayer) {
      socket.emit("playerRole", "w");
    } else if (isBlackPlayer) {
      socket.emit("playerRole", "b");
    } else {
      // Assign new role only if socket doesn't have one
      if (!game.players.white) {
        game.players.white = socket.id;
        game.players.emails.white = email;
        socket.emit("playerRole", "w");
      } else if (!game.players.black) {
        game.players.black = socket.id;
        game.players.emails.black = email;
        socket.emit("playerRole", "b");

        // Start game when second player joins
        game.gameStarted = true;
        io.to(room).emit("gameStart", {
          white: game.players.emails.white,
          black: game.players.emails.black,
        });
      } else {
        socket.emit("playerRole", "spectator");
      }
    }
    if (game.gameStarted) {
      io.to(room).emit("gameStart", {
        white: game.players.emails.white,
        black: game.players.emails.black,
      });
    }

    io.to(room).emit("user:joined", { email, id: socket.id });
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("move", (move) => {
    const roomArray = Array.from(socket.rooms);
    const room = roomArray.find((room) => room !== socket.id);
    if (!room || !games.has(room)) return;

    const game = games.get(room);
    const chess = game.chess;

    try {
      if (!game.gameStarted) {
        // Fixed: use game.gameStarted
        socket.emit("error", "Wait for both players to join");
        return;
      }

      //Validate if user is playing their assigned role
      if (chess.turn() === "w" && socket.id !== game.players.white) {
        // Fixed: use game.players.white
        socket.emit("error", "Not your turn");
        return;
      }
      if (chess.turn() === "b" && socket.id !== game.players.black) {
        // Fixed: use game.players.black
        socket.emit("error", "Not your turn");
        return;
      }

      const result = chess.move(move);
      console.log("Result from backend: ", result);

      if (result) {
        io.to(room).emit("move", move);
        io.to(room).emit("boardState", chess.fen());

        if (chess.isGameOver()) {
          let gameResult = "";
          if (chess.isCheckmate()) {
            gameResult = `Checkmate! ${
              chess.turn() === "w" ? "Black" : "White"
            } wins!`;
          } else if (chess.isDraw()) {
            gameResult = "Game is a draw!";
          }
          io.to(room).emit("gameOver", gameResult);
          resetGame(room);
        }
      } else {
        socket.emit("invalidMove", move);
      }
    } catch (error) {
      console.log(error);
      socket.emit("error", "An error occurred");
    }
  });

  // WebRTC signaling events
  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  //Socket Disconnected
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
    const email = socketidToEmailMap.get(socket.id);

    games.forEach((game, room) => {
      if (
        socket.id === game.players.white ||
        socket.id === game.players.black
      ) {
        if (socket.id === game.players.white) {
          game.players.white = null;
          game.players.emails.white = null;
        } else if (socket.id === game.players.black) {
          game.players.black = null;
          game.players.emails.black = null;
        }

        if (game.gameStarted) {
          game.gameStarted = false;
          game.chess.reset();
          io.to(room).emit("playerLeft", { email });
        }
      }
    });
    rooms.forEach((roomData, roomId) => {
      const game = games.get(roomId);
      if (
        game &&
        (socket.id === game.players.white || socket.id === game.players.black)
      ) {
        roomData.players -= 1;
        if (roomData.players <= 0) {
          rooms.delete(roomId);
        } else {
          rooms.set(roomId, roomData);
        }
      }
    });

    io.emit("rooms:list", Array.from(rooms.values()));

    emailToSocketIdMap.delete(email);
    socketidToEmailMap.delete(socket.id);

    // if (gameStarted) {
    //   gameStarted = false;
    //   chess.reset();
    //   io.emit("playerLeft", { email });
    // }
  });
});

function resetGame(room) {
  const game = games.get(room);
  if (game) {
    game.chess.reset();
    game.gameStarted = false;
    io.to(room).emit("boardState", game.chess.fen());

    // If no players left, cleanup the game
    if (!game.players.white && !game.players.black) {
      games.delete(room);
    }
  }
}

export { app, server, io };
