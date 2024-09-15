import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("https://konnect-backend-1.onrender.com/"); // Connect to the backend server

export default function Home() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [isChatVisible, setIsChatVisible] = useState(false);

  let stopTypingTimeout;

  useEffect(() => {
    // Handle incoming messages
    const handleMessage = (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    };

    // Handle typing events
    const handleTyping = ({ username }) => {
      setTypingUsers((prevTypingUsers) => ({
        ...prevTypingUsers,
        [username]: true,
      }));
    };

    const handleStopTyping = ({ username }) => {
      setTypingUsers((prevTypingUsers) => {
        const { [username]: _, ...rest } = prevTypingUsers;
        return rest;
      });
    };

    socket.on("message", handleMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("message", handleMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, []);

  const handleJoinRoom = () => {
    if (username.trim() && room.trim()) {
      socket.emit("joinRoom", { username, room });
      setIsChatVisible(true);
    }
  };

  const handleTyping = () => {
    socket.emit("typing", { username });
  };

  const handleStopTyping = () => {
    socket.emit("stopTyping", { username });
  };

  const sendMessage = () => {
    if (message.trim() && username.trim()) {
      const msg = { room, username, text: message };
      socket.emit("message", msg);
      setMessage(""); // Clear input field after sending
      handleStopTyping(); // Stop typing when a message is sent
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="flex w-full max-w-5xl h-[90vh] bg-white rounded-lg shadow-lg">
        {/* Sidebar */}
        <div className="flex flex-col w-1/3 bg-gray-800 text-white p-4 rounded-l-lg">
          <h2 className="text-2xl font-bold mb-6">Join a Room</h2>
          {!isChatVisible && (
            <>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your full name..."
              />
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter chat room name..."
              />
              <button
                onClick={handleJoinRoom}
                className="w-full py-3 font-semibold bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                Enter Chat
              </button>
            </>
          )}
        </div>

        {/* Chat Section */}
        <div className="flex flex-col w-2/3">
          <div className="flex flex-col h-full p-4">
            {/* Chat Header */}
            <div className="flex items-center justify-between bg-gray-100 p-4 rounded-t-lg">
              {isChatVisible && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Room: {room}</h2>
                    <p className="text-sm text-gray-600">You are chatting as {username}</p>
                  </div>
                </>
              )}
            </div>

            {/* Messages Display */}
            <div className="flex flex-col flex-grow h-0 p-4 mb-4 overflow-y-auto bg-gray-100 rounded-lg">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 my-2 rounded-lg ${
                    msg.username === username ? 'bg-green-500 text-white self-end' : 'bg-gray-600 text-white self-start'
                  }`}
                >
                  <strong>{msg.username}: </strong>{msg.text}
                </div>
              ))}
              {/* Typing Indicator */}
              {Object.keys(typingUsers).map((user) => (
                <p key={user} className="text-sm text-gray-500">
                  {user} is typing...
                </p>
              ))}
            </div>

            {/* Message Input and Send Button */}
            {isChatVisible && (
              <div className="flex items-center p-4 bg-gray-100 rounded-b-lg">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                    clearTimeout(stopTypingTimeout);
                    stopTypingTimeout = setTimeout(handleStopTyping, 2000);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                      handleStopTyping();
                    }
                  }}
                  className="flex-1 p-3 mr-4 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Type your message..."
                />
                <button
                  onClick={() => {
                    sendMessage();
                    handleStopTyping();
                  }}
                  className="px-5 py-3 font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
