import React, { useState, useEffect, useMemo } from "react";
import MentorShell from "../../../components/mentor/MentorShell";
import Badge from "../../../components/Badge";
import Toast from "../../../components/Toast";
import EmptyState from "../../../components/EmptyState";
import SkeletonLoader from "../../../components/SkeletonLoader";
import api from "../../../utils/api";
import { formatDateTime, formatDate } from "../../../utils/formatDate";
import {
  FileText,
  User,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  AlertTriangle,
  Sparkles,
  ChevronDown,
} from "../../../components/Icons";

const STORAGE_KEY = "kstop_mentor_counseling_logs";

export default function CounselingLog() {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [topic, setTopic] = useState("Academic");
  const [notes, setNotes] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchMentees() {
      try {
        const res = await api.get("/mentor/mentees");
        setMentees(res.data?.mentees || []);
      } catch (err) {
        console.error("Failed to load mentees for counseling log", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMentees();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (err) {
      console.error("Failed to persist counseling logs", err);
    }
  }, [logs]);

  function handleSaveLog(e) {
    e.preventDefault();
    if (!selectedStudentId) {
      setToast({ type: "error", message: "Please select a mentee." });
      return;
    }
    if (!notes.trim()) {
      setToast({ type: "error", message: "Counseling observation notes are required." });
      return;
    }

    const mentee = mentees.find((m) => m.id === selectedStudentId);

    const newLog = {
      id: "counsel-" + Date.now(),
      studentId: selectedStudentId,
      studentName: mentee?.name || "Student",
      rollNumber: mentee?.rollNumber || "—",
      hostelName: mentee?.hostel?.name || "Hostel",
      attendance: mentee?.attendancePercentage,
      topic,
      notes: notes.trim(),
      actionPlan: actionPlan.trim() || null,
      followUpDate: followUpDate || null,
      createdAt: new Date().toISOString(),
    };

    setLogs((prev) => [newLog, ...prev]);
    setSelectedStudentId("");
    setNotes("");
    setActionPlan("");
    setFollowUpDate("");
    setShowForm(false);
    setToast({
      type: "success",
      message: `Counseling session logged for ${newLog.studentName}.`,
    });
  }

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.studentName?.toLowerCase().includes(q) ||
        l.rollNumber?.toLowerCase().includes(q) ||
        l.topic?.toLowerCase().includes(q) ||
        l.notes?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <MentorShell
      title="Mentee Counseling Log"
      subtitle="1-on-1 Guidance & Academic Welfare"
      backTo="/dashboard/mentor"
      actionButton={
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus size={15} />
          <span>{showForm ? "Close Form" : "Log New Session"}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[rgba(64,61,57,0.14)] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
              Total Sessions Logged
            </span>
            <strong className="text-2xl font-black font-mono text-[#252422] block mt-1">
              {logs.length}
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[rgba(64,61,57,0.14)] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
              Unique Mentees Counseled
            </span>
            <strong className="text-2xl font-black font-mono text-[#eb5e28] block mt-1">
              {new Set(logs.map((l) => l.studentId)).size} / {mentees.length}
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[rgba(64,61,57,0.14)] shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
              Follow-ups Pending
            </span>
            <strong className="text-2xl font-black font-mono text-emerald-700 block mt-1">
              {logs.filter((l) => l.followUpDate && new Date(l.followUpDate) >= new Date()).length}
            </strong>
          </div>
        </div>

        {/* Session Log Form */}
        {showForm && (
          <div className="p-6 rounded-2xl bg-white border border-[#eb5e28]/30 shadow-md space-y-4 animate-in fade-in duration-200">
            <div className="pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                Confidential Faculty Session Record
              </span>
              <h3 className="text-base font-bold text-[#252422] m-0 mt-0.5">
                Record 1-on-1 Mentorship Consultation
              </h3>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1">
                    Select Mentee *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
                  >
                    <option value="">-- Choose Assigned Student --</option>
                    {mentees.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.rollNumber}) · {m.attendancePercentage ?? "—"}% Attendance
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1">
                    Primary Consultation Theme
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
                  >
                    <option value="Academic">Academic Health & Course Performance</option>
                    <option value="Attendance">Attendance Advisory & Leave Regularization</option>
                    <option value="HostelLiving">Hostel Life, Food & Peer Adjustment</option>
                    <option value="Career">Internship, Placement & Career Planning</option>
                    <option value="Personal">Personal Well-being & General Counseling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1">
                  Confidential Counseling Notes *
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record summary of discussion, concerns raised by student, and observations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1">
                    Agreed Action Items / Mentee Target
                  </label>
                  <input
                    type="text"
                    value={actionPlan}
                    onChange={(e) => setActionPlan(e.target.value)}
                    placeholder="e.g. Minimum 80% attendance in Labs; meet tutor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1">
                    Follow-Up Review Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] text-xs font-bold text-[#756f67] hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Counseling Record
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Log Entries List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[rgba(64,61,57,0.14)] shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756f67]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search counseling records by student, roll number, topic..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>
            <span className="text-xs text-[#756f67] font-semibold">
              {filteredLogs.length} Records
            </span>
          </div>

          {loading ? (
            <SkeletonLoader type="card" count={2} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No counseling records found"
              description={
                search
                  ? "No counseling sessions matched your search criteria."
                  : "Click 'Log New Session' above to begin documenting 1-on-1 mentorship discussions."
              }
            />
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-5 rounded-2xl bg-white border border-[rgba(64,61,57,0.14)] shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[rgba(64,61,57,0.08)]">
                  <div>
                    <h4 className="text-sm font-bold text-[#252422] m-0">
                      {log.studentName}{" "}
                      <span className="font-mono text-xs font-normal text-[#756f67]">
                        ({log.rollNumber})
                      </span>
                    </h4>
                    <span className="text-[11px] text-[#756f67] block mt-0.5">
                      Session recorded on {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" size="sm">
                      {log.topic}
                    </Badge>
                    {log.attendance != null && (
                      <Badge
                        variant={log.attendance < 75 ? "urgent" : "approved"}
                        size="sm"
                      >
                        {log.attendance}% Attendance
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[#403d39] leading-relaxed whitespace-pre-wrap">
                  {log.notes}
                </div>

                {(log.actionPlan || log.followUpDate) && (
                  <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.08)] flex flex-wrap gap-4 text-xs">
                    {log.actionPlan && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#756f67] block">
                          Agreed Target / Action
                        </span>
                        <strong className="text-[#252422]">{log.actionPlan}</strong>
                      </div>
                    )}
                    {log.followUpDate && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#756f67] block">
                          Follow-up Date
                        </span>
                        <span className="font-mono text-[#eb5e28] font-bold">
                          {formatDate(log.followUpDate)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MentorShell>
  );
}
