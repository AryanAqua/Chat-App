import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const SignUpPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [status, setStatus] = useState("connecting");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigateTo = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      setStatus("connected");
      console.log("Socket connected");
    });

    socket.on("waiting", (data) => {
      setStatus("waiting");
      setMessage(data.message);
    });

    socket.on("matchFound", (data) => {
      setStatus("matched");
      setMessage(data.message);
      navigateTo("/", { state: { roomId: data.roomId } });
    });

    socket.on("partnerDisconnected", (data) => {
      setStatus("waiting");
      setMessage(data.message);
    });

    return () => {
      socket.off("connect");
      socket.off("waiting");
      socket.off("matchFound");
      socket.off("partnerDisconnected");
    };
  }, [socket, navigateTo]);

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

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      let userData = await (isLogin
        ? loginUser({ email, password })
        : registerUser({ name, username, email, password }));

      // Store user data in localStorage
      localStorage.setItem("userData", JSON.stringify(userData));

      if (userData.token) {
        localStorage.setItem("token", userData.token);
      }

      // Emit socket event with consistent user data structure
      socket.emit("userSignedIn", {
        userId: userData._id,
        username: userData.username || email.split("@")[0],
        email: userData.email,
      });

      setStatus("waiting");
      setMessage("Waiting for opponent...");
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage(error.message || "Authentication failed. Please try again.");
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderWaitingOverlay = () => {
    if (status === "waiting" || isLoading) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">
              {isLoading ? "Processing..." : message}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{ backgroundPosition: "0% 50%" }}
      className="flex items-end justify-end min-h-screen bg-[url('https://images7.alphacoders.com/110/1104374.jpg')] bg-cover text-white"
    >
      {renderWaitingOverlay()}

      {/* Section 1 */}
      <div className="pr-10 pb-[115px] pr-[125px] flex flex-col justify-center items-center space-y-6">
        <h1 className="text-5xl font-bold">Happening now</h1>
        <h2 className="text-3xl font-bold">Join today.</h2>

        {message && status === "error" && (
          <div className="bg-red-500 text-white p-3 rounded-lg w-full max-w-sm">
            {message}
          </div>
        )}

        <form onSubmit={submitHandler} className="space-y-4 w-full max-w-sm">
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
          <button
            type="submit"
            disabled={isLoading}
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
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
            className="text-blue-500 hover:text-blue-400"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>

        <div className="text-center text-gray-400">
          {/* <Link to={'/password/forgot'}>Forgot Password?</Link> */}
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
