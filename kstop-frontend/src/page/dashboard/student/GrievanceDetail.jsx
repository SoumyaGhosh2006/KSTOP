import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import Badge from "../../../components/Badge";
import SkeletonLoader from "../../../components/SkeletonLoader";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import { AlertCircle, CheckCircle2, Shield, ArrowLeft } from "../../../components/Icons";

export default function GrievanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGrievance() {
      try {
        const res = await api.get("/grievance/my-grievances", { params: { view: "history" } });
        const found = (res.data?.grievances || []).find((g) => g.id === id);
        setGrievance(found || null);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadGrievance();
  }, [id]);

  return (
    <StudentShell
      title="Grievance Details"
      subtitle="Ticket Status"
      backTo="/dashboard/student/grievances"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {loading ? (
          <SkeletonLoader type="card" count={1} />
        ) : !grievance ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] space-y-3">
            <h3 className="text-base font-bold text-[#252422] m-0">Grievance ticket not found</h3>
            <p className="text-xs text-[#756f67]">The requested grievance record could not be loaded.</p>
            <Link
              to="/dashboard/student/grievances"
              className="inline-block px-4 py-2 rounded-xl bg-[#252422] text-[#fffcf2] text-xs font-bold"
            >
              Back to Grievances
            </Link>
          </div>
        ) : (
          <div className="p-6 bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <h3 className="text-lg font-bold text-[#252422] m-0">{grievance.title}</h3>
                <span className="text-xs text-[#756f67]">
                  Category: {grievance.category} · Filed {formatDate(grievance.createdAt)}
                </span>
              </div>
              <Badge
                variant={
                  grievance.resolutionStatus === "RESOLVED"
                    ? "approved"
                    : grievance.resolutionStatus === "CLASHED"
                    ? "clashed"
                    : "progress"
                }
                dot
              >
                {grievance.resolutionStatus || "In Progress"}
              </Badge>
            </div>

            <div className="text-xs text-[#403d39] leading-relaxed whitespace-pre-wrap bg-[#fbfaf6] p-4 rounded-xl border border-[rgba(64,61,57,0.08)]">
              {grievance.description}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-[#756f67]">
                Urgency Priority Score: <strong>{grievance.priorityScore ?? "—"}/100</strong>
              </span>
              <button
                type="button"
                onClick={() => navigate("/dashboard/student/grievances")}
                className="text-xs font-bold text-[#eb5e28] hover:underline"
              >
                View all grievances →
              </button>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
