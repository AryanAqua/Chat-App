// import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketProvider";

function Chats() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messageEndRef = useRef(null);
  const socket = useSocket();

    useEffect(() => {
      socket.on("receive_message", (message) => {
        setMessages(prev => [...prev, {
          ...message,
          sender: "other"
        }]);
      });
  
      return () => {
        socket.off("receive_message");
      };
    }, []);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageData = {
        id: Date.now(),
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        }),
        sender: "you",
        avatar: "/api/placeholder/32/32"
      };

      socket.emit("send_message", messageData);
      setMessages(prev => [...prev, messageData]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-white">
      <div className=" bg-[#0d0c0c] h-10 pt-1 pl-2 w-auto text-start font-bold">Opponent</div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "you" ? "justify-end" : "justify-start"
            } items-start gap-2`}
             ref={messageEndRef}
          >
            {message.sender === "other" && (
              <img
                src={message.avatar}
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <div
              className={`flex flex-col ${
                message.sender === "you" ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{message.timestamp}</span>
              </div>
              <div
                className={`mt-1 px-4 py-2 rounded-2xl max-w-[80%] ${
                  message.sender === "you"
                    ? "bg-blue-600"
                    : "bg-gray-800"
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
            {message.sender === "you" && (
              <img
                src={message.avatar}
                alt="avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
          </div>
        ))}
      </div>
      <div className="p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chats;