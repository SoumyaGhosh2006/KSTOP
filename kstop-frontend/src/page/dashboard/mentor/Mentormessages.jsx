import { useEffect, useMemo, useRef, useState } from "react";
import MentorShell from "../../../components/mentor/MentorShell";
import api from "../../../utils/api";
import { createChatSocket } from "../../../lib/socket-client";

export default function Mentormessages() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    // Load existing messages
    async function loadMessages() {
      try {
        const response = await api.get("/mentor/messages");

        if (mounted) {
          setMessages(response.data.messages || []);
        }
      } catch (error) {
        if (mounted) {
          setError(error.response?.data?.message || "Failed to load messages.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    // Connect socket
    const socket = createChatSocket();

    socketRef.current = socket;

    if (!socket) {
      setError("You are not logged in.");

      return () => {
        mounted = false;
      };
    }

    socket.on("connect", () => {
      console.log("✅ Socket connected!");
      console.log("Socket ID:", socket.id);

      setConnected(true);
      setError("");
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);

      setConnected(false);
    });

    // Receive live messages
    socket.on("parent-mentor-message", (message) => {
      if (!mounted) return;

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (item) => item.id === message.id,
        );

        if (alreadyExists) {
          return currentMessages;
        }

        return [...currentMessages, message];
      });
    });

    socket.on("chat-error", (data) => {
      if (mounted) {
        setError(data.message || "Chat error.");
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);

      if (mounted) {
        setError(error.message || "Could not connect to live chat.");
      }
    });

    return () => {
      mounted = false;

      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Group messages into conversations
  const conversations = useMemo(() => {
    const conversationMap = new Map();

    messages.forEach((message) => {
      const key = `${message.parentId}:${message.studentId}`;

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          key,

          parentId: message.parentId,
          studentId: message.studentId,

          parentName: message.parentName || "Parent",

          studentName: message.studentName || "Student",

          studentRollNumber: message.studentRollNumber || "",

          messages: [],
        });
      }

      conversationMap.get(key).messages.push(message);
    });

    return Array.from(conversationMap.values());
  }, [messages]);

  // Select first conversation automatically
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0].key);
    }
  }, [conversations, selectedConversation]);

  const activeConversation = conversations.find(
    (conversation) => conversation.key === selectedConversation,
  );

  function handleSubmit(event) {
    event.preventDefault();

    const message = text.trim();

    if (!message) return;

    if (!activeConversation) {
      return;
    }

    const socket = socketRef.current;

    if (!socket?.connected) {
      setError("Live chat is not connected.");
      return;
    }

    setSending(true);

    // Send reply only to selected parent
    socket.emit("send-mentor-message", {
      parentId: activeConversation.parentId,
      message,
    });

    setText("");

    setSending(false);
  }

  if (loading) {
    return (
      <MentorShell title="Messages" backTo="/dashboard/mentor">
        <div>Loading messages...</div>
      </MentorShell>
    );
  }

  return (
    <MentorShell title="Messages" backTo="/dashboard/mentor">
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!connected && <p>Connecting to live chat...</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "20px",
        }}
      >
        {/* LEFT SIDE - PARENT CONVERSATIONS */}
        <div>
          <h3>Parent Conversations</h3>

          {conversations.length === 0 && <p>No messages yet.</p>}

          {conversations.map((conversation) => (
            <button
              key={conversation.key}
              type="button"
              onClick={() => setSelectedConversation(conversation.key)}
              style={{
                display: "block",

                width: "100%",

                textAlign: "left",

                padding: "12px",

                marginBottom: "8px",

                cursor: "pointer",

                border:
                  selectedConversation === conversation.key
                    ? "2px solid black"
                    : "1px solid #ddd",
              }}
            >
              <strong>{conversation.studentName}</strong>

              <div>{conversation.studentRollNumber}</div>

              <small>Parent: {conversation.parentName}</small>
            </button>
          ))}
        </div>

        {/* RIGHT SIDE - ACTIVE CHAT */}
        <div>
          {activeConversation ? (
            <>
              <h3>{activeConversation.parentName}</h3>

              <p>Student: {activeConversation.studentName}</p>

              <p>Roll Number: {activeConversation.studentRollNumber}</p>

              <div
                style={{
                  height: "400px",

                  overflowY: "auto",

                  border: "1px solid #ddd",

                  padding: "15px",

                  display: "flex",

                  flexDirection: "column",

                  gap: "10px",
                }}
              >
                {activeConversation.messages.map((message) => {
                  const isMentor = message.senderRole === "mentor";

                  return (
                    <div
                      key={message.id}
                      style={{
                        alignSelf: isMentor ? "flex-end" : "flex-start",

                        maxWidth: "75%",

                        padding: "10px",

                        background: isMentor ? "#e3f2fd" : "#f1f1f1",

                        borderRadius: "10px",
                      }}
                    >
                      <strong>
                        {isMentor ? "You" : activeConversation.parentName}
                      </strong>

                      <p>{message.message}</p>

                      <small>
                        {new Date(message.createdAt).toLocaleString("en-IN")}
                      </small>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  marginTop: "15px",
                }}
              >
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Reply to parent..."
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                  }}
                />

                <button
                  type="submit"
                  disabled={sending || !text.trim() || !connected}
                >
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </>
          ) : (
            <p>Select a parent conversation.</p>
          )}
        </div>
      </div>
    </MentorShell>
  );
}
