import { useEffect, useRef, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import api from "../../../utils/api";
import { createChatSocket } from "../../../lib/socket-client";
import "./parent-dashboard.css";

export default function ParentMessageMentor() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [mentor, setMentor] = useState(null);
  const [student, setStudent] = useState(null);

  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    // Load existing messages using your existing API
    async function loadMessages() {
      try {
        const response = await api.get("/parent/messages");

        if (mounted) {
          setMessages(response.data.messages || []);
        }
      } catch (error) {
        if (mounted) {
          setError(
            error.response?.data?.message ||
              "Failed to load messages."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    // Connect Socket.IO
    const socket = createChatSocket();

    socketRef.current = socket;

    if (!socket) {
      setError("You are not logged in.");

      return () => {
        mounted = false;
      };
    }

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // Receive assigned mentor and student information
    socket.on("chat-ready", (data) => {
      if (!mounted) return;

      setMentor(data.mentor || null);
      setStudent(data.student || null);
    });

    // Receive live message
    socket.on("parent-mentor-message", (message) => {
      if (!mounted) return;

      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (item) => item.id === message.id
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

    socket.on("connect_error", () => {
      if (mounted) {
        setError("Could not connect to live chat.");
      }
    });

    return () => {
      mounted = false;

      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function handleSubmit(event) {
    event.preventDefault();

    const message = text.trim();

    if (!message) return;

    const socket = socketRef.current;

    if (!socket?.connected) {
      setError("Live chat is not connected.");
      return;
    }

    setSending(true);

    socket.emit("send-parent-message", {
      message,
    });

    setText("");

    setSending(false);
  }

  if (loading) {
    return (
      <ParentShell
        title="Message Mentor"
        backTo="/dashboard/parent"
      >
        <div className="parent-surface">
          Loading messages...
        </div>
      </ParentShell>
    );
  }

  return (
    <ParentShell
      title="Message Mentor"
      backTo="/dashboard/parent"
    >
      <div className="parent-surface parent-message-thread">

        <div style={{ marginBottom: "15px" }}>
          <strong>
            {mentor
              ? `Mentor: ${mentor.name}`
              : "Assigned Mentor"}
          </strong>

          {student && (
            <p style={{ marginTop: "5px" }}>
              Student: {student.name} ({student.rollNumber})
            </p>
          )}

          <small>
            {connected
              ? "Live chat connected"
              : "Connecting..."}
          </small>
        </div>

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        <div
          style={{
            maxHeight: "450px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {messages.map((message) => {
            const isParent =
              message.senderRole === "parent";

            return (
              <div
                key={message.id}
                style={{
                  alignSelf: isParent
                    ? "flex-end"
                    : "flex-start",

                  maxWidth: "75%",

                  padding: "10px 14px",

                  borderRadius: "10px",

                  background: isParent
                    ? "#e3f2fd"
                    : "#f1f1f1",
                }}
              >
                <strong>
                  {isParent
                    ? "You"
                    : mentor?.name || "Mentor"}
                </strong>

                <p>{message.message}</p>

                <small>
                  {new Date(
                    message.createdAt
                  ).toLocaleString("en-IN")}
                </small>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ marginTop: "15px" }}
        >
          <textarea
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            placeholder="Type your message..."
            rows="3"
            style={{
              width: "100%",
              padding: "10px",
            }}
          />

          <button
            type="submit"
            disabled={
              sending ||
              !text.trim() ||
              !connected
            }
          >
            {sending
              ? "Sending..."
              : "Send Message"}
          </button>
        </form>
      </div>
    </ParentShell>
  );
}