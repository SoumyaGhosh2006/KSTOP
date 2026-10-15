import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import Badge from "../../../components/Badge";
import Tabs from "../../../components/Tabs";
import Toast from "../../../components/Toast";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import api from "../../../utils/api";
import { formatDate, formatDateTime } from "../../../utils/formatDate";
import {
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  Shield,
  AlertTriangle,
  Check,
  X,
  FileText,
  Sparkles,
} from "../../../components/Icons";

const CATEGORIES = [
  { value: "Water", base: 70, label: "Water Supply & RO", desc: "No water, contaminated water, dispenser issue" },
  { value: "Electrical", base: 75, label: "Electrical & Power", desc: "Outage, switches, wiring, fan/AC failure" },
  { value: "Plumbing", base: 60, label: "Plumbing & Drainage", desc: "Leakage, clogged drain, washroom taps" },
  { value: "Transport", base: 50, label: "Campus Transport", desc: "Bus schedules, campus shuttle issues" },
  { value: "Internet", base: 45, label: "WiFi & Internet", desc: "Hostel WiFi connectivity, LAN issues" },
  { value: "Cleaning", base: 40, label: "Housekeeping & Cleaning", desc: "Room cleaning, corridor garbage, pests" },
  { value: "Food", base: 55, label: "Mess & Food Quality", desc: "Food hygiene, menu shortage, kitchen clean" },
  { value: "Other", base: 30, label: "Other Campus Facility", desc: "Carpentry, security, miscellaneous issues" },
];

const SEVERITY_GROUPS = [
  {
    score: 30,
    terms: ["fire", "smoke", "gas leak", "electric shock", "sparks", "explosion", "flood", "sewage overflow", "emergency", "dangerous"],
  },
  {
    score: 20,
    terms: ["no water", "no electricity", "power outage", "blackout", "short circuit", "severe leak", "broken pipe", "unsafe", "urgent"],
  },
  {
    score: 10,
    terms: ["leak", "broken", "not working", "unusable", "infection", "dirty water", "repeated", "days", "week"],
  },
];

function calculateClientPriority(category, title, description) {
  const catObj = CATEGORIES.find((c) => c.value === category);
  const base = catObj ? catObj.base : 30;
  const text = `${title || ""} ${description || ""}`.toLowerCase();
  let boost = 0;
  for (const group of SEVERITY_GROUPS) {
    if (group.terms.some((term) => text.includes(term))) {
      boost += group.score;
    }
  }
  return Math.min(100, base + boost);
}

export default function MyGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active"); // "active" | "recent" | "history"
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const estimatedPriority = useMemo(() => {
    return calculateClientPriority(form.category, form.title, form.description);
  }, [form.category, form.title, form.description]);

  async function loadGrievances() {
    try {
      setError("");
      const res = await api.get("/grievance/my-grievances", { params: { view } });
      setGrievances(res.data.grievances || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load grievances.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrievances();
  }, [view]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.title.trim() || !form.category || !form.description.trim()) {
      setError("Please complete title, category, and description.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/grievance/create", form);
      setMessage("Grievance lodged successfully and dispatched to hostel staff.");
      setForm({ title: "", category: "", description: "" });
      setShowCreateForm(false);
      await loadGrievances();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit grievance.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRespond(id, response) {
    setActionId(id);
    setError("");
    setMessage("");

    try {
      await api.patch(`/grievance/${id}/respond`, { response });
      setMessage(
        response === "CONFIRMED"
          ? "You confirmed this grievance is resolved. Thank you!"
          : "Dispute recorded. This issue remains open for hostel staff attention."
      );
      await loadGrievances();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update your response.");
    } finally {
      setActionId(null);
    }
  }

  function getResolutionStatusBadge(item) {
    const status = item.resolutionStatus;
    switch (status) {
      case "RESOLVED":
        return <Badge variant="approved" dot>Resolved</Badge>;
      case "CLASHED":
        return <Badge variant="clashed" dot>Disputed / Clashed</Badge>;
      case "UNRESOLVED":
        return <Badge variant="rejected" dot>Unresolved</Badge>;
      default:
        return <Badge variant="progress" dot>In Progress</Badge>;
    }
  }

  return (
    <StudentShell
      title="Hostel Grievances"
      subtitle="Issue Management"
      backTo="/dashboard/student"
      actionButton={
        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          {showCreateForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showCreateForm ? "Close Form" : "Raise Grievance"}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Messages */}
        {message && <Toast type="success" message={message} onClose={() => setMessage("")} />}
        {error && <Toast type="error" message={error} onClose={() => setError("")} />}

        {/* Create Grievance Form Panel */}
        {showCreateForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[rgba(64,61,57,0.18)] p-6 sm:p-7 shadow-md space-y-5 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                  New Ticket
                </span>
                <h3 className="text-lg font-bold text-[#252422] m-0">Lodge Maintenance Grievance</h3>
              </div>
              {form.category && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200">
                  <Sparkles size={14} className="text-[#eb5e28]" />
                  <span className="text-xs font-bold text-[#eb5e28]">
                    Priority Score: {estimatedPriority}/100
                  </span>
                </div>
              )}
            </div>

            {/* Category Cards */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-2">
                Problem Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category: cat.value }))}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      form.category === cat.value
                        ? "bg-[#252422] text-[#fffcf2] border-[#252422] shadow-sm"
                        : "bg-[#fbfaf6] text-[#252422] border-[rgba(64,61,57,0.12)] hover:border-[#eb5e28]/50"
                    }`}
                  >
                    <strong className="text-xs font-bold block">{cat.label}</strong>
                    <span className="text-[10px] block opacity-70 mt-1 truncate">{cat.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                Grievance Title / Headline *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Major water leak in 3rd floor washroom, AC unit sparking"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-sm text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                Detailed Description *
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe room number, exact problem, and any safety hazards..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-sm text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white transition-all resize-y"
              />
            </div>

            {/* Real-time Priority Preview Bar */}
            {form.category && (
              <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.1)] text-xs space-y-2">
                <div className="flex justify-between items-center text-[11px] font-semibold">
                  <span className="text-[#756f67]">Automated Institutional Priority Score:</span>
                  <span className="font-mono font-bold text-[#eb5e28]">{estimatedPriority} / 100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      estimatedPriority >= 80
                        ? "bg-rose-500"
                        : estimatedPriority >= 60
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${estimatedPriority}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#756f67] m-0">
                  Calculated automatically based on category weight and detected emergency/urgency keywords.
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white hover:bg-black/5 text-[#252422] text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Dispatching..." : "Submit Grievance"}
              </button>
            </div>
          </form>
        )}

        {/* View Tabs */}
        <div className="flex items-center justify-between">
          <Tabs
            tabs={[
              { id: "active", label: "Active Grievances" },
              { id: "recent", label: "Recently Resolved (30d)" },
              { id: "history", label: "All History" },
            ]}
            activeTab={view}
            onChange={setView}
          />
        </div>

        {/* Grievance Items List */}
        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : grievances.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={
              view === "active"
                ? "No active grievances"
                : view === "recent"
                ? "No grievances resolved recently"
                : "No grievance records found"
            }
            description={
              view === "active"
                ? "All your maintenance requests have been resolved or confirmed."
                : "Historical maintenance records will be permanently archived here."
            }
            actionLabel={view === "active" ? "+ Raise a Complaint" : undefined}
            onAction={view === "active" ? () => setShowCreateForm(true) : undefined}
          />
        ) : (
          <div className="space-y-4">
            {grievances.map((item) => {
              const isResolved = item.resolutionStatus === "RESOLVED";
              const isClashed = item.resolutionStatus === "CLASHED";

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all hover:shadow-md ${
                    isClashed
                      ? "border-rose-300 bg-rose-50/10"
                      : isResolved
                      ? "border-emerald-200"
                      : "border-[rgba(64,61,57,0.14)]"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(64,61,57,0.08)]">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/dashboard/student/grievances/${item.id}`}
                          className="text-base font-bold text-[#252422] hover:text-[#eb5e28] transition-colors m-0"
                        >
                          {item.title}
                        </Link>
                        <span className="text-[10px] font-mono text-[#756f67]">
                          #{item.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-[#756f67] block mt-0.5">
                        Category: <strong>{item.category}</strong> · Lodged on {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-black/5 text-[#403d39] border border-black/5">
                        Priority {item.priorityScore ?? "—"}/100
                      </span>
                      {getResolutionStatusBadge(item)}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#403d39] leading-relaxed my-3.5">
                    {item.description}
                  </p>

                  {/* Dual Response Timeline Box */}
                  <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.1)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3.5">
                    {/* Hostel Response */}
                    <div className="p-2.5 rounded-lg bg-white border border-[rgba(64,61,57,0.08)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                        Hostel Staff Action
                      </span>
                      <strong className="text-xs block mt-1">
                        {item.staffStatus === "RESOLVED"
                          ? "Marked as Fixed / Resolved ✓"
                          : item.staffRespondedAt
                          ? "Marked as Unresolved / Pending ✗"
                          : "Awaiting staff response..."}
                      </strong>
                      {item.staffRespondedAt && (
                        <span className="text-[10px] text-[#756f67] block mt-0.5">
                          {formatDateTime(item.staffRespondedAt)}
                        </span>
                      )}
                    </div>

                    {/* Student Confirmation */}
                    <div className="p-2.5 rounded-lg bg-white border border-[rgba(64,61,57,0.08)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                        Your Confirmation
                      </span>
                      <strong className="text-xs block mt-1">
                        {item.studentStatus === "CONFIRMED"
                          ? "You confirmed: Resolved ✓"
                          : item.studentStatus === "DISPUTED"
                          ? "You reported: Still Unresolved ✗"
                          : "Pending your verification"}
                      </strong>
                      {item.studentRespondedAt && (
                        <span className="text-[10px] text-[#756f67] block mt-0.5">
                          {formatDateTime(item.studentRespondedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clashed Warning Note */}
                  {isClashed && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2 mb-3.5">
                      <AlertTriangle size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Resolution Disputed:</strong> The hostel staff marked this as resolved, but you reported
                        the issue is still unresolved. This keeps the ticket active on the warden's priority board.
                      </div>
                    </div>
                  )}

                  {/* Student Response Interactive Triggers */}
                  {view === "active" && !isResolved && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-[#756f67]">
                        Is this issue satisfactorily fixed?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={actionId === item.id}
                          onClick={() => handleRespond(item.id, "CONFIRMED")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            item.studentStatus === "CONFIRMED"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "border border-emerald-600/40 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          <Check size={14} />
                          <span>{item.studentStatus === "CONFIRMED" ? "Confirmed Fixed" : "Confirm Resolved"}</span>
                        </button>

                        <button
                          type="button"
                          disabled={actionId === item.id}
                          onClick={() => handleRespond(item.id, "DISPUTED")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            item.studentStatus === "DISPUTED"
                              ? "bg-rose-600 text-white shadow-xs"
                              : "border border-rose-600/40 text-rose-700 hover:bg-rose-50"
                          }`}
                        >
                          <X size={14} />
                          <span>{item.studentStatus === "DISPUTED" ? "Disputed" : "Report Still Broken"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {view !== "active" && item.resolvedAt && (
                    <div className="text-[11px] text-[#756f67] pt-2 border-t border-[rgba(64,61,57,0.08)]">
                      Permanently closed on {formatDate(item.resolvedAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentShell>
  );
}