import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import StatusCard from "../../../components/StatusCard";
import Badge from "../../../components/Badge";
import Modal from "../../../components/Modal";
import QRDisplay from "../../../components/QRDisplay";
import SkeletonLoader from "../../../components/SkeletonLoader";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  QrCode,
  Calendar,
  AlertCircle,
  Plus,
  Utensils,
  ChevronRight,
  Shield,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
} from "../../../components/Icons";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeLeave, setActiveLeave] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [activeGrievances, setActiveGrievances] = useState([]);
  const [resolvedGrievances, setResolvedGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGatePassModal, setShowGatePassModal] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("kstop_user")) || {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const results = await Promise.allSettled([
          api.get("/leave/active-qr"),
          api.get("/leave/my-leaves"),
          api.get("/grievance/my-grievances", { params: { view: "active" } }),
          api.get("/grievance/my-grievances", { params: { view: "history" } }),
        ]);

        if (cancelled) return;

        const [activeQrRes, leaveListRes, grievanceListRes, grievanceHistoryRes] = results;

        if (activeQrRes.status === "fulfilled") {
          setActiveLeave(activeQrRes.value.data.activeLeave || null);
        }
        if (leaveListRes.status === "fulfilled") {
          setLeaves(leaveListRes.value.data.leaves || []);
        }
        if (grievanceListRes.status === "fulfilled") {
          setActiveGrievances(grievanceListRes.value.data.grievances || []);
        }
        if (grievanceHistoryRes.status === "fulfilled") {
          setResolvedGrievances(grievanceHistoryRes.value.data.grievances || []);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingLeaves = leaves.filter((leave) =>
    ["PENDING_PARENT", "PENDING_MENTOR"].includes(leave.status)
  );

  function getLeaveStatusBadge(status) {
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
      title="Student Command Center"
      actionButton={
        <Link
          to="/dashboard/student/new-leave"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm"
        >
          <Plus size={15} /> Apply for Leave
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Welcome & Identity Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#252422] via-[#33302b] to-[#403d39] text-[#fffcf2] p-6 sm:p-8 shadow-xl border border-white/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#eb5e28] flex items-center gap-1.5">
                <Shield size={14} /> KIIT Student Portal
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">
                Welcome back, {user?.name ? user.name.split(" ")[0] : "Student"}.
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl m-0 leading-relaxed">
                Track your active gate passes, leave request approvals, mess menus, and hostel maintenance in real time.
              </p>

              {/* Strip */}
              <div className="flex flex-wrap gap-4 pt-3 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                  <span className="text-white/50 text-[10px] uppercase font-bold block">Roll Number</span>
                  <strong className="text-white font-mono">{user?.rollNumber || "—"}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                  <span className="text-white/50 text-[10px] uppercase font-bold block">Assigned Hostel</span>
                  <strong className="text-white">{user?.hostelName || "Campus Hostel"}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                  <span className="text-white/50 text-[10px] uppercase font-bold block">Faculty Mentor</span>
                  <strong className="text-white">
                    {user?.mentorName || leaves.find((l) => l.mentor?.name)?.mentor?.name || "Assigned Mentor"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
              <Link
                to="/dashboard/student/new-leave"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-md"
              >
                <Plus size={16} /> Apply for Leave
              </Link>
              <Link
                to="/dashboard/student/new-grievance"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15"
              >
                <AlertCircle size={15} /> Raise Grievance
              </Link>
              <Link
                to="/dashboard/student/mess-menu"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15"
              >
                <Utensils size={15} /> View Mess Menu
              </Link>
            </div>
          </div>

          {/* Ambient graphic */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none select-none text-[220px] font-black leading-none">
            K
          </div>
        </div>

        {/* Active QR Gate Pass Banner (When an approved pass is active) */}
        {activeLeave && (
          <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-[#eb5e28] shadow-md p-5 sm:p-6 transition-all hover:shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#eb5e28]/10 text-[#eb5e28] flex items-center justify-center flex-shrink-0">
                  <QrCode size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                      Active Security Gate Pass
                    </span>
                    <Badge variant="approved" dot size="sm">
                      VALID FOR EXIT
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-[#252422] m-0">
                    {activeLeave.type} Leave Gate Pass Ready
                  </h3>
                  <p className="text-xs text-[#756f67] m-0 mt-1">
                    Valid from <strong>{formatDate(activeLeave.startDate)}</strong> to{" "}
                    <strong>{formatDate(activeLeave.endDate)}</strong> · Destination:{" "}
                    <strong>{activeLeave.place || "City"}</strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGatePassModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#252422] hover:bg-[#eb5e28] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer justify-center"
                >
                  <QrCode size={15} /> View Gate Pass QR
                </button>
                <Link
                  to="/dashboard/student/gate-pass"
                  className="px-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white hover:bg-[#fbfaf6] text-[#252422] text-xs font-bold transition-all flex items-center gap-1.5 justify-center"
                >
                  Digital Boarding Pass
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            eyebrow="Active Gate Pass"
            value={activeLeave ? "ACTIVE" : "NONE"}
            subtext={
              activeLeave
                ? `Valid until ${formatDate(activeLeave.endDate)}`
                : "No approved exit pass right now"
            }
            icon={QrCode}
            isActionable={Boolean(activeLeave)}
            onClick={activeLeave ? () => setShowGatePassModal(true) : undefined}
          />

          <StatusCard
            eyebrow="Leave Requests"
            value={loading ? "—" : leaves.length}
            subtext={`${pendingLeaves.length} currently awaiting review`}
            icon={Calendar}
            onClick={() => navigate("/dashboard/student/leaves")}
          />

          <StatusCard
            eyebrow="Maintenance Grievances"
            value={loading ? "—" : activeGrievances.length}
            subtext={`${resolvedGrievances.length} resolved records in history`}
            icon={AlertCircle}
            isUrgent={activeGrievances.length > 2}
            onClick={() => navigate("/dashboard/student/grievances")}
          />

          <StatusCard
            eyebrow="Attendance Metric"
            value={user?.attendancePercentage != null ? `${user.attendancePercentage}%` : "Tracked"}
            subtext="Calculated attendance from institutional record"
            icon={GraduationCap}
          />
        </div>

        {/* Two-Column Operation Pulse */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaves Timeline */}
          <div className="rounded-2xl border border-[rgba(64,61,57,0.14)] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[rgba(64,61,57,0.08)] mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67] block">
                  Application Log
                </span>
                <h3 className="text-base font-bold text-[#252422] m-0">Recent Leaves</h3>
              </div>
              <Link
                to="/dashboard/student/leaves"
                className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1 transition-colors"
              >
                View all ({leaves.length}) <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <SkeletonLoader type="card" count={2} />
            ) : leaves.length === 0 ? (
              <div className="text-center py-8 text-[#756f67]">
                <Clock size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold m-0">No leave requests submitted yet.</p>
                <Link
                  to="/dashboard/student/new-leave"
                  className="mt-3 inline-block text-xs font-bold text-[#eb5e28] hover:underline"
                >
                  Apply for your first leave
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.slice(0, 3).map((leave) => (
                  <div
                    key={leave.id}
                    className="p-3.5 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <strong className="text-xs font-bold text-[#252422] block">
                        {leave.type} Leave
                      </strong>
                      <span className="text-[11px] text-[#756f67] block mt-0.5">
                        {formatDate(leave.startDate)} → {formatDate(leave.endDate)} · {leave.place || "City"}
                      </span>
                    </div>
                    <div>{getLeaveStatusBadge(leave.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grievances Pulse */}
          <div className="rounded-2xl border border-[rgba(64,61,57,0.14)] bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[rgba(64,61,57,0.08)] mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67] block">
                  Issue Monitor
                </span>
                <h3 className="text-base font-bold text-[#252422] m-0">Grievance Pulse</h3>
              </div>
              <Link
                to="/dashboard/student/grievances"
                className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1 transition-colors"
              >
                Manage ({activeGrievances.length}) <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <SkeletonLoader type="card" count={2} />
            ) : activeGrievances.length === 0 ? (
              <div className="text-center py-8 text-[#756f67]">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-600 opacity-60" />
                <p className="text-xs font-semibold m-0">No active grievances.</p>
                <span className="text-[11px] text-[#756f67]">Everything is running smoothly!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGrievances.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <strong className="text-xs font-bold text-[#252422] block truncate">
                        {item.title}
                      </strong>
                      <span className="text-[11px] text-[#756f67] block mt-0.5">
                        {item.category} · Priority Score: {item.priorityScore ?? "—"}/100
                      </span>
                    </div>
                    <Badge variant={item.resolutionStatus === "RESOLVED" ? "approved" : "pending"} size="sm">
                      {item.resolutionStatus || "In Progress"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gate Pass Modal */}
      <Modal
        isOpen={showGatePassModal}
        onClose={() => setShowGatePassModal(false)}
        title="Official Campus Gate Pass"
        size="lg"
      >
        {activeLeave && (
          <QRDisplay
            qrCode={activeLeave.qrCode}
            leaveData={{
              ...activeLeave,
              studentName: user?.name,
              rollNumber: user?.rollNumber,
            }}
          />
        )}
      </Modal>
    </StudentShell>
  );
}
