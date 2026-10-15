import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MentorShell from "../../../components/mentor/MentorShell";
import StatusCard from "../../../components/StatusCard";
import Badge from "../../../components/Badge";
import SkeletonLoader from "../../../components/SkeletonLoader";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  Users,
  Clock,
  AlertCircle,
  MessageSquare,
  Shield,
  Building,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Send,
} from "../../../components/Icons";

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState([]);
  const [leaveQueue, setLeaveQueue] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [messages, setMessages] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("kstop_user")) || {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [menteesRes, queueRes, grievancesRes, messagesRes, notifRes] = await Promise.allSettled([
          api.get("/mentor/mentees"),
          api.get("/mentor/leave-queue"),
          api.get("/mentor/grievances"),
          api.get("/mentor/messages"),
          api.get("/mentor/notifications"),
        ]);

        if (menteesRes.status === "fulfilled") setMentees(menteesRes.value.data.mentees || []);
        if (queueRes.status === "fulfilled") setLeaveQueue(queueRes.value.data.leaves || []);
        if (grievancesRes.status === "fulfilled") setGrievances(grievancesRes.value.data.grievances || []);
        if (messagesRes.status === "fulfilled") setMessages(messagesRes.value.data.messages || []);
        if (notifRes.status === "fulfilled") setUnreadNotifs(notifRes.value.data.unreadCount || 0);
      } catch (err) {
        console.error("Mentor dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const urgentLeaves = leaveQueue.filter((leave) => {
    const attendance = leave.student?.attendancePercentage;
    return leave.type === "Medical" || (typeof attendance === "number" && attendance < 75);
  });

  const disputedGrievances = grievances.filter((g) => g.studentStatus === "DISPUTED");
  const hostelsCount = new Set(mentees.map((m) => m.hostel?.name).filter(Boolean)).size;

  return (
    <MentorShell title="Faculty Command Center" subtitle="Academic Mentorship">
      <div className="space-y-6">
        {/* Mentor Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#252422] via-[#33302b] to-[#403d39] text-[#fffcf2] p-6 sm:p-8 shadow-xl border border-white/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#eb5e28] flex items-center gap-1.5">
                <Shield size={14} /> KIIT Mentorship Console
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white m-0">
                Welcome, Prof. {user?.name || "Mentor"}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl m-0 leading-relaxed">
                Review parent-approved leave requests, oversee mentee academic health, track maintenance grievances, and communicate with families.
              </p>

              {/* Stats strip */}
              <div className="flex flex-wrap gap-4 pt-3 text-xs">
                <div className="px-3.5 py-1.5 rounded-lg bg-white/10 border border-white/10">
                  <span className="text-white/50 text-[10px] uppercase font-bold block">Assigned Mentees</span>
                  <strong className="text-white font-mono text-sm">{mentees.length} Students</strong>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-white/10 border border-white/10">
                  <span className="text-white/50 text-[10px] uppercase font-bold block">Hostels Represented</span>
                  <strong className="text-white font-mono text-sm">{hostelsCount} Hostels</strong>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
              <Link
                to="/dashboard/mentor/leave-queue"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-md"
              >
                <Clock size={16} /> Open Leave Queue ({leaveQueue.length})
              </Link>
              <Link
                to="/dashboard/mentor/messages"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15"
              >
                <MessageSquare size={15} /> Parent Inbox ({messages.length})
              </Link>
              <Link
                to="/dashboard/mentor/announcements"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15"
              >
                <Send size={15} /> Cohort Broadcast
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            eyebrow="Leave Approval Queue"
            value={loading ? "—" : leaveQueue.length}
            subtext={`${urgentLeaves.length} urgent / medical leaves`}
            icon={Clock}
            isUrgent={urgentLeaves.length > 0}
            onClick={() => navigate("/dashboard/mentor/leave-queue")}
          />

          <StatusCard
            eyebrow="Mentees Roster"
            value={loading ? "—" : mentees.length}
            subtext="Enrolled students assigned to you"
            icon={Users}
            onClick={() => navigate("/dashboard/mentor/mentees")}
          />

          <StatusCard
            eyebrow="Grievances Log"
            value={loading ? "—" : grievances.length}
            subtext={`${disputedGrievances.length} currently disputed`}
            icon={AlertCircle}
            isActionable={disputedGrievances.length > 0}
            onClick={() => navigate("/dashboard/mentor/grievances")}
          />

          <StatusCard
            eyebrow="Parent Inquiries"
            value={loading ? "—" : messages.length}
            subtext="Live message communications"
            icon={MessageSquare}
            onClick={() => navigate("/dashboard/mentor/messages")}
          />
        </div>

        {/* Operational Split Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leave Queue Preview */}
          <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                  Decision Queue
                </span>
                <h3 className="text-base font-bold text-[#252422] m-0">Leave Endorsements Waiting</h3>
              </div>
              <Link
                to="/dashboard/mentor/leave-queue"
                className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1"
              >
                Review All ({leaveQueue.length}) <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <SkeletonLoader type="card" count={2} />
            ) : leaveQueue.length === 0 ? (
              <div className="text-center py-8 text-[#756f67]">
                <Clock size={28} className="mx-auto mb-2 text-emerald-600 opacity-60" />
                <p className="text-xs font-semibold m-0">All leave requests processed.</p>
                <span className="text-[11px] block mt-1">Leaves endorsed by parents will appear here immediately.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {leaveQueue.slice(0, 3).map((leave) => {
                  const attendance = leave.student?.attendancePercentage;
                  const isUrgent = leave.type === "Medical" || (typeof attendance === "number" && attendance < 75);

                  return (
                    <div
                      key={leave.id}
                      onClick={() => navigate("/dashboard/mentor/leave-queue")}
                      className="p-3.5 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-[#252422]">
                            {leave.student?.name || "Student"}
                          </strong>
                          <span className="text-[10px] font-mono text-[#756f67]">
                            ({leave.student?.rollNumber || "Roll"})
                          </span>
                        </div>
                        <span className="text-[11px] text-[#756f67] block mt-0.5">
                          {leave.type} Leave · {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUrgent && <Badge variant="urgent" size="sm">URGENT</Badge>}
                        <Badge variant="pending" size="sm">NEEDS APPROVAL</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grievances Pulse */}
          <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67]">
                  Mentee Welfare
                </span>
                <h3 className="text-base font-bold text-[#252422] m-0">Grievance Activity</h3>
              </div>
              <Link
                to="/dashboard/mentor/grievances"
                className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1"
              >
                Track All ({grievances.length}) <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <SkeletonLoader type="card" count={2} />
            ) : grievances.length === 0 ? (
              <div className="text-center py-8 text-[#756f67]">
                <Shield size={28} className="mx-auto mb-2 text-emerald-600 opacity-60" />
                <p className="text-xs font-semibold m-0">No open mentee complaints.</p>
                <span className="text-[11px] block mt-1">Maintenance tickets from your mentees are clear.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {grievances.slice(0, 3).map((g) => (
                  <div
                    key={g.id}
                    onClick={() => navigate("/dashboard/mentor/grievances")}
                    className="p-3.5 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div>
                      <strong className="text-xs font-bold text-[#252422] block truncate">
                        {g.title}
                      </strong>
                      <span className="text-[11px] text-[#756f67] block mt-0.5">
                        {g.student?.name || "Mentee"} · {g.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/5 text-[#403d39]">
                        Priority {g.priorityScore ?? "—"}
                      </span>
                      <Badge variant={g.studentStatus === "DISPUTED" ? "clashed" : "progress"} size="sm">
                        {g.studentStatus === "DISPUTED" ? "Disputed" : g.resolutionStatus || "Active"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MentorShell>
  );
}
