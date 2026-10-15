import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HostelShell from "../../../components/hostel/HostelShell";
import StatusCard from "../../../components/StatusCard";
import Badge from "../../../components/Badge";
import Modal from "../../../components/Modal";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import Toast from "../../../components/Toast";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  QrCode,
  FileText,
  Upload,
  Star,
  AlertCircle,
  Utensils,
  CheckCircle2,
  Building,
  Shield,
  Clock,
  ArrowRight,
  ZoomIn,
  RefreshCw,
  ChevronRight,
  User,
} from "../../../components/Icons";

export default function HostelDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    leaveCount: 0,
    openGrievances: 0,
    latestMenu: null,
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [activeGrievances, setActiveGrievances] = useState([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [toast, setToast] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("kstop_user")) || {};
    } catch {
      return {};
    }
  })();

  const hostelName =
    user?.assignedHostelName ||
    user?.hostelName ||
    user?.name ||
    "Campus Hostel";

  async function loadDashboard() {
    setLoading(true);
    try {
      const [sumRes, recRes, griRes] = await Promise.allSettled([
        api.get("/hostel/summary"),
        api.get("/hostel/leave-records"),
        api.get("/hostel/grievances", { params: { view: "active" } }),
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value.data) {
        setSummary({
          leaveCount: sumRes.value.data.leaveCount ?? 0,
          openGrievances: sumRes.value.data.openGrievances ?? 0,
          latestMenu: sumRes.value.data.latestMenu ?? null,
        });
      }

      if (recRes.status === "fulfilled" && recRes.value.data?.records) {
        setRecentRecords(recRes.value.data.records.slice(0, 4));
      }

      if (griRes.status === "fulfilled" && griRes.value.data?.grievances) {
        setActiveGrievances(griRes.value.data.grievances.slice(0, 3));
      }
    } catch (err) {
      console.error("Hostel dashboard fetch error:", err);
      setToast({
        type: "error",
        message: "Could not synchronize some hostel dashboard data.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <HostelShell
      title="Hostel Command Surface"
      eyebrow={`${hostelName} · Operations Console`}
      actionButton={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboard}
            className="p-2 rounded-xl border border-[rgba(64,61,57,0.15)] bg-white hover:bg-[#f5f0e5] text-[#252422] transition-colors cursor-pointer"
            title="Refresh Dashboard"
            aria-label="Refresh Dashboard"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            to="/dashboard/hostel/scan-qr"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm"
          >
            <QrCode size={15} /> Gate Scanner
          </Link>
        </div>
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

        {/* Hero Command Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#252422] via-[#33302b] to-[#403d39] text-[#fffcf2] p-6 sm:p-8 shadow-xl border border-white/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#eb5e28] flex items-center gap-1.5">
                <Building size={14} /> KIIT Residence Authority & Gate Control
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">
                Welcome, {user?.name || "Hostel Warden"}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl m-0 leading-relaxed">
                Execute live gate security checks, scan digital gate passes, maintain resident exit history, publish daily dining menus, and resolve facility grievances for {hostelName}.
              </p>

              {/* Status pills */}
              <div className="flex flex-wrap gap-3 pt-3 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                  <span className="text-white/50 text-[10px] uppercase font-bold block">Assigned Hostel</span>
                  <strong className="text-white font-mono">{hostelName}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
                  <span className="text-white/50 text-[10px] uppercase font-bold block">Account Role</span>
                  <strong className="text-white">Warden / Staff Console</strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-200 text-xs font-bold">Gate Guard Online</span>
                </div>
              </div>
            </div>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
              <Link
                to="/dashboard/hostel/scan-qr"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-md"
              >
                <QrCode size={16} /> Open QR Gate Scanner
              </Link>
              <Link
                to="/dashboard/hostel/leave-records"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15"
              >
                <FileText size={15} /> Leave Records Ledger ({summary.leaveCount})
              </Link>
              <Link
                to="/dashboard/hostel/mess-menu"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15"
              >
                <Upload size={15} /> Upload Mess Menu
              </Link>
            </div>
          </div>

          {/* Decorative ambient watermark */}
          <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-5 pointer-events-none select-none text-[200px] font-black leading-none">
            H
          </div>
        </div>

        {/* Metric Cards KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            eyebrow="Gate Security Scanner"
            value="ACTIVE"
            subtext="Camera & manual code verification"
            icon={QrCode}
            isActionable
            onClick={() => navigate("/dashboard/hostel/scan-qr")}
          />

          <StatusCard
            eyebrow="Recorded Leave Passes"
            value={loading ? "—" : summary.leaveCount}
            subtext="Verified student departures & logs"
            icon={FileText}
            onClick={() => navigate("/dashboard/hostel/leave-records")}
          />

          <StatusCard
            eyebrow="Facility Grievances"
            value={loading ? "—" : summary.openGrievances}
            subtext={
              summary.openGrievances > 0
                ? `${summary.openGrievances} tickets require warden review`
                : "No active maintenance tickets"
            }
            icon={AlertCircle}
            isUrgent={summary.openGrievances > 0}
            onClick={() => navigate("/dashboard/hostel/grievances")}
          />

          <StatusCard
            eyebrow="Hostel Mess Menu"
            value={loading ? "—" : summary.latestMenu ? "READY" : "NONE"}
            subtext={
              summary.latestMenu
                ? `Published ${new Date(summary.latestMenu.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}`
                : "No menu currently uploaded"
            }
            icon={Utensils}
            isActionable={!summary.latestMenu}
            onClick={() => navigate("/dashboard/hostel/mess-menu")}
          />
        </div>

        {/* Operational Split Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Quick Operations & Recent Scans (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick Operations Map */}
            <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)] mb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                    Workflow Hub
                  </span>
                  <h3 className="text-base font-bold text-[#252422] m-0">Operations Directory</h3>
                </div>
                <span className="text-xs text-[#756f67]">Hostel Duty Desk</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/dashboard/hostel/scan-qr"
                  className="group p-4 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:border-[#eb5e28] hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-[#eb5e28]/10 text-[#eb5e28] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <QrCode size={18} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#756f67]">01</span>
                  </div>
                  <div className="mt-3">
                    <strong className="text-xs font-bold text-[#252422] group-hover:text-[#eb5e28] transition-colors block">
                      Gate QR Scanner
                    </strong>
                    <p className="text-[11px] text-[#756f67] m-0 mt-0.5 leading-snug">
                      Scan approved gate passes with live camera or enter pass token.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/dashboard/hostel/leave-records"
                  className="group p-4 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:border-[#eb5e28] hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileText size={18} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#756f67]">02</span>
                  </div>
                  <div className="mt-3">
                    <strong className="text-xs font-bold text-[#252422] group-hover:text-[#eb5e28] transition-colors block">
                      Leave Records Ledger
                    </strong>
                    <p className="text-[11px] text-[#756f67] m-0 mt-0.5 leading-snug">
                      Inspect logged student exits, manual entries, and bulk manage rows.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/dashboard/hostel/mess-menu"
                  className="group p-4 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:border-[#eb5e28] hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload size={18} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#756f67]">03</span>
                  </div>
                  <div className="mt-3">
                    <strong className="text-xs font-bold text-[#252422] group-hover:text-[#eb5e28] transition-colors block">
                      Publish Mess Menu
                    </strong>
                    <p className="text-[11px] text-[#756f67] m-0 mt-0.5 leading-snug">
                      Upload dining schedules for breakfast, lunch, snacks, and dinner.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/dashboard/hostel/grievances"
                  className="group p-4 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:border-[#eb5e28] hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <AlertCircle size={18} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#756f67]">04</span>
                  </div>
                  <div className="mt-3">
                    <strong className="text-xs font-bold text-[#252422] group-hover:text-[#eb5e28] transition-colors block">
                      Hostel Grievances
                    </strong>
                    <p className="text-[11px] text-[#756f67] m-0 mt-0.5 leading-snug">
                      Resolve maintenance tickets, check clashes, and update status.
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Scans / Exit Log */}
            <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)] mb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67]">
                    Gate Log Activity
                  </span>
                  <h3 className="text-base font-bold text-[#252422] m-0">Recent Scanned Exits</h3>
                </div>
                <Link
                  to="/dashboard/hostel/leave-records"
                  className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1"
                >
                  View All ({summary.leaveCount}) <ChevronRight size={14} />
                </Link>
              </div>

              {loading ? (
                <SkeletonLoader type="card" count={3} />
              ) : recentRecords.length === 0 ? (
                <div className="text-center py-8 text-[#756f67]">
                  <Clock size={28} className="mx-auto mb-2 opacity-40 text-[#756f67]" />
                  <p className="text-xs font-semibold m-0">No leave records registered yet.</p>
                  <span className="text-[11px] block mt-1">
                    When students scan their QR at the gate, their passes will appear here immediately.
                  </span>
                  <Link
                    to="/dashboard/hostel/scan-qr"
                    className="inline-block mt-3 text-xs font-bold text-[#eb5e28] hover:underline"
                  >
                    Scan first gate pass →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-3.5 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-[#252422] truncate">
                            {record.studentName}
                          </strong>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 text-[#403d39]">
                            {record.rollNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#756f67] block mt-0.5">
                          {formatDate(record.leaveStartDate)} → {formatDate(record.leaveEndDate)}
                          {record.mentorName ? ` · Mentor: ${record.mentorName}` : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={record.source === "qr" ? "brand" : "neutral"}
                          size="sm"
                        >
                          {record.source === "qr" ? "QR Scanned" : "Manual"}
                        </Badge>
                        <Badge
                          variant={record.approved ? "approved" : "rejected"}
                          size="sm"
                          dot
                        >
                          {record.approved ? "Approved" : "Unapproved"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Menu Showcase & Grievance Pulse (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Current Mess Menu Card */}
            <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                    Food & Dining
                  </span>
                  <h3 className="text-base font-bold text-[#252422] m-0">Active Mess Menu</h3>
                </div>
                <Link
                  to="/dashboard/hostel/mess-menu"
                  className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1"
                >
                  Manage <ChevronRight size={14} />
                </Link>
              </div>

              {loading ? (
                <SkeletonLoader type="card" count={1} />
              ) : summary.latestMenu ? (
                <div className="space-y-3">
                  <div
                    onClick={() => setShowMenuModal(true)}
                    className="relative group rounded-xl overflow-hidden border border-[rgba(64,61,57,0.15)] bg-black/5 aspect-video cursor-pointer"
                  >
                    <img
                      src={summary.latestMenu.imageUrl}
                      alt="Hostel mess menu preview"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[#252422]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs backdrop-blur-xs">
                      <ZoomIn size={18} /> Click to Expand Menu
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-1 rounded-md bg-[#252422]/80 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                        Current
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#756f67] pt-1">
                    <span>
                      Uploaded:{" "}
                      <strong>
                        {new Date(summary.latestMenu.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </strong>
                    </span>
                    <Link
                      to="/dashboard/hostel/mess-menu"
                      className="text-[#eb5e28] font-bold hover:underline"
                    >
                      Replace Image
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Utensils}
                  title="No menu active"
                  description="Upload today's mess menu so hostel residents can view daily meals and submit meal ratings."
                  actionLabel="Upload Menu Now"
                  onAction={() => navigate("/dashboard/hostel/mess-menu")}
                />
              )}
            </div>

            {/* Grievance Attention Queue */}
            <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67]">
                    Maintenance Tickets
                  </span>
                  <h3 className="text-base font-bold text-[#252422] m-0">Open Complaints</h3>
                </div>
                <Link
                  to="/dashboard/hostel/grievances"
                  className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1"
                >
                  Manage ({summary.openGrievances}) <ChevronRight size={14} />
                </Link>
              </div>

              {loading ? (
                <SkeletonLoader type="card" count={2} />
              ) : activeGrievances.length === 0 ? (
                <div className="text-center py-6 text-[#756f67]">
                  <CheckCircle2 size={26} className="mx-auto mb-1.5 text-emerald-600 opacity-60" />
                  <p className="text-xs font-semibold m-0">Facility tickets clear.</p>
                  <span className="text-[11px] block mt-0.5">
                    No open maintenance complaints for {hostelName}.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeGrievances.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate("/dashboard/hostel/grievances")}
                      className="p-3 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <strong className="text-xs font-bold text-[#252422] block truncate">
                          {item.title}
                        </strong>
                        <span className="text-[11px] text-[#756f67] block mt-0.5 truncate">
                          {item.student?.name || "Student"} ({item.student?.rollNumber || "Roll"}) · {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/5 text-[#403d39]">
                          P{item.priorityScore ?? "—"}
                        </span>
                        <Badge
                          variant={item.resolutionStatus === "CLASHED" ? "clashed" : "progress"}
                          size="sm"
                        >
                          {item.resolutionStatus === "CLASHED" ? "Clashed" : "Open"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Guard Protocol Tip Box */}
            <div className="rounded-2xl border border-[rgba(235,94,40,0.25)] bg-[rgba(235,94,40,0.04)] p-4 text-xs text-[#403d39] space-y-1.5">
              <strong className="text-[#eb5e28] flex items-center gap-1.5 font-bold">
                <Shield size={14} /> Gate Verification Notice
              </strong>
              <p className="m-0 leading-relaxed text-[11px] text-[#756f67]">
                Always cross-reference the student's physical institutional ID card with the live QR scan confirmation. The system automatically prevents duplicate scans for the same departure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Zoom Modal */}
      {summary.latestMenu && (
        <Modal
          isOpen={showMenuModal}
          onClose={() => setShowMenuModal(false)}
          title={`Mess Menu · ${hostelName}`}
          description={`Uploaded on ${new Date(summary.latestMenu.createdAt).toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`}
          size="lg"
        >
          <div className="rounded-xl overflow-hidden border border-[rgba(64,61,57,0.15)] bg-white max-h-[70vh] flex items-center justify-center p-2">
            <img
              src={summary.latestMenu.imageUrl}
              alt="Full size hostel mess menu"
              className="max-h-[65vh] w-auto object-contain rounded"
            />
          </div>
        </Modal>
      )}
    </HostelShell>
  );
}
