import { useEffect, useState, useRef } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import api from "../../../utils/api";
import "./parent-dashboard.css";

export default function ParentMessageMentor() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function loadMessages() {
    try {
      const res = await api.get("/parent/messages");
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    try {
      await api.post("/parent/message-mentor", { message: text.trim() });
      setText("");
      await loadMessages();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ParentShell title="Message Mentor" backTo="/dashboard/parent">
      {/* Message thread */}
      <div className="parent-surface parent-message-thread">
        {loading ? (
          <p style={{ color: "#8c857c" }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <div className="parent-empty-state">
            <p>No messages yet. Start the conversation below.</p>
          </div>
        ) : (
          <div className="parent-messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className="parent-message-bubble">
                <p className="parent-message-text">{msg.message}</p>
                <span className="parent-message-time">
                  {new Date(msg.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Reply form */}
      <form className="parent-surface parent-message-input-area" onSubmit={handleSubmit}>
        <textarea
          className="parent-message-textarea"
          placeholder="Type your message to the mentor..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
          <button
            className="parent-secondary-button"
            type="submit"
            disabled={sending || !text.trim()}
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </form>
    </ParentShell>
  );
}