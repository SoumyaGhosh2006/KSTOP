import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import { CheckCircle2, Calendar, MapPin, ArrowRight } from "../../../components/Icons";

export default function LeaveConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const leave = location.state?.leave;

  return (
    <StudentShell
      title="Leave Application Submitted"
      subtitle="Request Status"
      backTo="/dashboard/student/leaves"
    >
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
              Application Confirmed
            </span>
            <h2 className="text-xl font-bold text-[#252422] m-0 mt-1">
              Your Leave Request Has Been Registered
            </h2>
            <p className="text-xs text-[#756f67] max-w-sm mx-auto mt-2 leading-relaxed">
              Notification has been forwarded to your parent/guardian for approval. Once approved by parent and faculty mentor, your digital QR gate pass will be generated.
            </p>
          </div>

          {leave && (
            <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.1)] text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[#756f67]">Category:</span>
                <strong className="text-[#252422]">{leave.type}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#756f67]">Destination:</span>
                <strong className="text-[#252422]">{leave.place}</strong>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              to="/dashboard/student/leaves"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#252422] hover:bg-black text-[#fffcf2] text-xs font-bold transition-all shadow-sm"
            >
              View My Requests
            </Link>
            <Link
              to="/dashboard/student"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] hover:bg-black/5 text-[#252422] text-xs font-bold transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
