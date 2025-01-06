import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const SignUpPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  
  const navigateTo = useNavigate();
  const socket = useSocket();

  const loginUser = async (credentials) => {
    console.log("Login User : ", credentials);
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  };

  const registerUser = async (userData) => {
    const response = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    return response.json();
  };

  useEffect(() => {
    if (socket) {
      // Request available rooms when component mounts
      socket.emit("get:rooms");

      // Listen for available rooms updates
      socket.on("rooms:list", (rooms) => {
        setAvailableRooms(rooms);
      });

      // Listen for new room creation confirmation
      socket.on("room:created", (roomId) => {
        setSelectedRoom(roomId);
        setIsCreatingRoom(false);
      });

      // Listen for successful room join confirmation
      const handleRoomJoined = (data) => {
        console.log("Room joined successfully:", data);
        if (window.location.pathname !== '/') {
          navigateTo('/');
        }
      };

      socket.on("room:join", handleRoomJoined);

      return () => {
        socket.off("rooms:list");
        socket.off("room:created");
        socket.off("room:join", handleRoomJoined);
      };
    }
  }, [socket, navigateTo]);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      socket.emit("room:create", { name: newRoomName.trim() });
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!selectedRoom && !isCreatingRoom) {
      alert("Please select or create a room first");
      return;
    }
    
    try {
      let userData = await (isLogin
        ? loginUser({ email, password })
        : registerUser({ name, username, email, password }));
      
      console.log("Authentication successful:", userData);
      
      localStorage.setItem("userData", JSON.stringify(userData));
      
      if (userData.token) {
        localStorage.setItem("token", userData.token);
      }
      
      console.log("Emitting room:join event");
      socket.emit("room:join", {
        email: userData.user.email,
        room: selectedRoom
      });
      
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  return (
    <div
      style={{ backgroundPosition: "0% 50%" }}
      className="flex items-end justify-end min-h-screen bg-[url('https://images7.alphacoders.com/110/1104374.jpg')] bg-cover text-white"
    >
      <div className="pr-10 pb-[115px] pr-[125px] flex flex-col justify-center items-center space-y-6">
        <h1 className="text-5xl font-bold">Happening now</h1>
        <h2 className="text-3xl font-bold">Join today.</h2>

        <form onSubmit={handleAuth} className="space-y-4 w-full max-w-sm">
          {!isLogin && (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full p-3 bg-gray-800 text-white rounded-full outline-none focus:border-blue-500 focus:ring focus:ring-blue-500"
                required
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full p-3 bg-gray-800 text-white rounded-full outline-none focus:border-blue-500 focus:ring focus:ring-blue-500"
                required
              />
            </>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 bg-gray-800 text-white rounded-full outline-none focus:border-blue-500 focus:ring focus:ring-blue-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 bg-gray-800 text-white rounded-full outline-none focus:border-blue-500 focus:ring focus:ring-blue-500"
            required
          />

          {/* Room Selection */}
          <div className="space-y-2">
            {!isCreatingRoom ? (
              <>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full p-3 bg-gray-800 text-white rounded-full outline-none focus:border-blue-500 focus:ring focus:ring-blue-500"
                  required
                >
                  <option value="">Select a room</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.players}/2)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingRoom(true)}
                  className="w-full p-2 bg-green-500 rounded-full text-white font-bold hover:bg-green-600 transition"
                >
                  Create New Room
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full p-3 bg-gray-800 text-white rounded-full outline-none focus:border-blue-500 focus:ring focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    className="w-1/2 p-2 bg-green-500 rounded-full text-white font-bold hover:bg-green-600 transition"
                  >
                    Create Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingRoom(false)}
                    className="w-1/2 p-2 bg-gray-500 rounded-full text-white font-bold hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full p-3 bg-blue-500 rounded-full text-white font-bold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLogin ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <span className="text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 hover:text-blue-400"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;