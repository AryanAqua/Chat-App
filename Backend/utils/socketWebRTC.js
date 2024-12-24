import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

//Waiting Users
let waitingUsers = []; 
//Waiting Room
const activeRooms = new Map();


// const emailToSocketIdMap = new Map();
// const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  // Handle user sign-in
  socket.on('userSignedIn', (userData) => {
    console.log('User signed in:', userData);
    const { userId, username } = userData;
    
    if (waitingUsers.length > 0) {
      // Match with waiting user
      const partnerSocket = waitingUsers.shift();
      const roomId = `room_${Date.now()}`;
      
      // Create new room
      activeRooms.set(roomId, {
        users: [
          { socketId: socket.id, userId, username },
          { socketId: partnerSocket.id, userId: partnerSocket.userData?.userId, username: partnerSocket.userData?.username }
        ]
      });

      socket.userData = userData;

      // Join both users to room
      socket.join(roomId);
      partnerSocket.join(roomId);

      // Notify both users about the match
      io.to(roomId).emit('matchFound', {
        roomId,
        message: 'Match found! Game starting...'
      });
    } else {
      
      socket.userData = userData;
      // Add to waiting queue
      waitingUsers.push(socket);
      socket.emit('waiting', {
        message: 'Waiting for user to join...'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log("User disconnected: ", socket.id);

    //Remove from waiting queue if present
    waitingUsers = waitingUsers.filter(user => user.id !== socket.id);

    //Active Room Cleanup
    for(const [roomId, room] of activeRooms.entries()){
      if(room.users.includes(socket.id)){
        //Notify other users in room
        const otherUserId = room.users.find(id => id !== socket.id);
        if(otherUserId){
          io.to(otherUserId).emit('partnerDiconnected', {
            message: "Your partner has disconnected. Waiting for new partner... "
          });

          //Add other user back to waiting queue
          const otherUserSocket = io.sockets.sockets.get(otherUserId);

          if(otherUserSocket){
            waitingUsers.push(otherUserSocket);
            otherUserSocket.emit('waiting', {
              message: 'Waiting for user to join...'
            });
          }
        }
        activeRooms.delete(roomId);
      }
    }
  });

  socket.on('rejoin', ({userId, roomId}) => {
    const room = activeRooms.get(roomId);
    if(room && room.users.includes(socket.id)){
      socket.join(roomId);
      socket.emit('rejoined', {roomId});
    }else{
      socket.emit('userSignedIn', userId);
    }
  })

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
})

export {app, server , io} ;