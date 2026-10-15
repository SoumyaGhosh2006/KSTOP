import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import Badge from "../../../components/Badge";
import Tabs from "../../../components/Tabs";
import Modal from "../../../components/Modal";
import QRDisplay from "../../../components/QRDisplay";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  Calendar,
  Clock,
  Plus,
  QrCode,
  Search,
  MapPin,
  User,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "../../../components/Icons";

const FILTER_TABS = [
  { id: "all", label: "All Requests" },
  { id: "pending_parent", label: "Pending Parent" },
  { id: "pending_mentor", label: "Pending Mentor" },
  { id: "approved", label: "Approved (Active Passes)" },
  { id: "rejected", label: "Rejected" },
];

export default function MyLeaves() {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPassLeave, setSelectedPassLeave] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("kstop_user")) || {};
    } catch {
      return {};
    }
  })();

  async function loadLeaves() {
    try {
      setError("");
      const res = await api.get("/leave/my-leaves");
      setLeaves(res.data.leaves || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load leave history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaves();
  }, []);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      // Tab filter
      if (activeTab === "pending_parent" && leave.status !== "PENDING_PARENT") return false;
      if (activeTab === "pending_mentor" && leave.status !== "PENDING_MENTOR") return false;
      if (activeTab === "approved" && leave.status !== "APPROVED") return false;
      if (activeTab === "rejected" && leave.status !== "REJECTED") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesType = leave.type?.toLowerCase().includes(q);
        const matchesPlace = leave.place?.toLowerCase().includes(q);
        const matchesPurpose = leave.purpose?.toLowerCase().includes(q);
        return matchesType || matchesPlace || matchesPurpose;
      }
      return true;
    });
  }, [leaves, activeTab, searchQuery]);

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
    <StudentShell
      title="My Leave History"
      subtitle="Leave Records"
      backTo="/dashboard/student"
      actionButton={
        <Link
          to="/dashboard/student/new-leave"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm"
        >
          <Plus size={15} /> Apply New Leave
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Filter bar & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <Tabs
            tabs={FILTER_TABS.map((t) => ({
              ...t,
              count:
                t.id === "all"
                  ? leaves.length
                  : t.id === "pending_parent"
                  ? leaves.filter((l) => l.status === "PENDING_PARENT").length
                  : t.id === "pending_mentor"
                  ? leaves.filter((l) => l.status === "PENDING_MENTOR").length
                  : t.id === "approved"
                  ? leaves.filter((l) => l.status === "APPROVED").length
                  : leaves.filter((l) => l.status === "REJECTED").length,
            }))}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="relative min-w-[240px]">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756f67]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination, type..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.18)] bg-white text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] transition-all"
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        ) : filteredLeaves.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={searchQuery ? "No matching leaves found" : "No leave requests in this view"}
            description={
              searchQuery
                ? "Try searching for a different keyword or reset filters."
                : "You have not submitted any leave requests matching this filter category."
            }
            actionLabel={searchQuery ? "Clear Search" : "Apply for Leave"}
            onAction={
              searchQuery
                ? () => setSearchQuery("")
                : () => navigate("/dashboard/student/new-leave")
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredLeaves.map((leave) => {
              const isApproved = leave.status === "APPROVED";
              const isRejected = leave.status === "REJECTED";

              return (
                <div
                  key={leave.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all hover:shadow-md ${
                    isApproved
                      ? "border-emerald-300 bg-gradient-to-r from-emerald-50/20 via-white to-white"
                      : isRejected
                      ? "border-rose-200 bg-gradient-to-r from-rose-50/20 via-white to-white"
                      : "border-[rgba(64,61,57,0.14)]"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(64,61,57,0.08)]">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isApproved
                            ? "bg-emerald-100 text-emerald-800"
                            : isRejected
                            ? "bg-rose-100 text-rose-800"
                            : "bg-[#eb5e28]/10 text-[#eb5e28]"
                        }`}
                      >
                        {leave.type?.[0] || "L"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/dashboard/student/leaves/${leave.id}`}
                            className="text-base font-bold text-[#252422] hover:text-[#eb5e28] transition-colors m-0"
                          >
                            {leave.type} Leave
                          </Link>
                          <span className="text-[10px] font-mono text-[#756f67]">
                            #{leave.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-[#756f67] block mt-0.5">
                          Submitted on {formatDate(leave.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(leave.status)}
                      {isApproved && leave.qrCode && (
                        <button
                          type="button"
                          onClick={() => setSelectedPassLeave(leave)}
                          className="px-3 py-1.5 rounded-xl bg-[#252422] hover:bg-[#eb5e28] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <QrCode size={14} /> View Pass QR
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Leave Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 py-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block flex items-center gap-1">
                        <Calendar size={12} /> Leave Duration
                      </span>
                      <strong className="text-[#252422] text-xs font-semibold block mt-1">
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block flex items-center gap-1">
                        <MapPin size={12} /> Destination
                      </span>
                      <strong className="text-[#252422] text-xs font-semibold block mt-1">
                        {leave.place || "—"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block flex items-center gap-1">
                        <User size={12} /> Mentor
                      </span>
                      <strong className="text-[#252422] text-xs font-semibold block mt-1">
                        {leave.mentor?.name || "Assigned Faculty"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                        Contact Phone
                      </span>
                      <span className="text-[#252422] text-xs font-mono block mt-1">
                        {leave.contactNumber || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Purpose Quote */}
                  {leave.purpose && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.08)] text-xs text-[#403d39] mb-3">
                      <span className="font-bold text-[#756f67] block text-[10px] uppercase">Declared Purpose</span>
                      <p className="m-0 mt-0.5 italic">"{leave.purpose}"</p>
                    </div>
                  )}

                  {/* Rejection Feedback Note */}
                  {isRejected && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                      <AlertCircle size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Rejection Feedback:</strong>{" "}
                        {leave.rejectionReason || "Leave request was declined during institutional review."}
                      </div>
                    </div>
                  )}

                  {/* Workflow Approval Stepper */}
                  <div className="pt-3 border-t border-[rgba(64,61,57,0.08)] flex items-center justify-between text-[11px] text-[#756f67]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          leave.parentApproved ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-amber-500"
                        }`}
                      />
                      <span>
                        Parent: <strong>{leave.parentApproved ? "Approved ✓" : isRejected && !leave.parentApproved ? "Rejected ✗" : "Pending..."}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          leave.mentorApproved ? "bg-emerald-500" : isRejected && leave.parentApproved ? "bg-rose-500" : "bg-amber-500"
                        }`}
                      />
                      <span>
                        Mentor: <strong>{leave.mentorApproved ? "Approved ✓" : isRejected && leave.parentApproved ? "Rejected ✗" : leave.parentApproved ? "In Queue..." : "Awaiting Parent"}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Gate Pass Modal */}
      <Modal
        isOpen={Boolean(selectedPassLeave)}
        onClose={() => setSelectedPassLeave(null)}
        title="Official Campus Gate Pass"
        size="lg"
      >
        {selectedPassLeave && (
          <QRDisplay
            qrCode={selectedPassLeave.qrCode}
            leaveData={{
              ...selectedPassLeave,
              studentName: user?.name,
              rollNumber: user?.rollNumber,
            }}
          />
        )}
      </Modal>
    </StudentShell>
  );
}
