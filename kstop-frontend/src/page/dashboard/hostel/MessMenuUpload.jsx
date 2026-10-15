import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import HostelShell from "../../../components/hostel/HostelShell";
import Badge from "../../../components/Badge";
import Modal from "../../../components/Modal";
import EmptyState from "../../../components/EmptyState";
import Toast from "../../../components/Toast";
import api from "../../../utils/api";
import {
  Upload,
  Utensils,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  RefreshCw,
  X,
  FileText,
  Star,
  Clock,
  Building,
} from "../../../components/Icons";

export default function MessMenuUpload() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [currentMenu, setCurrentMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [toast, setToast] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("kstop_user")) || {};
    } catch {
      return {};
    }
  })();

  const hostelName =
    user?.assignedHostelName ||
    user?.hostelName ||
    user?.name ||
    "Assigned Hostel";

  async function loadCurrentMenu() {
    setLoading(true);
    try {
      const response = await api.get("/hostel/summary");
      if (response.data?.latestMenu) {
        setCurrentMenu(response.data.latestMenu);
      } else {
        setCurrentMenu(null);
      }
    } catch {
      setToast({
        type: "error",
        message: "Could not fetch active mess menu from the server.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentMenu();
  }, []);

  function handleFileSelected(selectedFile) {
    setToast(null);

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    if (!["image/jpeg", "image/png"].includes(selectedFile.type)) {
      setFile(null);
      setPreviewUrl("");
      setToast({
        type: "error",
        message: "Invalid file type. Please upload a .jpeg, .jpg, or .png image.",
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setPreviewUrl("");
      setToast({
        type: "error",
        message: "File size exceeds 5MB limit. Please compress the menu image.",
      });
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  function onDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelected(droppedFile);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setToast({
        type: "warning",
        message: "Please choose an image file before clicking upload.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("menuImage", file);

    setIsUploading(true);
    setToast(null);

    try {
      // NOTE: Axios header Content-Type must be undefined so browser builds
      // the multipart/form-data boundary parameter automatically.
      const response = await api.post("/hostel/mess-menu", formData, {
        headers: { "Content-Type": undefined },
      });

      setCurrentMenu(response.data.menu);
      setFile(null);
      setPreviewUrl("");
      setToast({
        type: "success",
        message: "Mess menu published successfully! Residents can now view today's schedule.",
      });
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Menu image upload failed. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function clearSelectedFile() {
    setFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <HostelShell
      title="Publish Mess Menu"
      eyebrow={`${hostelName} · Dining Schedule`}
      backTo="/dashboard/hostel"
      actionButton={
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/hostel/mess-feedback"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[rgba(64,61,57,0.15)] hover:bg-[#f5f0e5] text-[#252422] text-xs font-bold transition-all shadow-sm"
          >
            <Star size={14} className="text-amber-500" /> Student Feedback
          </Link>
          <button
            type="button"
            onClick={loadCurrentMenu}
            className="p-2 rounded-xl border border-[rgba(64,61,57,0.15)] bg-white hover:bg-[#f5f0e5] text-[#252422] transition-colors cursor-pointer"
            title="Refresh Menu Status"
            aria-label="Refresh Menu Status"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Drag & Drop Upload Form (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                  Digital Notice Board
                </span>
                <h3 className="text-base font-bold text-[#252422] m-0">Upload Menu Image</h3>
              </div>
              <Badge variant="brand" size="sm">
                JPEG / PNG · Max 5MB
              </Badge>
            </div>

            <p className="text-xs text-[#756f67] m-0 leading-relaxed">
              Uploading a new menu immediately replaces the current dining schedule for all residents of{" "}
              <strong>{hostelName}</strong>. Previous versions are archived safely.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isDragging
                    ? "border-[#eb5e28] bg-[#eb5e28]/5"
                    : "border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] hover:bg-[#fffcf2] hover:border-[#eb5e28]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-[#eb5e28]/10 text-[#eb5e28] flex items-center justify-center mb-3">
                  <Upload size={26} />
                </div>

                <strong className="text-sm font-bold text-[#252422] block">
                  {file ? file.name : "Drag and drop menu image here"}
                </strong>
                <span className="text-xs text-[#756f67] block mt-1">
                  or click anywhere to browse from local computer
                </span>
                <span className="text-[11px] text-[#756f67]/80 block mt-2 font-mono">
                  Supported formats: .JPG, .JPEG, .PNG
                </span>
              </div>

              {/* Staged file preview */}
              {previewUrl && (
                <div className="p-3.5 rounded-xl border border-[rgba(64,61,57,0.12)] bg-[#fffcf2] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={previewUrl}
                      alt="Staged menu thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-black/10 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <strong className="text-xs font-bold text-[#252422] block truncate">
                        {file?.name}
                      </strong>
                      <span className="text-[11px] text-[#756f67] font-mono">
                        {(file?.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="p-1.5 rounded-lg text-[#756f67] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!file || isUploading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload size={16} />
                  {isUploading ? "Uploading to Cloud..." : "Publish Menu to Hostel"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Currently Published Menu Showcase (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67]">
                  Published Notice
                </span>
                <h3 className="text-base font-bold text-[#252422] m-0">Live Student View</h3>
              </div>
              <Badge variant={currentMenu ? "approved" : "neutral"} size="sm" dot={Boolean(currentMenu)}>
                {currentMenu ? "CURRENTLY ACTIVE" : "NO MENU LIVE"}
              </Badge>
            </div>

            {loading ? (
              <div className="py-8">
                <EmptyState
                  icon={Clock}
                  title="Checking server..."
                  description="Synchronizing active mess menu state."
                />
              </div>
            ) : currentMenu ? (
              <div className="space-y-3">
                <div
                  onClick={() => setShowZoomModal(true)}
                  className="relative group rounded-xl overflow-hidden border border-[rgba(64,61,57,0.15)] bg-black/5 aspect-[4/3] cursor-pointer"
                >
                  <img
                    src={currentMenu.imageUrl}
                    alt="Active hostel mess menu"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[#252422]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs backdrop-blur-xs">
                    <ZoomIn size={20} /> Click to Expand Full View
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.1)] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#756f67]">Published Date:</span>
                    <strong className="text-[#252422]">
                      {new Date(currentMenu.createdAt).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#756f67]">Assigned Hostel:</span>
                    <strong className="text-[#252422]">
                      {currentMenu.hostel?.name || hostelName}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Utensils}
                title="No menu is currently live"
                description="Upload an image on the left to activate the daily dining menu for all enrolled residents."
              />
            )}
          </div>
        </div>
      </div>

      {/* High-Resolution Zoom Modal */}
      {currentMenu && (
        <Modal
          isOpen={showZoomModal}
          onClose={() => setShowZoomModal(false)}
          title={`Mess Menu · ${hostelName}`}
          description={`Published on ${new Date(currentMenu.createdAt).toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`}
          size="xl"
        >
          <div className="rounded-xl overflow-hidden border border-[rgba(64,61,57,0.15)] bg-white max-h-[75vh] flex items-center justify-center p-2">
            <img
              src={currentMenu.imageUrl}
              alt="Full size mess menu"
              className="max-h-[70vh] w-auto object-contain rounded"
            />
          </div>
        </Modal>
      )}
    </HostelShell>
  );
}
