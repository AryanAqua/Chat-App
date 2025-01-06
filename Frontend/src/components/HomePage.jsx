import {
  Home,
  Play,
  UserPlus,
  LogIn,
  Settings,
  BookOpen,
  Clock,
} from "lucide-react";
import ChessBoard from "./ChessBoard";
import Chats from "./Chats";
import Stream from "./Stream";

const HomePage = () => {
  const navItems = [
    { icon: <Home size={24} />, label: "Home", href: "#" },
    { icon: <Play size={24} />, label: "Play", href: "#" },
    { icon: <BookOpen size={24} />, label: "Learn", href: "#" },
    { icon: <UserPlus size={24} />, label: "Sign Up", href: "#" },
    { icon: <LogIn size={24} />, label: "Login", href: "#" },
    { icon: <Settings size={24} />, label: "Settings", href: "#" },
  ];

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
        <Stream />
        {/* Enhanced Chat Area */}
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
          <Chats />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
