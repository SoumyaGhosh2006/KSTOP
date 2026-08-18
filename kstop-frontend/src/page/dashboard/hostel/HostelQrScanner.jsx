import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HostelShell from "../../../components/hostel/HostelShell";
import api from "../../../utils/api";

/**
 * Provide camera and manual QR scanning for approved leave data.
 * @returns {JSX.Element} The QR scanner interface.
 */
export default function HostelQrScanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualQrData, setManualQrData] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function saveQrData(qrData) {
    if (!qrData) return;

    try {
      setError("");
      const response = await api.post("/hostel/scan-leave-qr", { qrData });
      setMessage(`${response.data.record.studentName}'s approved leave data has been stored.`);
      setManualQrData("");
      stopCamera();
    } catch (scanError) {
      setError(scanError.response?.data?.message || "Could not store QR leave data.");
    }
  }

  async function startCamera() {
    setError("");
    setMessage("");

    if (!("BarcodeDetector" in window)) {
      setError("Camera QR detection is not available in this browser. Paste the QR data below.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsScanning(true);

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        const codes = await detector.detect(videoRef.current);
        const firstCode = codes[0];
        if (firstCode?.rawValue) {
          await saveQrData(firstCode.rawValue);
        }
      }, 900);
    } catch {
      setError("Camera access was blocked or unavailable.");
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

  function submitManualQr(event) {
    event.preventDefault();
    saveQrData(manualQrData);
  }

  return (
    <HostelShell title="Scan QR Code" eyebrow="Approved leave request">
      <section className="hostel-panel">
        <h2>Camera scan</h2>
        <video ref={videoRef} className="hostel-camera" muted playsInline />
        <div className="hostel-actions" style={{ marginTop: 14 }}>
          <button type="button" className="hostel-button" onClick={startCamera} disabled={isScanning}>
            Start Camera
          </button>
          <button type="button" className="hostel-button-muted" onClick={stopCamera}>
            Stop Camera
          </button>
          <Link className="hostel-button-muted" to="/dashboard/hostel/leave-records">
            View Stored Data
          </Link>
        </div>
        <p className="hostel-note">
          When an approved leave QR is detected, the student data is stored in the hostel leave table.
        </p>
        {message ? <p className="hostel-success">{message}</p> : null}
        {error ? <p className="hostel-error">{error}</p> : null}
      </section>

      <section className="hostel-panel" style={{ marginTop: 16 }}>
        <h2>Manual QR data</h2>
        <form onSubmit={submitManualQr}>
          <textarea
            className="hostel-input"
            rows="5"
            value={manualQrData}
            onChange={(event) => setManualQrData(event.target.value)}
            placeholder='Paste JSON QR data, for example {"studentName":"Asha","rollNumber":"2205","contactNumber":"..."}'
          />
          <div className="hostel-actions" style={{ marginTop: 12 }}>
            <button type="submit" className="hostel-button">Store QR Data</button>
          </div>
        </form>
      </section>
    </HostelShell>
  );
}
