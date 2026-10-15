import React, { useEffect, useState, useMemo } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import Badge from "../../../components/Badge";
import Tabs from "../../../components/Tabs";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import { FileText, Search, Calendar, MapPin, CheckCircle2, Clock } from "../../../components/Icons";

const TABS = [
  { id: "all", label: "All History" },
  { id: "approved", label: "Approved" },
  { id: "pending", label: "Pending" },
  { id: "rejected", label: "Rejected" },
];

export default function ParentLeaveHistory() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/parent/leave-history")
      .then((res) => setLeaves(res.data.leaves || []))
      .catch(() => setLeaves([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return leaves.filter((leave) => {
      if (activeTab === "approved" && leave.status !== "APPROVED") return false;
      if (
        activeTab === "pending" &&
        !["PENDING_PARENT", "PENDING_MENTOR"].includes(leave.status)
      ) {
        return false;
      }
      if (activeTab === "rejected" && leave.status !== "REJECTED") return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          leave.type?.toLowerCase().includes(q) ||
          leave.place?.toLowerCase().includes(q) ||
          leave.purpose?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leaves, activeTab, search]);

  function getStatusBadge(status) {
    switch (status) {
      case "APPROVED":
        return <Badge variant="approved" dot>Approved</Badge>;
      case "PENDING_PARENT":
        return <Badge variant="pending_parent" dot>Pending Parent</Badge>;
      case "PENDING_MENTOR":
        return <Badge variant="pending_mentor" dot>Pending Mentor</Badge>;
      case "REJECTED":
        return <Badge variant="rejected" dot>Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status?.replace(/_/g, " ")}</Badge>;
    }
  }

  return (
    <ParentShell
      title="Leave History"
      eyebrow="Student Ledger"
      backTo="/dashboard/parent"
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <Tabs
            tabs={TABS.map((t) => ({
              ...t,
              count:
                t.id === "all"
                  ? leaves.length
                  : t.id === "approved"
                  ? leaves.filter((l) => l.status === "APPROVED").length
                  : t.id === "pending"
                  ? leaves.filter((l) => ["PENDING_PARENT", "PENDING_MENTOR"].includes(l.status)).length
                  : leaves.filter((l) => l.status === "REJECTED").length,
            }))}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="relative min-w-[240px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756f67]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destination, type..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.18)] bg-white text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
            />
          </div>
        </div>

        {loading ? (
          <SkeletonLoader type="table" count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No records found"
            description={
              search ? "No requests match your search criteria." : "No leave history recorded for your child."
            }
          />
        ) : (
          <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#fbfaf6] border-b border-[rgba(64,61,57,0.1)] text-[#756f67] font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(64,61,57,0.06)]">
                  {filtered.map((leave) => (
                    <tr key={leave.id} className="hover:bg-black/[0.015] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#252422]">
                        {leave.type} Leave
                      </td>
                      <td className="py-3.5 px-4 text-[#403d39]">
                        {formatDate(leave.startDate)}
                      </td>
                      <td className="py-3.5 px-4 text-[#403d39]">
                        {formatDate(leave.endDate)}
                      </td>
                      <td className="py-3.5 px-4 text-[#403d39]">
                        {leave.place || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-[#756f67] max-w-xs truncate italic">
                        {leave.purpose || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {getStatusBadge(leave.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ParentShell>
  );
}