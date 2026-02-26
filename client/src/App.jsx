import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import io from "socket.io-client";
import { deriveKey, decryptMessage } from "./utils/crypto";
import HomeSelection from "./components/HomeSelection/HomeSelection";
import StartChat from "./components/StartChat/StartChat";
import JoinChat from "./components/JoinChat/JoinChat";
import ChatPage from "./components/ChatPage/ChatPage";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [cryptoKey, setCryptoKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleJoinWithCredentials = async (joinRoomId, joinPassword) => {
    // Prevent multiple parallel sockets if re-joining
    if (socket) {
      socket.disconnect();
    }

    try {
      // Derive PBKDF2 key from password and roomId (as salt)
      const key = await deriveKey(joinPassword, joinRoomId);
      setCryptoKey(key);

      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);
      setRoomId(joinRoomId);
      setPassword(joinPassword);

      // Return a promise to wait connection to succeed fully before navigating
      return new Promise((resolve, reject) => {
        newSocket.on("connect", () => {
          setIsConnected(true);
          newSocket.emit("join_room", joinRoomId);
          resolve();
        });

        newSocket.on("connect_error", (err) => {
          reject(err);
        });

        newSocket.on("disconnect", () => {
          setIsConnected(false);
        });

        newSocket.on("user_joined", (id) => {
          console.log("Another user joined");
        });

        newSocket.on("receive_message", async (data) => {
          // Attempt to decrypt incoming message using the local key
          if (!key) return;
          const decryptedText = await decryptMessage(key, {
            ciphertext: data.ciphertext,
            iv: data.iv,
          });

          if (decryptedText === null) {
            // Could not decrypt -> potentially wrong password or bad data
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: "[Encrypted message - Failed to decrypt]",
                isOwn: false,
                time: new Date().toLocaleTimeString(),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: decryptedText,
                isOwn: false,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
              },
            ]);
          }
        });
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
    }
    setSocket(null);
    setCryptoKey(null);
    setMessages([]);
    setRoomId("");
    setPassword("");
  };

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomeSelection />} />
          <Route
            path="/start"
            element={<StartChat onJoin={handleJoinWithCredentials} />}
          />
          <Route
            path="/join"
            element={<JoinChat onJoin={handleJoinWithCredentials} />}
          />
          <Route
            path="/chat"
            element={
              <ChatPage
                socket={socket}
                cryptoKey={cryptoKey}
                roomId={roomId}
                messages={messages}
                setMessages={setMessages}
                isConnected={isConnected}
                handleLeave={handleLeave}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
