import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import QRDisplay from "../../../components/QRDisplay";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import api from "../../../utils/api";
import { QrCode, Plus } from "../../../components/Icons";

export default function GatePass() {
  const navigate = useNavigate();
  const [activeLeave, setActiveLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("kstop_user")) || {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    async function loadActivePass() {
      try {
        const res = await api.get("/leave/active-qr");
        setActiveLeave(res.data.activeLeave || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load active gate pass.");
      } finally {
        setLoading(false);
      }
    }
    loadActivePass();
  }, []);

  return (
    <StudentShell
      title="Digital Gate Pass"
      subtitle="Security Verification"
      backTo="/dashboard/student"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {loading ? (
          <SkeletonLoader type="card" count={1} />
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        ) : !activeLeave ? (
          <EmptyState
            icon={QrCode}
            title="No Active Approved Gate Pass"
            description="You do not have any currently active, approved leave passes. Once your mentor approves your request, your security QR gate pass will be automatically issued here."
            actionLabel="Apply for Leave"
            onAction={() => navigate("/dashboard/student/new-leave")}
          />
        ) : (
          <QRDisplay
            qrCode={activeLeave.qrCode}
            leaveData={{
              ...activeLeave,
              studentName: user?.name,
              rollNumber: user?.rollNumber,
            }}
          />
        )}
      </div>
    </StudentShell>
  );
}
