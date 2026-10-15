import React, { useEffect, useState } from "react";
import ParentShell from "../../../components/parent/ParentShell";
import Badge from "../../../components/Badge";
import Modal from "../../../components/Modal";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import Toast from "../../../components/Toast";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  Clock,
  Check,
  X,
  Calendar,
  MapPin,
  Phone,
  AlertCircle,
  Shield,
  FileText,
} from "../../../components/Icons";

export default function ParentPendingLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectingLeave, setRejectingLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadLeaves() {
    try {
      setError("");
      const res = await api.get("/parent/pending-leaves");
      setLeaves(res.data.leaves || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pending leaves.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaves();
  }, []);

  async function handleApprove(id) {
    setActionId(id);
    setError("");
    setMessage("");

    try {
      await api.patch(`/parent/leave/${id}/approve`);
      setMessage("Leave request approved successfully! It has been dispatched to the mentor.");
      await loadLeaves();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve request.");
    } finally {
      setActionId(null);
    }
  }

  async function handleConfirmReject() {
    if (!rejectingLeave) return;
    setActionId(rejectingLeave.id);
    setError("");
    setMessage("");

    try {
      await api.patch(`/parent/leave/${rejectingLeave.id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      setMessage("Leave request rejected.");
      setRejectingLeave(null);
      setRejectReason("");
      await loadLeaves();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject request.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <ParentShell
      title="Pending Approvals"
      eyebrow="Parent Authorization Required"
      backTo="/dashboard/parent"
    >
      <div className="space-y-6">
        {message && <Toast type="success" message={message} onClose={() => setMessage("")} />}
        {error && <Toast type="error" message={error} onClose={() => setError("")} />}

        <div className="flex items-center justify-between">
          <p className="text-xs text-[#756f67] m-0">
            Review your child's leave requests. Endorsement here routes the request to their Faculty Mentor.
          </p>
          <span className="text-xs font-mono font-bold text-[#eb5e28] px-2.5 py-1 rounded-lg bg-[#eb5e28]/10 border border-[#eb5e28]/20">
            {leaves.length} Pending
          </span>
        </div>

        {loading ? (
          <SkeletonLoader type="card" count={2} />
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={Check}
            title="All caught up! No pending leaves"
            description="Your child does not currently have any unapproved leave applications. You will be notified whenever a new request is filed."
          />
        ) : (
          <div className="space-y-4">
            {leaves.map((leave) => {
              const isBusy = actionId === leave.id;

              return (
                <div
                  key={leave.id}
                  className="bg-white rounded-2xl border border-[rgba(64,61,57,0.16)] p-5 sm:p-7 shadow-sm space-y-4 hover:shadow-md transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(64,61,57,0.08)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#eb5e28]/10 text-[#eb5e28] flex items-center justify-center font-bold text-sm">
                        {leave.type?.[0] || "L"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#252422] m-0">
                            {leave.type} Leave
                          </h4>
                          <span className="text-[10px] font-mono text-[#756f67]">
                            #{leave.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-[#756f67] block mt-0.5">
                          Submitted by {leave.student?.name || "Student"} ({leave.student?.rollNumber || "Roll"})
                        </span>
                      </div>
                    </div>

                    <Badge variant="pending_parent" dot size="sm">
                      NEEDS YOUR APPROVAL
                    </Badge>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.08)] text-xs">
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
                        <Phone size={12} /> Emergency Phone
                      </span>
                      <strong className="text-[#252422] text-xs font-mono block mt-1">
                        {leave.contactNumber || "—"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                        Assigned Mentor
                      </span>
                      <span className="text-[#252422] text-xs block mt-1">
                        {leave.mentor?.name || "Faculty Mentor"}
                      </span>
                    </div>
                  </div>

                  {/* Purpose */}
                  {leave.purpose && (
                    <div className="text-xs">
                      <span className="font-bold text-[#756f67] text-[10px] uppercase block mb-1">
                        Reason for Leave:
                      </span>
                      <p className="text-xs text-[#252422] m-0 italic bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 leading-relaxed">
                        "{leave.purpose}"
                      </p>
                    </div>
                  )}

                  {/* Arrival Details if present */}
                  {leave.arrivalDetails && (
                    <div className="text-xs text-[#756f67]">
                      <span className="font-bold uppercase text-[10px]">Arrival / Return Details:</span>{" "}
                      <span>{leave.arrivalDetails}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[rgba(64,61,57,0.08)] flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-[11px] text-[#756f67]">
                      Approving forwards this to faculty mentor for gate pass generation.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setRejectingLeave(leave)}
                        className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Reject...
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprove(leave.id)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check size={14} />
                        <span>{isBusy ? "Processing..." : "Approve Leave"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Confirmation Dialog */}
      <Modal
        isOpen={Boolean(rejectingLeave)}
        onClose={() => setRejectingLeave(null)}
        title="Reject Leave Application"
        description="Provide a brief explanation for your child."
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectingLeave(null)}
              className="px-4 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={Boolean(actionId)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {actionId ? "Rejecting..." : "Confirm Rejection"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-[#756f67] m-0">
            When you reject this request, the status becomes REJECTED and the student receives an instant notification.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Please stay on campus for the upcoming laboratory exams."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] transition-all"
          />
        </div>
      </Modal>
    </ParentShell>
  );
}