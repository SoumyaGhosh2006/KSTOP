import React, { useEffect, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import Badge from "../../../components/Badge";
import Tabs from "../../../components/Tabs";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import { AlertCircle, CheckCircle2, Shield, Building, User } from "../../../components/Icons";

export default function ParentGrievances() {
  const [grievances, setGrievances] = useState([]);
  const [view, setView] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGrievances() {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/parent/grievances", { params: { view } });
        setGrievances(response.data.grievances || []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load grievances.");
      } finally {
        setLoading(false);
      }
    }

    loadGrievances();
  }, [view]);

  function getStatusBadge(item) {
    switch (item.resolutionStatus) {
      case "RESOLVED":
        return <Badge variant="approved" dot>Resolved</Badge>;
      case "CLASHED":
        return <Badge variant="clashed" dot>Disputed</Badge>;
      case "UNRESOLVED":
        return <Badge variant="rejected" dot>Unresolved</Badge>;
      default:
        return <Badge variant="progress" dot>In Progress</Badge>;
    }
  }

  return (
    <ParentShell
      title="Student Grievances"
      eyebrow="Linked Student Monitoring"
      backTo="/dashboard/parent"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs
            tabs={[
              { id: "active", label: "Active Grievances" },
              { id: "recent", label: "Recently Resolved (30d)" },
              { id: "history", label: "Full History" },
            ]}
            activeTab={view}
            onChange={setView}
          />
        </div>

        {loading ? (
          <SkeletonLoader type="card" count={2} />
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        ) : grievances.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={view === "active" ? "No active grievances" : "No records in this category"}
            description="Your child has no open maintenance or hostel grievances in this view."
          />
        ) : (
          <div className="space-y-4">
            {grievances.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-3.5 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(64,61,57,0.08)]">
                  <div>
                    <h4 className="text-base font-bold text-[#252422] m-0">{g.title}</h4>
                    <span className="text-xs text-[#756f67] block mt-0.5">
                      {g.category} Category · Filed on {formatDate(g.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-black/5 text-[#403d39]">
                      Priority {g.priorityScore ?? "—"}/100
                    </span>
                    {getStatusBadge(g)}
                  </div>
                </div>

                <p className="text-xs text-[#403d39] leading-relaxed m-0">
                  {g.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.08)] text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#756f67] block">Hostel Action</span>
                    <strong className="text-xs block mt-0.5">
                      {g.staffStatus === "RESOLVED" ? "Resolved by Hostel ✓" : "Pending Staff Action"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#756f67] block">Student Confirmation</span>
                    <strong className="text-xs block mt-0.5">
                      {g.studentStatus === "CONFIRMED"
                        ? "Confirmed by Student ✓"
                        : g.studentStatus === "DISPUTED"
                        ? "Disputed by Student ✗"
                        : "Awaiting Student Review"}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#756f67] pt-1">
                  <span>Hostel: <strong className="text-[#252422]">{g.hostel?.name || "Campus Hostel"}</strong></span>
                  <span>Mentor: <strong className="text-[#252422]">{g.mentor?.name || "Faculty Mentor"}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ParentShell>
  );
}
