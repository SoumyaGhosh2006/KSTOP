import React, { useEffect, useState } from "react";
import MentorShell from "../../../components/mentor/MentorShell";
import Badge from "../../../components/Badge";
import Modal from "../../../components/Modal";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import Toast from "../../../components/Toast";
import QRDisplay from "../../../components/QRDisplay";
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
  ChevronDown,
  ChevronUp,
  GraduationCap,
  QrCode,
} from "../../../components/Icons";

export default function LeaveQueue() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [rejectingLeave, setRejectingLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [approvedPassLeave, setApprovedPassLeave] = useState(null);

  async function loadQueue() {
    try {
      setError("");
      const res = await api.get("/mentor/leave-queue");
      setLeaves(res.data.leaves || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load mentor leave queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleApprove(id) {
    setActionId(id);
    setError("");
    setMessage("");

    try {
      const res = await api.patch(`/mentor/leave/${id}/approve`);
      setMessage("Leave approved! Cryptographic QR Gate Pass token has been generated.");
      if (res.data?.leave?.qrCode) {
        setApprovedPassLeave(res.data.leave);
      }
      await loadQueue();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve leave request.");
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
      await api.patch(`/mentor/leave/${rejectingLeave.id}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      setMessage("Leave request rejected with faculty feedback.");
      setRejectingLeave(null);
      setRejectReason("");
      await loadQueue();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject leave.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <MentorShell
      title="Leave Approval Queue"
      subtitle="Final Gate Pass Authorization"
      backTo="/dashboard/mentor"
    >
      <div className="space-y-6">
        {message && <Toast type="success" message={message} onClose={() => setMessage("")} />}
        {error && <Toast type="error" message={error} onClose={() => setError("")} />}

        <div className="flex items-center justify-between">
          <p className="text-xs text-[#756f67] m-0">
            Requests below have already received <strong className="text-[#252422]">Parent Endorsement</strong>. Approval immediately generates the student's security QR gate pass.
          </p>
          <span className="text-xs font-mono font-bold text-[#eb5e28] px-2.5 py-1 rounded-lg bg-[#eb5e28]/10 border border-[#eb5e28]/20">
            {leaves.length} Pending Decision
          </span>
        </div>

        {loading ? (
          <SkeletonLoader type="card" count={2} />
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={Check}
            title="Leave Queue is Empty"
            description="There are currently no leaves awaiting faculty endorsement. Once parents approve pending applications, they will appear here in order of medical and attendance urgency."
          />
        ) : (
          <div className="space-y-4">
            {leaves.map((leave) => {
              const isBusy = actionId === leave.id;
              const isExpanded = expandedId === leave.id;
              const attendance = leave.student?.attendancePercentage;
              const isLowAttendance = typeof attendance === "number" && attendance < 75;
              const isMedical = leave.type === "Medical";
              const isUrgent = isMedical || isLowAttendance;

              return (
                <div
                  key={leave.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-7 shadow-sm space-y-4 transition-all hover:shadow-md ${
                    isUrgent ? "border-amber-300 bg-amber-50/15" : "border-[rgba(64,61,57,0.16)]"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(64,61,57,0.08)]">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isUrgent ? "bg-amber-100 text-amber-800" : "bg-[#eb5e28]/10 text-[#eb5e28]"
                        }`}
                      >
                        {leave.type?.[0] || "L"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#252422] m-0">
                            {leave.student?.name || "Student"}
                          </h4>
                          <span className="text-xs font-mono text-[#756f67]">
                            ({leave.student?.rollNumber || "Roll"})
                          </span>
                        </div>
                        <span className="text-xs text-[#756f67] block mt-0.5">
                          {leave.type} Leave · Applied on {formatDate(leave.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="approved" dot size="sm">
                        PARENT ENDORSED ✓
                      </Badge>
                      {isMedical && (
                        <Badge variant="urgent" size="sm">
                          MEDICAL
                        </Badge>
                      )}
                      {isLowAttendance && (
                        <Badge variant="urgent" size="sm">
                          LOW ATTENDANCE ({attendance}%)
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Core Details Grid */}
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
                        <MapPin size={12} /> Destination Place
                      </span>
                      <strong className="text-[#252422] text-xs font-semibold block mt-1">
                        {leave.place || "—"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block flex items-center gap-1">
                        <Phone size={12} /> Student Contact
                      </span>
                      <strong className="text-[#252422] text-xs font-mono block mt-1">
                        {leave.contactNumber || "—"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block flex items-center gap-1">
                        <GraduationCap size={12} /> Attendance
                      </span>
                      <strong
                        className={`text-xs block mt-1 ${
                          isLowAttendance ? "text-rose-600 font-extrabold" : "text-[#252422]"
                        }`}
                      >
                        {typeof attendance === "number" ? `${attendance}%` : "Not recorded"}
                      </strong>
                    </div>
                  </div>

                  {/* Purpose */}
                  {leave.purpose && (
                    <div className="text-xs">
                      <span className="font-bold text-[#756f67] text-[10px] uppercase block mb-1">
                        Declared Purpose:
                      </span>
                      <p className="text-xs text-[#252422] m-0 italic bg-white p-3 rounded-xl border border-[rgba(64,61,57,0.1)] leading-relaxed">
                        "{leave.purpose}"
                      </p>
                    </div>
                  )}

                  {/* Expandable Academic & Leave History Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(leave.id)}
                      className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      <span>{isExpanded ? "Hide Academic Details & Recent History" : "View Academic Details & Leave History"}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.1)] space-y-3 text-xs animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-[rgba(64,61,57,0.08)]">
                          <div>
                            <span className="text-[10px] font-bold text-[#756f67] uppercase">Academic Performance / Notes</span>
                            <p className="m-0 mt-0.5 text-[#252422]">
                              {leave.student?.academicDetails || "No remarks on institutional record."}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#756f67] uppercase">Attendance Overview</span>
                            <p className="m-0 mt-0.5 text-[#252422]">
                              Current calculated rate: <strong>{attendance != null ? `${attendance}%` : "—"}</strong>
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-[#756f67] uppercase block mb-2">
                            Last 5 Leave Requests by this Student:
                          </span>
                          {leave.student?.recentLeaves?.length > 0 ? (
                            <div className="space-y-1.5">
                              {leave.student.recentLeaves.map((rl) => (
                                <div
                                  key={rl.id}
                                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white border border-[rgba(64,61,57,0.08)]"
                                >
                                  <span>
                                    <strong>{rl.type}</strong> ({formatDate(rl.startDate)} → {formatDate(rl.endDate)})
                                  </span>
                                  <Badge
                                    variant={
                                      rl.status === "APPROVED"
                                        ? "approved"
                                        : rl.status === "REJECTED"
                                        ? "rejected"
                                        : "pending"
                                    }
                                    size="sm"
                                  >
                                    {rl.status?.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#756f67] italic">No prior leaves recorded.</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[rgba(64,61,57,0.08)] flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-[11px] text-[#756f67]">
                      Final approval issues signed QR gate pass valid for hostel security scanners.
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setRejectingLeave(leave)}
                        className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Reject with Feedback...
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprove(leave.id)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check size={14} />
                        <span>{isBusy ? "Issuing QR Pass..." : "Approve & Generate QR Pass"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={Boolean(rejectingLeave)}
        onClose={() => setRejectingLeave(null)}
        title="Reject Leave Application"
        description="Provide academic or disciplinary feedback for the student."
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
            A notification with this reason will be dispatched to both the student and their parent.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Leave denied due to attendance below 75% prior to midterm examination."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] transition-all"
          />
        </div>
      </Modal>

      {/* Generated QR Pass Preview Dialog */}
      <Modal
        isOpen={Boolean(approvedPassLeave)}
        onClose={() => setApprovedPassLeave(null)}
        title="QR Gate Pass Generated"
        size="lg"
      >
        {approvedPassLeave && (
          <div className="space-y-4">
            <Toast
              type="success"
              message="Leave approved! The cryptographic QR token was generated and student notified."
            />
            <QRDisplay qrCode={approvedPassLeave.qrCode} leaveData={approvedPassLeave} />
          </div>
        )}
      </Modal>
    </MentorShell>
  );
}