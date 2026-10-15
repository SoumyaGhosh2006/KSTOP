import React, { useEffect, useMemo, useState } from "react";
import HostelShell from "../../../components/hostel/HostelShell";
import Tabs from "../../../components/Tabs";
import Badge from "../../../components/Badge";
import EmptyState from "../../../components/EmptyState";
import SkeletonLoader from "../../../components/SkeletonLoader";
import Toast from "../../../components/Toast";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  User,
  Building,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "../../../components/Icons";

const TABS = [
  { id: "active", label: "Active Tickets" },
  { id: "recent", label: "Recently Resolved (30d)" },
  { id: "history", label: "Resolution History" },
];

const CATEGORIES = [
  "All",
  "Plumbing",
  "Electrical",
  "Internet / WiFi",
  "Cleanliness",
  "Mess / Food",
  "Carpentry",
  "Other",
];

export default function HostelGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [view, setView] = useState("active");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  async function loadGrievances(targetView = view) {
    setLoading(true);
    try {
      const response = await api.get("/hostel/grievances", {
        params: { view: targetView },
      });
      setGrievances(response.data.grievances || []);
    } catch {
      setToast({
        type: "error",
        message: "Could not load hostel grievances from the database.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrievances(view);
  }, [view]);

  async function handleStatusUpdate(grievanceId, status) {
    setUpdatingId(grievanceId);
    setToast(null);

    try {
      const response = await api.patch(`/hostel/grievances/${grievanceId}/status`, {
        status,
      });

      // Update in local state
      setGrievances((prev) =>
        prev.map((g) =>
          g.id === grievanceId
            ? {
                ...g,
                staffStatus: status,
                staffRespondedAt: new Date().toISOString(),
                resolutionStatus: response.data?.grievance?.resolutionStatus || g.resolutionStatus,
              }
            : g
        )
      );

      setToast({
        type: "success",
        message: `Grievance ticket marked as ${status === "RESOLVED" ? "Resolved" : "Unresolved"}.`,
      });

      // Reload to ensure accurate sort/filtering
      await loadGrievances(view);
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Could not update grievance status.",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredGrievances = useMemo(() => {
    return grievances.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student?.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [grievances, selectedCategory, searchQuery]);

  function getGrievanceStatusBadge(item) {
    if (item.resolutionStatus === "RESOLVED") {
      return (
        <Badge variant="approved" dot size="sm">
          Resolved
        </Badge>
      );
    }
    if (item.resolutionStatus === "CLASHED") {
      return (
        <Badge variant="clashed" dot size="sm">
          Clashed
        </Badge>
      );
    }
    if (item.resolutionStatus === "UNRESOLVED") {
      return (
        <Badge variant="urgent" dot size="sm">
          Unresolved
        </Badge>
      );
    }
    return (
      <Badge variant="progress" dot size="sm">
        In Progress
      </Badge>
    );
  }

  return (
    <HostelShell
      title="Facility Grievances"
      eyebrow="Resident Maintenance & Welfare"
      backTo="/dashboard/hostel"
      actionButton={
        <button
          type="button"
          onClick={() => loadGrievances(view)}
          className="p-2 rounded-xl border border-[rgba(64,61,57,0.15)] bg-white hover:bg-[#f5f0e5] text-[#252422] transition-colors cursor-pointer"
          title="Refresh Grievances"
          aria-label="Refresh Grievances"
        >
          <RefreshCw size={15} />
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

        {/* View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs
            tabs={TABS.map((t) => ({
              ...t,
              count: view === t.id ? grievances.length : undefined,
            }))}
            activeTab={view}
            onChange={(newTab) => {
              setView(newTab);
              setExpandedId(null);
            }}
          />

          {/* Quick Stats Pill */}
          <span className="text-xs text-[#756f67] font-medium self-end sm:self-center">
            Showing <strong>{filteredGrievances.length}</strong> ticket(s)
          </span>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756f67]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, student name, or roll number..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#756f67] hover:text-[#252422]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#756f67] font-semibold">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grievance Ticket Cards */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonLoader type="card" count={3} />
          </div>
        ) : filteredGrievances.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={
              view === "active"
                ? "No active grievances found"
                : view === "recent"
                ? "No grievances resolved in the last 30 days"
                : "No historical grievances stored"
            }
            description={
              view === "active"
                ? "All resident maintenance issues for this hostel are currently resolved."
                : "Resolved tickets will appear in this archive as an institutional record."
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredGrievances.map((item) => {
              const isExpanded = expandedId === item.id;
              const isClashed = item.resolutionStatus === "CLASHED";

              return (
                <article
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all shadow-xs p-5 sm:p-6 space-y-4 ${
                    isClashed
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-[rgba(64,61,57,0.14)] hover:border-[rgba(235,94,40,0.4)]"
                  }`}
                >
                  {/* Top Bar: Badges & Priority */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getGrievanceStatusBadge(item)}
                      <Badge variant="neutral" size="sm">
                        {item.category}
                      </Badge>
                      {item.priorityScore != null && (
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            item.priorityScore >= 70
                              ? "bg-rose-100 text-rose-800"
                              : item.priorityScore >= 40
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          Priority Score: {item.priorityScore}/100
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-[#756f67]">
                      Logged on {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Title & Student Info */}
                  <div>
                    <h3 className="text-base font-bold text-[#252422] m-0 mb-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[#756f67]">
                      <span className="flex items-center gap-1 font-semibold text-[#403d39]">
                        <User size={13} /> {item.student?.name || "Student"}
                      </span>
                      <span>•</span>
                      <span className="font-mono">
                        Roll: {item.student?.rollNumber || "Not recorded"}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#403d39] leading-relaxed m-0 bg-[#fbfaf6] p-3 rounded-xl border border-[rgba(64,61,57,0.08)]">
                    {item.description}
                  </p>

                  {/* Clash Warning Notice */}
                  {isClashed && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Resolution Conflict:</strong> The hostel marked this issue as resolved, but the resident confirmed it remains unresolved. This ticket remains active until inspected and resolved.
                      </div>
                    </div>
                  )}

                  {/* Dual Response Status Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Hostel Decision */}
                    <div className="p-3 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#faf8f2] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#756f67] font-bold uppercase block">
                          Hostel Decision
                        </span>
                        <strong className="text-[#252422]">
                          {item.staffStatus === "RESOLVED"
                            ? "Marked Resolved"
                            : item.staffStatus === "OPEN"
                            ? "Marked Unresolved"
                            : "Pending Action"}
                        </strong>
                      </div>
                      {item.staffRespondedAt && (
                        <span className="text-[10px] text-[#756f67] font-mono">
                          {formatDate(item.staffRespondedAt)}
                        </span>
                      )}
                    </div>

                    {/* Resident Confirmation */}
                    <div className="p-3 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#faf8f2] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#756f67] font-bold uppercase block">
                          Student Confirmation
                        </span>
                        <strong className="text-[#252422]">
                          {item.studentStatus === "CONFIRMED"
                            ? "Confirmed Resolved"
                            : item.studentStatus === "DISPUTED"
                            ? "Disputed / Not Resolved"
                            : "Pending Confirmation"}
                        </strong>
                      </div>
                      {item.studentRespondedAt && (
                        <span className="text-[10px] text-[#756f67] font-mono">
                          {formatDate(item.studentRespondedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Bar (Only for active view) */}
                  {view === "active" && (
                    <div className="pt-2 border-t border-[rgba(64,61,57,0.08)] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] text-[#756f67]">
                        Update hostel maintenance response:
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => handleStatusUpdate(item.id, "RESOLVED")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            item.staffStatus === "RESOLVED"
                              ? "bg-emerald-600 text-white"
                              : "border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white"
                          }`}
                        >
                          <Check size={14} />
                          {item.staffStatus === "RESOLVED"
                            ? "✓ Resolved"
                            : "Mark as Resolved"}
                        </button>

                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => handleStatusUpdate(item.id, "OPEN")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            item.staffStatus === "OPEN"
                              ? "bg-[#252422] text-white"
                              : "border border-[rgba(64,61,57,0.2)] text-[#403d39] bg-white hover:bg-[#f5f0e5]"
                          }`}
                        >
                          {item.staffStatus === "OPEN"
                            ? "✓ Keep Unresolved"
                            : "Mark as Unresolved"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </HostelShell>
  );
}
