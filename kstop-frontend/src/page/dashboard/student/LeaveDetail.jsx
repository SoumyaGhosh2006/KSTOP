import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import Badge from "../../../components/Badge";
import QRDisplay from "../../../components/QRDisplay";
import SkeletonLoader from "../../../components/SkeletonLoader";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import { Calendar, MapPin, User, ArrowLeft, Clock, Shield } from "../../../components/Icons";

export default function LeaveDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeave() {
      try {
        const res = await api.get("/leave/my-leaves");
        const found = (res.data?.leaves || []).find((l) => l.id === id);
        setLeave(found || null);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadLeave();
  }, [id]);

  return (
    <StudentShell
      title="Leave Request Details"
      subtitle="Application Status"
      backTo="/dashboard/student/leaves"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {loading ? (
          <SkeletonLoader type="card" count={1} />
        ) : !leave ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] space-y-3">
            <h3 className="text-base font-bold text-[#252422] m-0">Leave record not found</h3>
            <p className="text-xs text-[#756f67]">The requested leave record could not be loaded.</p>
            <Link
              to="/dashboard/student/leaves"
              className="inline-block px-4 py-2 rounded-xl bg-[#252422] text-[#fffcf2] text-xs font-bold"
            >
              Back to My Leaves
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
                <div>
                  <h3 className="text-lg font-bold text-[#252422] m-0">{leave.type} Leave</h3>
                  <span className="text-xs text-[#756f67]">Applied on {formatDate(leave.createdAt)}</span>
                </div>
                <Badge
                  variant={
                    leave.status === "APPROVED"
                      ? "approved"
                      : leave.status === "REJECTED"
                      ? "rejected"
                      : "pending"
                  }
                  dot
                >
                  {leave.status?.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#756f67] block">Valid Period</span>
                  <strong className="text-[#252422] block mt-0.5">
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#756f67] block">Destination</span>
                  <span className="text-[#252422] block mt-0.5 font-semibold">{leave.place}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#756f67] block">Mentor</span>
                  <span className="text-[#252422] block mt-0.5">{leave.mentor?.name || "Assigned Mentor"}</span>
                </div>
              </div>

              {leave.purpose && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-[#756f67] block mb-1">Declared Purpose</span>
                  <p className="text-xs text-[#403d39] m-0 italic bg-[#fbfaf6] p-3 rounded-xl border border-[rgba(64,61,57,0.08)]">
                    "{leave.purpose}"
                  </p>
                </div>
              )}
            </div>

            {leave.status === "APPROVED" && leave.qrCode && (
              <QRDisplay qrCode={leave.qrCode} leaveData={leave} />
            )}
          </div>
        )}
      </div>
    </StudentShell>
  );
}
