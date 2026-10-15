import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MentorShell from "../../../components/mentor/MentorShell";
import Badge from "../../../components/Badge";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  Users,
  Search,
  GraduationCap,
  Building,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "../../../components/Icons";

export default function MenteesList() {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadMentees() {
      try {
        const res = await api.get("/mentor/mentees");
        setMentees(res.data.mentees || []);
      } catch (err) {
        console.error("Failed to load mentees:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMentees();
  }, []);

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mentees;
    return mentees.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.rollNumber?.toLowerCase().includes(q) ||
        m.hostel?.name?.toLowerCase().includes(q)
    );
  }, [mentees, search]);

  return (
    <MentorShell
      title="Mentee Roster"
      subtitle="Assigned Students"
      backTo="/dashboard/mentor"
    >
      <div className="space-y-6">
        {/* Search & Counter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[rgba(64,61,57,0.14)] shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756f67]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, or hostel..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#756f67]">
            <span>Showing {filtered.length} of {mentees.length} assigned mentees</span>
          </div>
        </div>

        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "No students match your query" : "No mentees assigned"}
            description={
              search
                ? "Try searching with a different name or roll number."
                : "Students assigned to your mentorship cohort will appear here automatically."
            }
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((mentee) => {
              const isExpanded = expandedId === mentee.id;
              const attendance = mentee.attendancePercentage;
              const isLowAttendance = typeof attendance === "number" && attendance < 75;

              return (
                <div
                  key={mentee.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4 transition-all hover:shadow-md ${
                    isLowAttendance ? "border-amber-300" : "border-[rgba(64,61,57,0.14)]"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(64,61,57,0.08)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#eb5e28]/10 text-[#eb5e28] flex items-center justify-center font-bold text-sm">
                        {mentee.name?.[0] || "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#252422] m-0">{mentee.name}</h4>
                          <span className="text-xs font-mono text-[#756f67]">({mentee.rollNumber})</span>
                        </div>
                        <span className="text-xs text-[#756f67] block mt-0.5">
                          {mentee.hostel?.name || "Hostel not recorded"} · {mentee.gender || "Student"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLowAttendance ? (
                        <Badge variant="urgent" dot size="sm">
                          LOW ATTENDANCE ({attendance}%)
                        </Badge>
                      ) : attendance != null ? (
                        <Badge variant="approved" dot size="sm">
                          ATTENDANCE {attendance}%
                        </Badge>
                      ) : null}
                      <Link
                        to="/dashboard/mentor/messages"
                        state={{ studentId: mentee.id, studentName: mentee.name, rollNumber: mentee.rollNumber }}
                        className="px-3 py-1.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white hover:bg-black/5 text-[#252422] text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <MessageSquare size={13} /> Message Parent
                      </Link>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.08)] text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                        Institutional Attendance
                      </span>
                      <strong
                        className={`text-sm block mt-1 ${
                          isLowAttendance ? "text-rose-600 font-extrabold" : "text-[#252422]"
                        }`}
                      >
                        {attendance != null ? `${attendance}%` : "Not recorded"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                        Campus Leaves Record
                      </span>
                      <strong className="text-sm text-[#252422] block mt-1">
                        {mentee._count?.leavesAsStudent ?? 0} Total Requests
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                        Campus Hostel
                      </span>
                      <span className="text-xs text-[#252422] font-semibold block mt-1">
                        {mentee.hostel?.name || "Campus Residence"}
                      </span>
                    </div>
                  </div>

                  {/* Expand Academic & Leave History Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(mentee.id)}
                      className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      <span>{isExpanded ? "Hide Performance Profile" : "View Academic Profile & Recent History"}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.1)] space-y-3 text-xs animate-in fade-in duration-150">
                        <div className="pb-2 border-b border-[rgba(64,61,57,0.08)]">
                          <span className="text-[10px] font-bold text-[#756f67] uppercase">Academic Performance Notes</span>
                          <p className="m-0 mt-1 text-[#252422] leading-relaxed">
                            {mentee.academicDetails || "No special academic observations recorded on student file."}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-[#756f67] uppercase block mb-2">
                            Recent Campus Leaves (Last 5):
                          </span>
                          {mentee.recentLeaves?.length > 0 ? (
                            <div className="space-y-1.5">
                              {mentee.recentLeaves.map((l) => (
                                <div
                                  key={l.id}
                                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white border border-[rgba(64,61,57,0.08)]"
                                >
                                  <span>
                                    <strong>{l.type}</strong> ({formatDate(l.startDate)} → {formatDate(l.endDate)})
                                  </span>
                                  <Badge
                                    variant={
                                      l.status === "APPROVED"
                                        ? "approved"
                                        : l.status === "REJECTED"
                                        ? "rejected"
                                        : "pending"
                                    }
                                    size="sm"
                                  >
                                    {l.status?.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#756f67] italic">No leave history recorded for this student.</span>
                          )}
                        </div>
                      </div>
                    )}
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