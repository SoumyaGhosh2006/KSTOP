import React, { useState, useEffect } from "react";
import MentorShell from "../../../components/mentor/MentorShell";
import Badge from "../../../components/Badge";
import Toast from "../../../components/Toast";
import EmptyState from "../../../components/EmptyState";
import { formatDateTime } from "../../../utils/formatDate";
import {
  Bell,
  Send,
  Users,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
} from "../../../components/Icons";

const STORAGE_KEY = "kstop_mentor_announcements";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal"); // "normal" | "urgent" | "academic"
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
    } catch (e) {
      console.error("Failed to save announcements locally", e);
    }
  }, [announcements]);

  function handleBroadcast(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnnouncement = {
      id: "ann-" + Date.now(),
      title: title.trim(),
      content: content.trim(),
      priority,
      createdAt: new Date().toISOString(),
      recipients: "All Assigned Mentees",
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);
    setTitle("");
    setContent("");
    setMessage("Announcement dispatched to all assigned mentees.");
  }

  function handleDelete(id) {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <MentorShell
      title="Mentee Broadcast & Announcements"
      subtitle="Cohort Communication"
      backTo="/dashboard/mentor"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {message && <Toast type="success" message={message} onClose={() => setMessage("")} />}

        {/* Composer Card */}
        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="pb-3 border-b border-[rgba(64,61,57,0.08)]">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
              Broadcast Composer
            </span>
            <h3 className="text-lg font-bold text-[#252422] m-0">Send Announcement to All Mentees</h3>
            <p className="text-xs text-[#756f67] m-0 mt-1">
              Broadcast urgent reminders, examination requirements, or general mentorship guidance to your entire mentee cohort.
            </p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                Announcement Headline *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mandatory Midterm Attendance Verification & Leave Freeze"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                Message Body *
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter detailed instructions, deadlines, and room or laboratory instructions..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] resize-y"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#756f67]">Priority:</span>
                {[
                  ["normal", "Standard Advisory", "neutral"],
                  ["academic", "Academic Deadline", "progress"],
                  ["urgent", "Urgent Alert", "urgent"],
                ].map(([val, label, variant]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPriority(val)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      priority === val
                        ? "bg-[#252422] text-white shadow-xs"
                        : "bg-[#fbfaf6] border border-[rgba(64,61,57,0.14)] text-[#756f67] hover:text-[#252422]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-40"
              >
                <Send size={14} /> Dispatch Broadcast
              </button>
            </div>
          </form>
        </div>

        {/* Sent Announcements Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#252422] m-0">Recent Broadcasts</h3>
            <span className="text-xs text-[#756f67] font-semibold">{announcements.length} Dispatched</span>
          </div>

          {announcements.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No announcements dispatched yet"
              description="Announcements broadcasted to your mentees will be logged here."
            />
          ) : (
            <div className="space-y-3">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(64,61,57,0.08)]">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#252422] m-0">{item.title}</h4>
                      <Badge
                        variant={
                          item.priority === "urgent"
                            ? "urgent"
                            : item.priority === "academic"
                            ? "progress"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {item.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-[#756f67] hover:text-rose-600 p-1 cursor-pointer transition-colors"
                      title="Delete notice"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p className="text-xs text-[#403d39] leading-relaxed m-0 whitespace-pre-wrap">
                    {item.content}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#756f67] pt-1">
                    <span>Audience: <strong>{item.recipients}</strong></span>
                    <span>Dispatched: {formatDateTime(item.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MentorShell>
  );
}
