import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import jsQR from "jsqr";
import HostelShell from "../../../components/hostel/HostelShell";
import api from "../../../utils/api";

// ─────────────────────────────────────────────
//  HostelQrScanner
//
//  HOW QR DETECTION WORKS HERE:
//  Some browsers (Chrome, Edge) have a built-in BarcodeDetector
//  that can read QR codes directly. Others (Firefox, Safari) do
//  not — that was why the camera never opened and the page said
//  "Camera QR detection is not available in this browser."
//
//  FIX: when BarcodeDetector is missing, we fall back to the
//  "jsqr" library. Every half second we copy one video frame onto
//  an invisible canvas and let jsQR look for a QR code in it.
//  This works in every modern browser.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
//  HostelQrScanner
//
//  HOW QR DETECTION WORKS HERE:
//  Some browsers (Chrome, Edge) have a built-in BarcodeDetector
//  that can read QR codes directly. Others (Firefox, Safari) do
//  not — that was why the camera never opened and the page said
//  "Camera QR detection is not available in this browser."
//
//  FIX: when BarcodeDetector is missing, we fall back to the
//  "jsqr" library. Every half second we copy one video frame onto
//  an invisible canvas and let jsQR look for a QR code in it.
//  This works in every modern browser.
// ─────────────────────────────────────────────

/**
 * Provide camera and manual QR scanning for approved leave data.
 * @returns {JSX.Element} The QR scanner interface.
 */
export default function HostelQrScanner() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  // Remembers the last scan attempt so a QR that fails to save
  // (e.g. not approved yet) does not spam an error every half second.
  const lastAttemptRef = useRef(0);
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

  // Reads one frame from the camera and tries to find a QR code in it.
  // Returns the decoded text, or null when nothing is found.
  async function scanFrame(detector) {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return null;

    // Path 1: browser has a built-in QR reader (Chrome, Edge)
    if (detector) {
      const codes = await detector.detect(video);
      return codes[0]?.rawValue || null;
    }

    // Path 2: jsQR fallback (Firefox, Safari, older browsers).
    // We draw the current video frame onto a hidden canvas and
    // hand the raw pixels to jsQR.
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    return code?.data || null;
  }

  // Turns a getUserMedia failure into a message a human understands.
  function describeCameraError(cameraError) {
    if (cameraError?.name === "NotAllowedError") {
      return "Camera permission was denied. Click the camera icon in the browser address bar, allow access, then press Start Camera again.";
    }
    if (cameraError?.name === "NotFoundError" || cameraError?.name === "OverconstrainedError") {
      return "No camera was found on this device.";
    }
    if (cameraError?.name === "NotReadableError") {
      return "The camera is already being used by another app or browser tab. Close it and try again.";
    }
    return "Camera access was blocked or unavailable.";
  }

  async function startCamera() {
    setError("");
    setMessage("");

    // getUserMedia only works on https:// or http://localhost.
    // If someone opens the site as http://<ip-address> the browser
    // blocks the camera completely — explain that instead of failing silently.
    if (!window.isSecureContext) {
      setError("The camera only works on https:// or http://localhost. Open the site on localhost or enable HTTPS.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support camera access. Paste the QR data below instead.");
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

      // Use the built-in detector when the browser has one,
      // otherwise scanFrame falls back to jsQR automatically.
      const detector =
        "BarcodeDetector" in window
          ? new window.BarcodeDetector({ formats: ["qr_code"] })
          : null;

      scanTimerRef.current = window.setInterval(async () => {
        // Cooldown: after any attempt, wait 3 seconds before the
        // next one so errors/success messages stay readable.
        if (Date.now() - lastAttemptRef.current < 3000) return;

        const qrText = await scanFrame(detector);
        if (qrText) {
          lastAttemptRef.current = Date.now();
          await saveQrData(qrText);
        }
      }, 500);
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
