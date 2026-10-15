import React, { useEffect, useRef, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import Badge from "../../../components/Badge";
import SkeletonLoader from "../../../components/SkeletonLoader";
import Toast from "../../../components/Toast";
import api from "../../../utils/api";
import { createChatSocket } from "../../../lib/socket-client";
import { formatTime, formatDateTime } from "../../../utils/formatDate";
import {
  MessageSquare,
  Send,
  User,
  Shield,
  Clock,
  Sparkles,
} from "../../../components/Icons";

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

    async function loadMessages() {
      try {
        const response = await api.get("/parent/messages");
        if (mounted) {
          setMessages(response.data.messages || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || "Failed to load message history.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMessages();

    // Connect Socket.IO
    const socket = createChatSocket();
    socketRef.current = socket;

    if (!socket) {
      setError("Authentication token not found. Please log in again.");
      return () => {
        mounted = false;
      };
    }

    socket.on("connect", () => {
      if (mounted) {
        setConnected(true);
        setError("");
      }
    });

    socket.on("disconnect", () => {
      if (mounted) setConnected(false);
    });

    socket.on("chat-ready", (data) => {
      if (!mounted) return;
      if (data.mentor) setMentor(data.mentor);
      if (data.student) setStudent(data.student);
    });

    socket.on("parent-mentor-message", (message) => {
      if (!mounted) return;
      if (message.id && message.senderRole) {
        try {
          localStorage.setItem(`kstop_msg_role_${message.id}`, message.senderRole);
        } catch {}
      }
      setMessages((current) => {
        if (current.some((m) => m.id === message.id)) return current;
        return [...current, message];
      });
    });

    socket.on("chat-error", (data) => {
      if (!mounted) return;
      setError(data.message || "Chat communication error.");
    });

    socket.on("connect_error", () => {
      if (!mounted) return;
      setError("Unable to reach real-time chat gateway. REST messaging fallback is active.");
    });

    return () => {
      mounted = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;

    setSending(true);
    setError("");

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("send-parent-message", { message: content });
      setText("");
      setSending(false);
    } else {
      // Graceful REST fallback via POST /api/parent/message-mentor
      try {
        const response = await api.post("/parent/message-mentor", { message: content });
        if (response.data?.message) {
          const newMsg = { ...response.data.message, senderRole: "parent" };
          try {
            localStorage.setItem(`kstop_msg_role_${newMsg.id}`, "parent");
          } catch {}
          setMessages((current) => {
            if (current.some((m) => m.id === newMsg.id)) return current;
            return [...current, newMsg];
          });
        }
        setText("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to dispatch message to mentor.");
      } finally {
        setSending(false);
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }

  return (
    <ParentShell
      title="Direct Mentor Chat"
      eyebrow="Faculty Communication"
      backTo="/dashboard/parent"
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Mentor Info Header Card */}
        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#eb5e28] to-[#c94a1b] text-white flex items-center justify-center font-bold text-base shadow-sm">
              {mentor?.name?.[0] || "M"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#252422] m-0">
                  {mentor?.name ? `Prof. ${mentor.name}` : "Assigned Faculty Mentor"}
                </h3>
                <span
                  className={`w-2 h-2 rounded-full ${
                    connected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                  }`}
                />
              </div>
              <span className="text-xs text-[#756f67] block mt-0.5">
                {student ? `Regarding student: ${student.name} (${student.rollNumber})` : "Student mentor channel"}
              </span>
            </div>
          </div>

          <Badge variant={connected ? "approved" : "pending"} dot size="sm">
            {connected ? "LIVE GATEWAY CONNECTED" : "RECONNECTING..."}
          </Badge>
        </div>

        {error && <Toast type="error" message={error} onClose={() => setError("")} />}

        {/* Chat Thread Container */}
        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] shadow-sm flex flex-col h-[520px] overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#fbfaf6]/60">
            {loading ? (
              <SkeletonLoader type="text" count={5} />
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#756f67] py-12">
                <div className="w-12 h-12 rounded-2xl bg-[#eb5e28]/10 text-[#eb5e28] flex items-center justify-center mb-3">
                  <MessageSquare size={22} />
                </div>
                <h4 className="text-sm font-bold text-[#252422] m-0">Direct Mentor Line</h4>
                <p className="text-xs max-w-sm mt-1 leading-relaxed">
                  Send a real-time message directly to your child's assigned mentor. Your conversation is preserved securely.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const savedRole = msg.id ? localStorage.getItem(`kstop_msg_role_${msg.id}`) : null;
                const effectiveRole = msg.senderRole || savedRole;
                const isParent = effectiveRole ? effectiveRole === "parent" : true;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isParent ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-[#756f67]">
                        {isParent ? "You (Parent)" : mentor?.name || "Faculty Mentor"}
                      </span>
                    </div>

                    <div
                      className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isParent
                          ? "bg-[#252422] text-[#fffcf2] rounded-tr-xs"
                          : "bg-white border border-[rgba(64,61,57,0.12)] text-[#252422] rounded-tl-xs"
                      }`}
                    >
                      <p className="m-0 whitespace-pre-wrap break-words">{msg.message}</p>
                      <span
                        className={`text-[9px] block mt-1.5 text-right font-mono ${
                          isParent ? "text-white/60" : "text-[#756f67]"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chat Composer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 bg-white border-t border-[rgba(64,61,57,0.1)] flex items-end gap-3"
          >
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message to the mentor (Press Enter to send)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white resize-none transition-all"
            />

            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="px-5 py-3 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={15} />
              <span className="hidden sm:inline">{sending ? "Sending..." : "Send"}</span>
            </button>
          </form>
        </div>
      </div>
    </ParentShell>
  );
}