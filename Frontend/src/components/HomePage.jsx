import { useEffect, useCallback, useState } from "react";
import peer from "../../services/peer";
import ReactPlayer from "react-player";
import {
  Home,
  Play,
  UserPlus,
  LogIn,
  Settings,
  MessageCircle,
  Mic,
  Video,
  MicOff,
  VideoOff,
  Trophy,
  Users,
  BookOpen,
  Clock,
} from "lucide-react";
import ChessBoard from "./ChessBoard";
import { useSocket } from "../context/SocketProvider";

const HomePage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [isCallInitiated, setIsCallInitiated] = useState(false);
  const [remoteStream, setRemoteStream] = useState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [opponent, setOpponent] = useState(null);

  const navItems = [
    { icon: <Home size={24} />, label: "Home", href: "#" },
    { icon: <Play size={24} />, label: "Play", href: "#" },
    // { icon: <Trophy size={24} />, label: 'Tournaments', href: '#' },
    // { icon: <Users size={24} />, label: 'Players', href: '#' },
    { icon: <BookOpen size={24} />, label: "Learn", href: "#" },
    { icon: <UserPlus size={24} />, label: "Sign Up", href: "#" },
    { icon: <LogIn size={24} />, label: "Login", href: "#" },
    { icon: <Settings size={24} />, label: "Settings", href: "#" },
  ];

  const handleMatchFound = useCallback(({ roomId, message, users }) => {
    console.log(`Match found in room ${roomId}`);
    const opponentData = users.find(user => user.socketId !== socket.id);
    setOpponent(opponentData);
    setRemoteSocketId(opponentData.socketId);
    // Navigate or update UI as needed
  }, [socket.id]);

  // const handleUserJoined = useCallback(({ email }) => {
  //   console.log(`Email ${email} joined room`);
  //   setRemoteSocketId(email);
  // }, []);

  const initializeStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const handleCallUser = useCallback(async () => {
    try {
      const stream = await initializeStream();
      if (stream) {
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
      }
    } catch (error) {
      console.error("Error in handleCallUser:", error);
    }
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      try {
        setRemoteSocketId(from);
        const stream = await initializeStream();
        if (stream) {
          const ans = await peer.getAnswer(offer);
          socket.emit("call:accepted", { to: from, ans });
        }
      } catch (error) {
        console.error("Error in handleIncommingCall:", error);
      }
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    try {
      if (myStream) {
        for (const track of myStream.getTracks()) {
          peer.peer.addTrack(track, myStream);
        }
      }
    } catch (error) {
      console.error("Error in sendStreams:", error);
    }
  }, [myStream]);

  useEffect(() => {
    if (remoteSocketId && !isCallInitiated) {
      handleCallUser();
      setIsCallInitiated(true);
    }
  }, [remoteSocketId, handleCallUser, isCallInitiated]);

  useEffect(() => {
    if (myStream) {
      sendStreams();
    }
  }, [myStream, sendStreams]);

  // const toggleAudio = useCallback(() => {
  //   if (myStream) {
  //     const audioTrack = myStream.getAudioTracks()[0];
  //     if (audioTrack) {
  //       audioTrack.enabled = !audioEnabled;
  //       setAudioEnabled(!audioEnabled);
  //     }
  //   }
  // }, [myStream, audioEnabled]);

  // const toggleVideo = useCallback(() => {
  //   if (myStream) {
  //     const videoTrack = myStream.getVideoTracks()[0];
  //     if (videoTrack) {
  //       videoTrack.enabled = !videoEnabled;
  //       setVideoEnabled(!videoEnabled);
  //     }
  //   }
  // }, [myStream, videoEnabled]);

  useEffect(() => {
    return () => {
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
      if (peer.peer) {
        peer.peer.close();
      }
    };
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("matchFound", handleMatchFound);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("matchFound", handleMatchFound);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleMatchFound,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now(),
          text: newMessage,
          timestamp: new Date().toLocaleTimeString(),
          sender: "You",
        },
      ]);
      setNewMessage("");
    }
  };

  // const toggleAudio = () => setAudioEnabled(!audioEnabled);
  // const toggleVideo = () => setVideoEnabled(!videoEnabled);

  return (
    <div className="flex h-screen bg-[#070707]">
      {/* Sidebar */}
      <div className="w-72 bg-[#262522] shadow-lg">
        <div className="p-4">
          <img
            src="/api/placeholder/240/80"
            alt="Chess Logo"
            className="w-full h-20 object-contain mb-8"
          />
          <nav className="space-y-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center space-x-4 px-4 py-3 text-white-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="text-gray-500">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Chess Board Area */}
      <div className="flex-1 flex flex-col bg-[#262522] m-4 rounded-lg shadow-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Game Board</h2>
            <Clock className="text-gray-500" />
            <span className="text-lg font-mono">10:00</span>
          </div>
          <div className="space-x-2">
            <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Resign
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Offer Draw
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <ChessBoard />
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-96 bg-[#262522] m-4 ml-0 rounded-lg shadow-lg flex flex-col">
        {/* WebRTC Streams */}
        <div>
          <h1>Room Page</h1>
          <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
          {myStream && <button onClick={sendStreams}>Send Stream</button>}
          {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
          {myStream && (
            <>
              <h1>My Stream</h1>
              <ReactPlayer
                playing
                muted
                height="100px"
                width="200px"
                url={myStream}
              />
            </>
          )}
          {remoteStream && (
            <>
              <h1>Remote Stream</h1>
              <ReactPlayer
                playing
                muted
                height="100px"
                width="200px"
                url={remoteStream}
              />
            </>
          )}
        </div>

        {/* Enhanced Chat Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold flex items-center">
              <MessageCircle size={20} className="mr-2" /> Chat
            </h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{message.sender}</span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-gray-700">{message.text}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 text-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
