import React, { useEffect, useState } from "react";
import MentorShell from "../../../components/mentor/MentorShell";
import Badge from "../../../components/Badge";
import Tabs from "../../../components/Tabs";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import { AlertCircle, CheckCircle2, Shield, AlertTriangle, Building, User } from "../../../components/Icons";

export default function MentorGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGrievances() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/mentor/grievances", { params: { view } });
        setGrievances(res.data.grievances || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load mentee grievances.");
      } finally {
        setLoading(false);
      }
    }
    loadGrievances();
  }, [view]);

  function getStatusBadge(g) {
    if (g.studentStatus === "DISPUTED") {
      return <Badge variant="clashed" dot>Student Disputed</Badge>;
    }
    switch (g.resolutionStatus) {
      case "RESOLVED":
        return <Badge variant="approved" dot>Resolved</Badge>;
      case "UNRESOLVED":
        return <Badge variant="rejected" dot>Unresolved</Badge>;
      default:
        return <Badge variant="progress" dot>In Progress</Badge>;
    }
  }

  return (
    <MentorShell
      title="Mentee Grievances"
      subtitle="Student Welfare Oversight"
      backTo="/dashboard/mentor"
    >
      <div className="space-y-6">
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

        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        ) : grievances.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={view === "active" ? "No active grievances" : "No records in this archive"}
            description="Your mentees currently have no unresolved campus or hostel grievances."
          />
        ) : (
          <div className="space-y-4">
            {grievances.map((g) => {
              const isDisputed = g.studentStatus === "DISPUTED";
              const isResolved = g.resolutionStatus === "RESOLVED";

              return (
                <div
                  key={g.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm space-y-3.5 transition-all hover:shadow-md ${
                    isDisputed
                      ? "border-rose-300 bg-rose-50/10"
                      : isResolved
                      ? "border-emerald-200"
                      : "border-[rgba(64,61,57,0.14)]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(64,61,57,0.08)]">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-[#252422] m-0">{g.title}</h4>
                        <span className="text-xs font-mono text-[#756f67]">
                          #{g.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-[#756f67] block mt-0.5">
                        Filed by <strong className="text-[#252422]">{g.student?.name}</strong> ({g.student?.rollNumber}) · {g.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-black/5 text-[#403d39]">
                        Priority {g.priorityScore ?? "—"}/100
                      </span>
                      {getStatusBadge(g)}
                    </div>
                  </div>

                  <p className="text-xs text-[#403d39] leading-relaxed m-0">{g.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.08)] text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#756f67] block">Hostel Response</span>
                      <strong className="text-xs block mt-0.5">
                        {g.staffStatus === "RESOLVED" ? "Marked as Fixed by Staff ✓" : "Pending Staff Action"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#756f67] block">Mentee Confirmation</span>
                      <strong className="text-xs block mt-0.5">
                        {g.studentStatus === "CONFIRMED"
                          ? "Student Confirmed Fixed ✓"
                          : isDisputed
                          ? "Student Disputed / Still Broken ✗"
                          : "Awaiting Mentee Response"}
                      </strong>
                    </div>
                  </div>

                  {isDisputed && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                      <AlertTriangle size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Faculty Attention Required:</strong> Your mentee reports that hostel maintenance has not resolved this issue satisfactorily despite staff marking it closed.
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-[#756f67] pt-1">
                    <span>Hostel: <strong className="text-[#252422]">{g.hostel?.name || "Campus Hostel"}</strong></span>
                    <span>Logged on: {formatDate(g.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MentorShell>
  );
}