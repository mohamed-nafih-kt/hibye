import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Lock,
  SendHorizontal,
  LogOut,
  Paperclip,
  File,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { encryptMessage } from "../../utils/crypto";
import "./ChatPage.css";

export default function ChatPage({
  socket,
  cryptoKey,
  roomId,
  messages,
  setMessages,
  isConnected,
  handleLeave,
}) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // If a user navigates directly to /chat without a socket connection, boot them back.
  useEffect(() => {
    if (!socket || !roomId) {
      navigate("/");
    }
  }, [socket, roomId, navigate]);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !cryptoKey) return;

    try {
      // Create JSON payload indicating text type
      const payload = JSON.stringify({ type: "text", text: newMessage });
      const encryptedPayload = await encryptMessage(cryptoKey, payload);

      // Send the encrypted blob to the relay server
      socket.emit("send_message", {
        roomId,
        message: encryptedPayload,
      });

      // Add to local state as our own message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "text",
          text: newMessage,
          isOwn: true,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        },
      ]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !socket || !cryptoKey) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;

      try {
        const payload = JSON.stringify({
          type: "file",
          fileName: file.name,
          fileType: file.type,
          fileData: base64Data,
        });
        const encryptedPayload = await encryptMessage(cryptoKey, payload);

        socket.emit("send_message", { roomId, message: encryptedPayload });

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "file",
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data,
            isOwn: true,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
          },
        ]);
      } catch (err) {
        console.error("Failed to send file", err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const onLeaveClick = () => {
    handleLeave();
    navigate("/");
  };

  if (!socket || !roomId) return null;

  return (
    <div className="glass-panel chat-container">
      <div className="chat-header">
        <div>
          <h2>Session: {roomId}</h2>
          <p>End-to-End Encrypted</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span
            className={`status-badge ${!isConnected ? "disconnected" : ""}`}
          >
            {isConnected ? "Connected" : "Reconnecting..."}
          </span>
          <button
            onClick={handleLeave}
            className="icon-btn"
            style={{
              background: "transparent",
              color: "var(--text-muted)",
              padding: "0.25rem",
            }}
            title="Leave Room"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="messages-area">
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              margin: "auto",
            }}
          >
            <Lock size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <p>Session initialized.</p>
            <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
              Messages are not stored and will be permanently lost when you
              leave.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-bubble ${msg.isOwn ? "own" : "peer"}`}
          >
            {msg.type === "file" ? (
              <div className="file-attachment">
                {msg.fileType && msg.fileType.startsWith("image/") ? (
                  <img
                    src={msg.fileData}
                    alt={msg.fileName}
                    className="attached-image"
                  />
                ) : (
                  <div className="attached-file">
                    <File size={24} className="file-icon" />
                    <div className="file-info">
                      <span className="file-name" title={msg.fileName}>
                        {msg.fileName}
                      </span>
                    </div>
                    <a
                      href={msg.fileData}
                      download={msg.fileName}
                      className="download-btn"
                      title="Download"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text">{msg.text}</div>
            )}
            <div className="time">{msg.time}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="input-area">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="icon-btn attachment-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach File"
        >
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          placeholder="Type an encrypted message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          autoComplete="off"
        />
        <button
          type="submit"
          className="icon-btn"
          disabled={!newMessage.trim()}
        >
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  );
}
