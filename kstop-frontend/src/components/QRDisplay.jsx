import React, { useState } from "react";
import { Download, Printer, Check, Shield, QrCode, Calendar, MapPin, User } from "./Icons";
import Badge from "./Badge";

export default function QRDisplay({
  qrCode,
  leaveData = {},
  showActions = true,
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  function handleCopyToken() {
    if (!leaveData?.qrToken) return;
    navigator.clipboard.writeText(leaveData.qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!qrCode) return;
    const a = document.createElement("a");
    a.href = qrCode;
    a.download = `KSTOP-GatePass-${leaveData?.rollNumber || "Student"}-${leaveData?.type || "Leave"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handlePrint() {
    window.print();
  }

  const startDateFormatted = leaveData?.startDate
    ? new Date(leaveData.startDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const endDateFormatted = leaveData?.endDate
    ? new Date(leaveData.endDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div
      className={`bg-white rounded-2xl border border-[rgba(64,61,57,0.18)] shadow-lg overflow-hidden ${className}`}
      style={{
        boxShadow: "0 20px 45px -10px rgba(37,36,34,0.15)",
      }}
    >
      {/* Pass Header */}
      <div className="bg-[#252422] text-[#fffcf2] p-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eb5e28] text-white flex items-center justify-center font-black text-lg tracking-wider">
            K
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
              Official Digital Gate Pass
            </div>
            <h3 className="text-base font-bold text-white m-0">K-STOP CAMPUS EXIT</h3>
          </div>
        </div>
        <Badge variant="approved" dot size="sm">
          VERIFIED & APPROVED
        </Badge>
      </div>

      {/* Main Pass Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-[#fbfaf6] rounded-xl border border-[rgba(64,61,57,0.12)] text-center">
            {qrCode ? (
              <img
                src={qrCode}
                alt="Gate Pass QR Code"
                className="w-40 h-40 object-contain rounded-lg bg-white p-2 border border-black/5 shadow-inner"
              />
            ) : (
              <div className="w-40 h-40 rounded-lg bg-black/5 flex flex-col items-center justify-center text-[#756f67]">
                <QrCode size={40} className="mb-2 opacity-40" />
                <span className="text-xs">No QR code</span>
              </div>
            )}
            <span className="text-[10px] font-mono text-[#756f67] mt-3 uppercase tracking-wider flex items-center gap-1">
              <Shield size={12} className="text-[#eb5e28]" /> Single-Use Entry/Exit Token
            </span>
          </div>

          {/* Details */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                  Student Name
                </span>
                <strong className="text-sm text-[#252422] block mt-0.5">
                  {leaveData?.student?.name || leaveData?.studentName || "Student"}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                  Roll Number
                </span>
                <strong className="text-sm font-mono text-[#252422] block mt-0.5">
                  {leaveData?.student?.rollNumber || leaveData?.rollNumber || "—"}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block flex items-center gap-1">
                  <Calendar size={11} /> Valid Period
                </span>
                <span className="text-xs font-semibold text-[#252422] block mt-0.5">
                  {startDateFormatted} → {endDateFormatted}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                  Leave Category
                </span>
                <span className="text-xs font-semibold text-[#eb5e28] block mt-0.5">
                  {leaveData?.type || "General"} Leave
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block flex items-center gap-1">
                  <MapPin size={11} /> Destination
                </span>
                <span className="text-xs text-[#252422] block mt-0.5 truncate">
                  {leaveData?.place || "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block flex items-center gap-1">
                  <User size={11} /> Faculty Mentor
                </span>
                <span className="text-xs text-[#252422] block mt-0.5 truncate">
                  {leaveData?.mentor?.name || leaveData?.mentorName || "Assigned Mentor"}
                </span>
              </div>
            </div>

            {leaveData?.purpose && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#756f67] block">
                  Declared Purpose
                </span>
                <p className="text-xs text-[#403d39] m-0 mt-0.5 italic line-clamp-2">
                  "{leaveData.purpose}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-6 pt-4 border-t border-[rgba(64,61,57,0.1)] flex flex-wrap items-center justify-between gap-3">
            {leaveData?.qrToken ? (
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-xs font-mono font-medium text-[#756f67] hover:text-[#252422] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Shield size={14} />}
                <span>{copied ? "Token Copied!" : `Token: ${leaveData.qrToken.slice(0, 10)}...`}</span>
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white hover:bg-black/5 text-[#252422] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer size={14} /> Print Pass
              </button>
              {qrCode && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-1.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Download size={14} /> Download Pass
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
