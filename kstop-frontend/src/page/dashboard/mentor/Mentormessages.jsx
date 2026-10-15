import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import MentorShell from "../../../components/mentor/MentorShell";
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
  Search,
  CheckCircle2,
} from "../../../components/Icons";

export default function MentorMessages() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const [menteesMap, setMenteesMap] = useState(new Map());

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [msgRes, menteesRes] = await Promise.allSettled([
          api.get("/mentor/messages"),
          api.get("/mentor/mentees"),
        ]);
        if (mounted && msgRes.status === "fulfilled") {
          setMessages(msgRes.value.data.messages || []);
        }
        if (mounted && menteesRes.status === "fulfilled") {
          const map = new Map();
          (menteesRes.value.data.mentees || []).forEach((m) => {
            map.set(m.id, m);
          });
          setMenteesMap(map);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || "Failed to load messages.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    const socket = createChatSocket();
    socketRef.current = socket;

    if (!socket) {
      setError("Authentication token missing.");
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

    socket.on("parent-mentor-message", (msg) => {
      if (!mounted) return;
      if (msg.id && msg.senderRole) {
        try {
          localStorage.setItem(`kstop_msg_role_${msg.id}`, msg.senderRole);
        } catch {}
      }
      setMessages((current) => {
        if (current.some((item) => item.id === msg.id)) return current;
        return [...current, msg];
      });
    });

    socket.on("chat-error", (data) => {
      if (mounted) setError(data.message || "Chat transmission error.");
    });

    socket.on("connect_error", () => {
      if (mounted) setError("Unable to connect to live chat gateway.");
    });

    return () => {
      mounted = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Group messages by unique parent-student pair
  const conversations = useMemo(() => {
    const map = new Map();
    messages.forEach((rawMsg) => {
      const savedRole = rawMsg.id ? localStorage.getItem(`kstop_msg_role_${rawMsg.id}`) : null;
      const msg = {
        ...rawMsg,
        senderRole: rawMsg.senderRole || savedRole || "parent",
      };
      const key = `${msg.parentId}:${msg.studentId}`;
      const mentee = menteesMap.get(msg.studentId);
      const studentName = msg.studentName || mentee?.name || "Student";
      const studentRollNumber = msg.studentRollNumber || mentee?.rollNumber || "";
      const parentName = msg.parentName || (mentee?.name ? `Parent of ${mentee.name}` : "Parent");

      if (!map.has(key)) {
        map.set(key, {
          key,
          parentId: msg.parentId,
          studentId: msg.studentId,
          parentName,
          studentName,
          studentRollNumber,
          messages: [],
          lastMessageAt: msg.createdAt,
        });
      }
      const conv = map.get(key);
      conv.messages.push({
        ...msg,
        parentName: msg.parentName || parentName,
        studentName: msg.studentName || studentName,
        studentRollNumber: msg.studentRollNumber || studentRollNumber,
      });
      if (new Date(msg.createdAt) > new Date(conv.lastMessageAt)) {
        conv.lastMessageAt = msg.createdAt;
      }
    });

    const list = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );
    // Sort each thread's messages chronologically (oldest at top, newest at bottom)
    list.forEach((conv) => {
      conv.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });

    return list;
  }, [messages, menteesMap]);

  useEffect(() => {
    if (location.state?.studentId && conversations.length > 0) {
      const match = conversations.find((c) => c.studentId === location.state.studentId);
      if (match) {
        setSelectedKey(match.key);
        return;
      }
    }
    if (!selectedKey && conversations.length > 0) {
      setSelectedKey(conversations[0].key);
    }
  }, [conversations, selectedKey, location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedKey]);

  const activeConversation = conversations.find((c) => c.key === selectedKey);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.parentName?.toLowerCase().includes(q) ||
        c.studentName?.toLowerCase().includes(q) ||
        c.studentRollNumber?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  function handleSendReply(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !activeConversation) return;

    const socket = socketRef.current;
    if (!socket?.connected) {
      setError("Live chat gateway is disconnected.");
      return;
    }

    setSending(true);
    socket.emit("send-mentor-message", {
      parentId: activeConversation.parentId,
      message: content,
    });
    setText("");
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply(e);
    }
  }

  return (
    <MentorShell
      title="Parent Inquiries & Messaging"
      subtitle="Direct Family Channel"
      backTo="/dashboard/mentor"
    >
      <div className="space-y-4">
        {error && <Toast type="error" message={error} onClose={() => setError("")} />}

        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] shadow-sm grid grid-cols-1 md:grid-cols-12 min-h-[580px] overflow-hidden">
          {/* Left Panel: Conversations list (4 cols) */}
          <div className="md:col-span-4 border-r border-[rgba(64,61,57,0.1)] flex flex-col bg-[#fbfaf6]">
            {/* Search */}
            <div className="p-3 border-b border-[rgba(64,61,57,0.1)]">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#756f67]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter families..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[rgba(64,61,57,0.18)] bg-white text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[rgba(64,61,57,0.06)]">
              {loading ? (
                <div className="p-4">
                  <SkeletonLoader type="text" count={4} />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-10 px-4 text-[#756f67]">
                  <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold m-0">No active parent chats</p>
                  <span className="text-[10px] block mt-1">Inbound messages from parents will appear here.</span>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = selectedKey === c.key;
                  const lastMsg = c.messages[c.messages.length - 1];

                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setSelectedKey(c.key)}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                        isSelected ? "bg-white shadow-xs border-l-4 border-l-[#eb5e28]" : "hover:bg-black/5"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#252422] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {c.parentName?.[0] || "P"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-[#252422] truncate block">
                            {c.parentName}
                          </strong>
                          {lastMsg && (
                            <span className="text-[9px] text-[#756f67] font-mono">
                              {formatTime(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#eb5e28] font-semibold block truncate">
                          Re: {c.studentName} ({c.studentRollNumber})
                        </span>
                        {lastMsg && (
                          <p className="text-[11px] text-[#756f67] m-0 mt-1 truncate">
                            {lastMsg.message}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Chat thread (8 cols) */}
          <div className="md:col-span-8 flex flex-col bg-white">
            {activeConversation ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-[rgba(64,61,57,0.1)] flex items-center justify-between bg-[#fbfaf6]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#eb5e28] to-[#c94a1b] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {activeConversation.parentName?.[0] || "P"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#252422] m-0">
                        {activeConversation.parentName}
                      </h4>
                      <span className="text-xs text-[#756f67] block">
                        Parent of <strong>{activeConversation.studentName}</strong> (Roll: {activeConversation.studentRollNumber})
                      </span>
                    </div>
                  </div>

                  <Badge variant={connected ? "approved" : "pending"} dot size="sm">
                    {connected ? "LIVE" : "CONNECTING..."}
                  </Badge>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#fbfaf6]/40">
                  {activeConversation.messages.map((m) => {
                    const isMentor = m.senderRole === "mentor";

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMentor ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-[#756f67]">
                            {isMentor ? "You (Mentor)" : activeConversation.parentName}
                          </span>
                        </div>

                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isMentor
                              ? "bg-[#252422] text-[#fffcf2] rounded-tr-xs"
                              : "bg-white border border-[rgba(64,61,57,0.12)] text-[#252422] rounded-tl-xs"
                          }`}
                        >
                          <p className="m-0 whitespace-pre-wrap break-words">{m.message}</p>
                          <span
                            className={`text-[9px] block mt-1.5 text-right font-mono ${
                              isMentor ? "text-white/60" : "text-[#756f67]"
                            }`}
                          >
                            {formatTime(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Reply Composer */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3 sm:p-4 bg-white border-t border-[rgba(64,61,57,0.1)] flex items-end gap-3"
                >
                  <textarea
                    rows={2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Reply to ${activeConversation.parentName} (Press Enter to send)...`}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white resize-none transition-all"
                  />

                  <button
                    type="submit"
                    disabled={sending || !text.trim() || !connected}
                    className="px-5 py-3 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send size={15} />
                    <span className="hidden sm:inline">{sending ? "Replying..." : "Reply"}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#756f67]">
                <MessageSquare size={32} className="mb-2 opacity-30" />
                <p className="text-sm font-bold text-[#252422] m-0">Select a Conversation</p>
                <span className="text-xs">Choose a parent thread from the left to view messages and reply.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </MentorShell>
  );
}
