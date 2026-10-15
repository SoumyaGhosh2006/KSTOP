import React, { useEffect, useMemo, useState } from "react";
import StudentShell from "../../../components/student/StudentShell";
import Modal from "../../../components/Modal";
import SkeletonLoader from "../../../components/SkeletonLoader";
import EmptyState from "../../../components/EmptyState";
import Toast from "../../../components/Toast";
import Badge from "../../../components/Badge";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  Utensils,
  ZoomIn,
  Upload,
  Calendar,
  Building,
  CheckCircle2,
  X,
} from "../../../components/Icons";

export default function MessMenu() {
  const [menus, setMenus] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewMenu, setPreviewMenu] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("kstop_user")) || {};
    } catch {
      return {};
    }
  })();

  async function loadMenus() {
    try {
      setError("");
      const res = await api.get("/hostel/mess-menus");
      setMenus(res.data.menus || []);
    } catch (err) {
      setError("Could not load hostel mess menus.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenus();
  }, []);

  const hostels = useMemo(() => {
    const map = new Map();
    menus.forEach((m) => {
      if (m.hostel) map.set(m.hostel.id, m.hostel);
    });
    return Array.from(map.values());
  }, [menus]);

  const visibleMenus = selectedHostelId
    ? menus.filter((m) => m.hostel?.id === selectedHostelId)
    : menus;

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Please select a JPEG or PNG mess menu image.");
      return;
    }

    const formData = new FormData();
    formData.append("menuImage", file);

    setUploading(true);
    try {
      await api.post("/hostel/mess-menu", formData, {
        headers: { "Content-Type": undefined },
      });
      setMessage("Hostel mess menu updated successfully!");
      setFile(null);
      setShowUploadModal(false);
      await loadMenus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload mess menu.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <StudentShell
      title="Campus Mess Menus"
      subtitle="Dietary & Dining"
      backTo="/dashboard/student"
      actionButton={
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#252422] hover:bg-[#eb5e28] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Upload size={14} /> Update Your Hostel Menu
        </button>
      }
    >
      <div className="space-y-6">
        {message && <Toast type="success" message={message} onClose={() => setMessage("")} />}
        {error && <Toast type="error" message={error} onClose={() => setError("")} />}

        {/* Toolbar & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[rgba(64,61,57,0.14)] shadow-xs">
          <div className="flex items-center gap-2">
            <Utensils size={18} className="text-[#eb5e28]" />
            <span className="text-xs font-bold text-[#252422]">Filter by Campus Hostel:</span>
          </div>

          <select
            value={selectedHostelId}
            onChange={(e) => setSelectedHostelId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs font-semibold text-[#252422] focus:outline-none focus:border-[#eb5e28]"
          >
            <option value="">All Available Hostels ({menus.length})</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} {h.id === user?.hostelId ? "★ (Your Hostel)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Menu Cards Gallery */}
        {loading ? (
          <SkeletonLoader type="card" count={2} />
        ) : visibleMenus.length === 0 ? (
          <EmptyState
            icon={Utensils}
            title="No mess menus uploaded yet"
            description="No official mess menus are published for the selected hostel. Students or hostel staff can upload the current weekly menu."
            actionLabel="Upload Menu"
            onAction={() => setShowUploadModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleMenus.map((menu) => {
              const isUserHostel = menu.hostel?.id === user?.hostelId;

              return (
                <article
                  key={menu.id}
                  className="group bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] shadow-sm overflow-hidden hover:shadow-lg transition-all"
                >
                  {/* Header */}
                  <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[rgba(64,61,57,0.08)] bg-[#fbfaf6]">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-[#eb5e28]" />
                        <h3 className="text-base font-bold text-[#252422] m-0">
                          {menu.hostel?.name || "Hostel"}
                        </h3>
                      </div>
                      <span className="text-[11px] text-[#756f67] block mt-0.5">
                        Uploaded on {formatDate(menu.createdAt)}
                      </span>
                    </div>

                    {isUserHostel && (
                      <Badge variant="brand" size="sm">
                        YOUR HOSTEL
                      </Badge>
                    )}
                  </div>

                  {/* Image with Zoom Overlay */}
                  <div
                    onClick={() => setPreviewMenu(menu)}
                    className="relative cursor-pointer overflow-hidden aspect-[4/3] bg-black/5 flex items-center justify-center group"
                  >
                    <img
                      src={menu.imageUrl}
                      alt={`${menu.hostel?.name} mess menu`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Hover Zoom Badge */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-4 py-2 rounded-xl bg-white text-[#252422] text-xs font-bold flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <ZoomIn size={16} /> Click to Zoom Preview
                      </span>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div className="p-3 bg-white text-center border-t border-[rgba(64,61,57,0.08)]">
                    <button
                      type="button"
                      onClick={() => setPreviewMenu(menu)}
                      className="text-xs font-bold text-[#eb5e28] hover:text-[#c94a1b] flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                    >
                      <ZoomIn size={14} /> View Full-Resolution Menu
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Zoom Preview Modal */}
      <Modal
        isOpen={Boolean(previewMenu)}
        onClose={() => setPreviewMenu(null)}
        title={previewMenu ? `${previewMenu.hostel?.name || "Hostel"} Mess Menu` : "Menu Preview"}
        size="xl"
      >
        {previewMenu && (
          <div className="space-y-4">
            <div className="relative max-h-[75vh] overflow-auto rounded-xl border border-black/10 bg-neutral-900 flex items-center justify-center p-2">
              <img
                src={previewMenu.imageUrl}
                alt="High resolution mess menu preview"
                className="max-w-full h-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#756f67]">
              <span>Published on: {formatDate(previewMenu.createdAt)}</span>
              <a
                href={previewMenu.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#eb5e28] hover:underline"
              >
                Open Original in New Tab ↗
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Menu Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Mess Menu"
        description="Upload a clean image of your weekly hostel dining schedule."
        size="md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="p-6 rounded-2xl border-2 border-dashed border-[rgba(64,61,57,0.25)] bg-[#fbfaf6] text-center">
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-[#756f67] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#252422] file:text-white hover:file:bg-[#eb5e28] cursor-pointer"
            />
            {file && (
              <p className="text-xs text-emerald-700 font-semibold mt-3 m-0">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <p className="text-[11px] text-[#756f67] m-0">
            JPG and PNG up to 5MB are supported. Uploading replaces the current menu for your hostel.
          </p>

          <div className="pt-3 border-t border-[rgba(64,61,57,0.1)] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Publish Menu"}
            </button>
          </div>
        </form>
      </Modal>
    </StudentShell>
  );
}