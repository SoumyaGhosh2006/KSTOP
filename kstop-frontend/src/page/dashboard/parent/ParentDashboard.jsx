import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ParentShell from "../../../components/parent/ParentShell";
import StatusCard from "../../../components/StatusCard";
import Badge from "../../../components/Badge";
import SkeletonLoader from "../../../components/SkeletonLoader";
import Modal from "../../../components/Modal";
import Toast from "../../../components/Toast";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  User,
  Clock,
  FileText,
  AlertCircle,
  MessageSquare,
  Shield,
  Building,
  Check,
  X,
  ChevronRight,
} from "../../../components/Icons";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [historyLeaves, setHistoryLeaves] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectModalLeave, setRejectModalLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState(null);

  async function loadDashboard() {
    try {
      const [infoRes, pendingRes, historyRes, grievanceRes] = await Promise.allSettled([
        api.get("/parent/child-info"),
        api.get("/parent/pending-leaves"),
        api.get("/parent/leave-history"),
        api.get("/parent/grievances", { params: { view: "active" } }),
      ]);

      if (infoRes.status === "fulfilled") setChild(infoRes.value.data.child);
      if (pendingRes.status === "fulfilled") setPendingLeaves(pendingRes.value.data.leaves || []);
      if (historyRes.status === "fulfilled") setHistoryLeaves(historyRes.value.data.leaves || []);
      if (grievanceRes.status === "fulfilled") setGrievances(grievanceRes.value.data.grievances || []);
    } catch (err) {
      console.error("Parent dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleApprove(id) {
    setActionId(id);
    setToast(null);
    try {
      await api.patch(`/parent/leave/${id}/approve`);
      setToast({ type: "success", message: "Leave request approved and forwarded to faculty mentor." });
      await loadDashboard();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to approve leave request." });
    } finally {
      setActionId(null);
    }
  }

  async function handleConfirmReject() {
    if (!rejectModalLeave) return;
    setActionId(rejectModalLeave.id);
    setToast(null);
    try {
      await api.patch(`/parent/leave/${rejectModalLeave.id}/reject`, { reason: rejectReason });
      setToast({ type: "info", message: "Leave request rejected." });
      setRejectModalLeave(null);
      setRejectReason("");
      await loadDashboard();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to reject leave request." });
    } finally {
      setActionId(null);
    }
  }

  return (
    <ParentShell title="Parent Command Center" eyebrow="Family Oversight">
      <div className="space-y-6">
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
        {/* Child Overview Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#252422] via-[#33302b] to-[#403d39] text-[#fffcf2] p-6 sm:p-8 shadow-xl border border-white/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#eb5e28] flex items-center gap-1.5">
                <Shield size={14} /> Linked Ward Profile
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">
                {child?.name || "Loading student profile..."}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl m-0 leading-relaxed">
                Roll Number: <span className="font-mono text-white font-bold">{child?.rollNumber || "—"}</span> ·{" "}
                {child?.hostel?.name || "Hostel"}
              </p>

              {/* Meta details */}
              <div className="flex flex-wrap gap-4 pt-3 text-xs">
                <div className="px-3.5 py-1.5 rounded-lg bg-white/10 border border-white/10 flex items-center gap-2">
                  <Building size={14} className="text-[#eb5e28]" />
                  <span>Hostel: <strong className="text-white">{child?.hostel?.name || "Campus Residence"}</strong></span>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-white/10 border border-white/10 flex items-center gap-2">
                  <User size={14} className="text-[#eb5e28]" />
                  <span>Mentor: <strong className="text-white">{child?.mentor?.name || "Assigned Faculty"}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Action to Chat with Mentor */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
              <Link
                to="/dashboard/parent/message-mentor"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-md"
              >
                <MessageSquare size={16} /> Message Mentor
              </Link>
              <Link
                to="/dashboard/parent/pending-leaves"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15"
              >
                <Clock size={15} /> Review Approvals ({pendingLeaves.length})
              </Link>
            </div>
          </div>
        </div>

        {/* Action Attention Banner if Leaves Pending */}
        {pendingLeaves.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <strong className="text-sm font-bold block text-amber-950">
                  {pendingLeaves.length} Leave Request{pendingLeaves.length === 1 ? "" : "s"} Awaiting Your Endorsement
                </strong>
                <p className="text-xs text-amber-800 m-0 mt-0.5">
                  Your ward cannot be issued a QR Gate Pass by their faculty mentor until you review and approve their request.
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/parent/pending-leaves"
              className="px-4 py-2 rounded-xl bg-[#252422] hover:bg-[#eb5e28] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-end sm:self-center flex-shrink-0"
            >
              Take Action <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            eyebrow="Pending Endorsements"
            value={loading ? "—" : pendingLeaves.length}
            subtext="Requests waiting for your decision"
            icon={Clock}
            isUrgent={pendingLeaves.length > 0}
            onClick={() => navigate("/dashboard/parent/pending-leaves")}
          />

          <StatusCard
            eyebrow="Historical Leaves"
            value={loading ? "—" : historyLeaves.length}
            subtext="Total campus leave applications"
            icon={FileText}
            onClick={() => navigate("/dashboard/parent/leave-history")}
          />

          <StatusCard
            eyebrow="Ward Grievances"
            value={loading ? "—" : grievances.length}
            subtext="Active issues lodged by student"
            icon={AlertCircle}
            onClick={() => navigate("/dashboard/parent/grievances")}
          />

          <StatusCard
            eyebrow="Mentor Link"
            value={child?.mentor?.name ? "Active" : "Pending"}
            subtext={child?.mentor?.name ? `Assigned to ${child.mentor.name}` : "Pending institutional assignment"}
            icon={User}
            onClick={() => navigate("/dashboard/parent/message-mentor")}
          />
        </div>

        {/* Pending Requests Queue Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#252422] m-0">Pending Approvals Queue</h3>
            <Link
              to="/dashboard/parent/pending-leaves"
              className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1"
            >
              Full approval queue ({pendingLeaves.length}) <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <SkeletonLoader type="card" count={2} />
          ) : pendingLeaves.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-[rgba(64,61,57,0.14)] text-center text-[#756f67]">
              <Check size={28} className="mx-auto mb-2 text-emerald-600 opacity-60" />
              <p className="text-xs font-bold text-[#252422] m-0">All caught up!</p>
              <span className="text-[11px] block mt-1">There are no pending leave requests from your child right now.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-sm font-bold text-[#252422] block">{leave.type} Leave</strong>
                      <span className="text-xs text-[#756f67]">
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      </span>
                    </div>
                    <Badge variant="pending_parent" dot size="sm">
                      AWAITING PARENT
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.08)] text-xs space-y-1">
                    <p className="m-0 text-[#252422]">
                      <span className="text-[#756f67]">Destination:</span> <strong>{leave.place || "City"}</strong>
                    </p>
                    {leave.purpose && (
                      <p className="m-0 text-[#252422] italic">
                        <span className="text-[#756f67] not-italic">Purpose:</span> "{leave.purpose}"
                      </p>
                    )}
                    <p className="m-0 text-[#756f67] text-[11px]">
                      Student Contact: {leave.contactNumber || "—"}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={actionId === leave.id}
                      onClick={() => setRejectModalLeave(leave)}
                      className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                    >
                      Reject...
                    </button>
                    <button
                      type="button"
                      disabled={actionId === leave.id}
                      onClick={() => handleApprove(leave.id)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>{actionId === leave.id ? "Approving..." : "Approve Leave"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Confirmation Modal */}
      <Modal
        isOpen={Boolean(rejectModalLeave)}
        onClose={() => setRejectModalLeave(null)}
        title="Reject Leave Request"
        description="Please provide an optional reason for your student."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectModalLeave(null)}
              className="px-4 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Confirm Rejection
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-[#756f67] m-0">
            Rejecting this request will mark the leave as REJECTED. It will not be sent to the faculty mentor.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Please postpone trip until semester exams conclude..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] transition-all"
          />
        </div>
      </Modal>
    </ParentShell>
  );
}
