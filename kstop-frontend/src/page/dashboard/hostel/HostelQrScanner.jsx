import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import jsQR from "jsqr";
import HostelShell from "../../../components/hostel/HostelShell";
import Badge from "../../../components/Badge";
import Toast from "../../../components/Toast";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Shield,
  User,
  Phone,
  Calendar,
} from "../../../components/Icons";

/**
 * Plays a short, pleasant confirmation beep using Web Audio API on successful scan.
 */
function playBeep(type = "success") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    if (type === "success") {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Ignore audio permission or context restrictions
  }
}

export default function HostelQrScanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const lastAttemptRef = useRef(0);

  const [isScanning, setIsScanning] = useState(false);
  const [manualQrData, setManualQrData] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Result states
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'duplicate', record, message }
  const [error, setError] = useState("");
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function processQrData(qrData) {
    if (!qrData) return;
    const rawInput = String(qrData).trim();
    if (!rawInput) return;

    // The backend route parseQrPayload expects a JSON string or an object with qrToken.
    // If a security guard manually inputs a plain token string (e.g. hex token),
    // raw JSON.parse throws SyntaxError on the backend. We normalize it here so both
    // camera-scanned JSON and manual token strings are accepted seamlessly.
    let payloadToSend = rawInput;
    try {
      const parsed = JSON.parse(rawInput);
      if (typeof parsed === "object" && parsed !== null) {
        payloadToSend = parsed;
      } else {
        payloadToSend = { qrToken: rawInput };
      }
    } catch {
      payloadToSend = { qrToken: rawInput };
    }

    try {
      setError("");
      const response = await api.post("/hostel/scan-leave-qr", { qrData: payloadToSend });
      const record = response.data.record;
      const responseMsg = response.data.message || "";

      if (responseMsg.includes("already scanned") || responseMsg.includes("no duplicate")) {
        playBeep("warning");
        setScanResult({
          type: "duplicate",
          record,
          message:
            responseMsg ||
            `${record?.studentName || "Student"}'s leave pass has already been logged. No duplicate was created.`,
        });
      } else {
        playBeep("success");
        setScanResult({
          type: "success",
          record,
          message: `${record?.studentName || "Student"}'s gate pass verified and departure logged successfully!`,
        });

        // Add to active session recent scans
        if (record) {
          setRecentScans((prev) => [
            {
              id: record.id || Date.now(),
              studentName: record.studentName,
              rollNumber: record.rollNumber,
              scannedAt: new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              approved: record.approved,
            },
            ...prev.slice(0, 4),
          ]);
        }
      }

      setManualQrData("");
    } catch (scanError) {
      playBeep("error");
      setScanResult(null);
      setError(
        scanError.response?.data?.message ||
          "Could not verify QR code. Please check that the student is assigned to this hostel."
      );
    }
  }

  async function scanFrame(detector) {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return null;

    if (detector) {
      try {
        const codes = await detector.detect(video);
        return codes[0]?.rawValue || null;
      } catch {
        // Fall back to jsqr below
      }
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return null;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code?.data || null;
    } catch {
      return null;
    }
  }

  function describeCameraError(cameraError) {
    if (cameraError?.name === "NotAllowedError") {
      return "Camera permission denied. Allow camera access in your browser settings to scan gate passes.";
    }
    if (cameraError?.name === "NotFoundError" || cameraError?.name === "OverconstrainedError") {
      return "No video camera detected on this terminal.";
    }
    if (cameraError?.name === "NotReadableError") {
      return "The camera is currently locked by another application or browser tab. Please close other camera tabs.";
    }
    return "Camera hardware stream was unavailable.";
  }

  async function startCamera() {
    setError("");
    setScanResult(null);

    if (!window.isSecureContext) {
      setError(
        "Camera stream requires a secure context (HTTPS or localhost). Please open the application on localhost or enable HTTPS."
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Your browser does not support web camera streaming. Please use the Manual Token input below."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);

      const detector =
        "BarcodeDetector" in window
          ? new window.BarcodeDetector({ formats: ["qr_code"] })
          : null;

      scanTimerRef.current = window.setInterval(async () => {
        if (Date.now() - lastAttemptRef.current < 2500) return;

        const qrText = await scanFrame(detector);
        if (qrText) {
          lastAttemptRef.current = Date.now();
          await processQrData(qrText);
        }
      }, 400);
    } catch (cameraError) {
      setError(describeCameraError(cameraError));
      stopCamera();
    }
  }

  function stopCamera() {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualQrData.trim()) return;
    setIsSubmittingManual(true);
    await processQrData(manualQrData.trim());
    setIsSubmittingManual(false);
  }

  return (
    <HostelShell
      title="Gate Security QR Scanner"
      eyebrow="Departure Verification Terminal"
      backTo="/dashboard/hostel"
      actionButton={
        <Link
          to="/dashboard/hostel/leave-records"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[rgba(64,61,57,0.15)] hover:bg-[#f5f0e5] text-[#252422] text-xs font-bold transition-all shadow-sm"
        >
          <FileText size={15} /> Leave Ledger
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Error notification */}
        {error && (
          <Toast type="error" message={error} onClose={() => setError("")} />
        )}

        {/* Verification Result Notification Card */}
        {scanResult && (
          <div
            className={`rounded-2xl p-5 border-2 shadow-md transition-all animate-in fade-in zoom-in-95 duration-200 ${
              scanResult.type === "success"
                ? "bg-emerald-50/90 border-emerald-500 text-emerald-950"
                : "bg-amber-50/90 border-amber-500 text-amber-950"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white ${
                    scanResult.type === "success" ? "bg-emerald-600" : "bg-amber-600"
                  }`}
                >
                  {scanResult.type === "success" ? (
                    <CheckCircle2 size={26} />
                  ) : (
                    <AlertTriangle size={26} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-widest ${
                        scanResult.type === "success" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {scanResult.type === "success"
                        ? "Gate Exit Authorized"
                        : "Duplicate Scan Warning"}
                    </span>
                    <Badge
                      variant={scanResult.type === "success" ? "approved" : "pending_parent"}
                      size="sm"
                    >
                      {scanResult.type === "success" ? "VERIFIED" : "ALREADY RECORDED"}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-black tracking-tight m-0 text-[#252422]">
                    {scanResult.record?.studentName || "Student Exit Verified"}
                  </h3>
                  <p className="text-xs m-0 mt-1 text-[#403d39] font-medium leading-relaxed">
                    {scanResult.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setScanResult(null)}
                  className="px-3 py-1.5 rounded-lg border border-black/10 bg-white/80 hover:bg-white text-xs font-bold transition-all text-[#252422]"
                >
                  Dismiss
                </button>
                <Link
                  to="/dashboard/hostel/leave-records"
                  className="px-3.5 py-1.5 rounded-lg bg-[#252422] hover:bg-[#eb5e28] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <FileText size={14} /> Open in Records
                </Link>
              </div>
            </div>

            {/* Quick Record Details Grid */}
            {scanResult.record && (
              <div className="mt-4 pt-4 border-t border-black/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-black/60 uppercase font-bold block">
                    Roll Number
                  </span>
                  <strong className="font-mono text-[#252422]">
                    {scanResult.record.rollNumber || "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-black/60 uppercase font-bold block">
                    Leave Duration
                  </span>
                  <strong className="text-[#252422]">
                    {formatDate(scanResult.record.leaveStartDate)} →{" "}
                    {formatDate(scanResult.record.leaveEndDate)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-black/60 uppercase font-bold block">
                    Mentor Approved
                  </span>
                  <strong className="text-[#252422]">
                    {scanResult.record.mentorName || "Faculty Mentor"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-black/60 uppercase font-bold block">
                    Emergency Contact
                  </span>
                  <strong className="font-mono text-[#252422]">
                    {scanResult.record.parentsPhoneNumber ||
                      scanResult.record.contactNumber ||
                      "—"}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Scanner Section (Camera Viewfinder + Manual Input) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Camera Viewfinder (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                  Optic Sensor
                </span>
                <h3 className="text-base font-bold text-[#252422] m-0">Live Gate Camera Scan</h3>
              </div>
              <Badge variant={isScanning ? "approved" : "neutral"} size="sm" dot={isScanning}>
                {isScanning ? "CAMERA ACTIVE" : "CAMERA STANDBY"}
              </Badge>
            </div>

            {/* Video Viewfinder Container */}
            <div className="relative w-full aspect-video sm:aspect-[16/10] bg-[#1a1918] rounded-2xl overflow-hidden border border-black/20 flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isScanning ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                muted
                playsInline
              />

              {/* Laser and Reticle Overlay when scanning */}
              {isScanning ? (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Viewfinder Target Box */}
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-white/40 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#eb5e28] rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#eb5e28] rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#eb5e28] rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#eb5e28] rounded-br-lg" />

                    {/* Animated scanning bar */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#eb5e28] to-transparent shadow-[0_0_8px_#eb5e28] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="absolute bottom-6 px-3 py-1 rounded-full bg-black/70 backdrop-blur-xs text-[11px] font-mono text-white/90">
                    Align student QR pass inside frame
                  </span>
                </div>
              ) : (
                <div className="text-center p-6 text-white/60 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                    <Camera size={32} />
                  </div>
                  <div>
                    <strong className="text-sm text-white/90 block">Camera is Idle</strong>
                    <span className="text-xs text-white/50 block mt-0.5">
                      Click "Start Camera" to activate live pass verification.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Control Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isScanning ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={16} /> Start Camera Scanner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-5 py-2.5 rounded-xl bg-[#252422] hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={16} /> Stop Camera
                </button>
              )}

              <Link
                to="/dashboard/hostel/leave-records"
                className="px-4 py-2.5 rounded-xl border border-[rgba(64,61,57,0.15)] bg-white hover:bg-[#f5f0e5] text-[#252422] text-xs font-semibold transition-all"
              >
                View Stored Records ({recentScans.length})
              </Link>
            </div>

            <p className="text-[11px] text-[#756f67] m-0 leading-relaxed">
              <strong>Scan Guard:</strong> Works with all modern mobile devices, tablets, and webcams. When a student's mentor-approved digital gate pass is scanned, the departure record is immediately saved to the hostel leave records ledger.
            </p>
          </div>

          {/* Right Column: Manual Pass Token & Active Session Log (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Manual QR / Token Input Card */}
            <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67]">
                    Manual Backup
                  </span>
                  <h3 className="text-base font-bold text-[#252422] m-0">Token / JSON Fallback</h3>
                </div>
                <QrCode size={18} className="text-[#756f67]" />
              </div>

              <p className="text-xs text-[#756f67] m-0 leading-relaxed">
                If the student's screen is cracked or camera access is restricted, paste the QR token or JSON payload manually below:
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <textarea
                  rows="4"
                  value={manualQrData}
                  onChange={(e) => setManualQrData(e.target.value)}
                  placeholder='Paste JSON QR data or token:
{"qrToken":"..."} or {"studentName":"Asha","rollNumber":"2205", ...}'
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-[#252422] font-mono text-xs focus:outline-none focus:border-[#eb5e28] transition-colors resize-none"
                />

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingManual || !manualQrData.trim()}
                    className="px-4 py-2 rounded-xl bg-[#252422] hover:bg-[#eb5e28] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmittingManual ? "Verifying..." : "Verify & Log Gate Pass"}
                  </button>

                  {manualQrData && (
                    <button
                      type="button"
                      onClick={() => setManualQrData("")}
                      className="text-xs text-[#756f67] hover:text-[#252422] underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Active Session Verification Log */}
            <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67]">
                    Current Session
                  </span>
                  <h3 className="text-base font-bold text-[#252422] m-0">Recent Gate Exits</h3>
                </div>
                <Badge variant="brand" size="sm">
                  {recentScans.length} Scanned
                </Badge>
              </div>

              {recentScans.length === 0 ? (
                <div className="text-center py-6 text-[#756f67]">
                  <Clock size={24} className="mx-auto mb-1.5 opacity-40 text-[#756f67]" />
                  <p className="text-xs font-semibold m-0">No scans in this session.</p>
                  <span className="text-[11px] block mt-0.5">
                    Verified gate passes from this session will appear here.
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentScans.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] flex items-center justify-between gap-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <strong className="text-xs font-bold text-[#252422] block truncate">
                          {item.studentName}
                        </strong>
                        <span className="text-[10px] font-mono text-[#756f67] block">
                          Roll: {item.rollNumber} · {item.scannedAt}
                        </span>
                      </div>
                      <Badge variant="approved" size="sm">
                        Verified
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </HostelShell>
  );
}
