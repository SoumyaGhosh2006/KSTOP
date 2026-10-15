import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import HostelShell from "../../../components/hostel/HostelShell";
import Badge from "../../../components/Badge";
import Modal from "../../../components/Modal";
import EmptyState from "../../../components/EmptyState";
import SkeletonLoader from "../../../components/SkeletonLoader";
import Toast from "../../../components/Toast";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  User,
  Calendar,
  Phone,
  Sliders,
  X,
} from "../../../components/Icons";

const EMPTY_FORM = {
  studentName: "",
  rollNumber: "",
  contactNumber: "",
  parentsPhoneNumber: "",
  mentorName: "",
  leaveStartDate: "",
  leaveEndDate: "",
  approved: true,
};

export default function HostelLeaveRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all"); // 'all' | 'qr' | 'manual'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'approved' | 'unapproved'

  const [toast, setToast] = useState(null);

  async function loadRecords() {
    setLoading(true);
    try {
      const response = await api.get("/hostel/leave-records");
      setRecords(response.data.records || []);
    } catch {
      setToast({
        type: "error",
        message: "Could not retrieve leave records from the database.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  function updateForm(e) {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleAddRecord(e) {
    e.preventDefault();
    if (!form.studentName.trim() || !form.rollNumber.trim()) {
      setToast({ type: "error", message: "Student Name and Roll Number are required." });
      return;
    }
    if (!form.contactNumber.trim()) {
      setToast({ type: "error", message: "Student Contact Phone Number is required." });
      return;
    }
    if (!form.parentsPhoneNumber.trim()) {
      setToast({ type: "error", message: "Parent / Guardian Contact Phone Number is required." });
      return;
    }
    if (!form.mentorName.trim()) {
      setToast({ type: "error", message: "Faculty Mentor Name is required." });
      return;
    }
    if (!form.leaveStartDate || !form.leaveEndDate) {
      setToast({ type: "error", message: "Please specify both Start and End leave dates." });
      return;
    }
    if (new Date(form.leaveEndDate) < new Date(form.leaveStartDate)) {
      setToast({ type: "error", message: "End Date cannot be earlier than Start Date." });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/hostel/leave-records", form);
      setForm(EMPTY_FORM);
      setShowAddModal(false);
      setToast({ type: "success", message: "Leave record successfully added to ledger." });
      await loadRecords();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Could not create manual leave record.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSelected() {
    if (!selectedIds.length) return;
    setIsDeleting(true);
    try {
      await api.delete("/hostel/leave-records", { data: { ids: selectedIds } });
      setToast({
        type: "success",
        message: `Successfully deleted ${selectedIds.length} leave record(s).`,
      });
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      await loadRecords();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.message || "Could not delete selected records.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesSearch =
        !searchTerm.trim() ||
        rec.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.mentorName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource =
        sourceFilter === "all" ||
        (sourceFilter === "qr" ? rec.source === "qr" : rec.source !== "qr");

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" ? rec.approved : !rec.approved);

      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [records, searchTerm, sourceFilter, statusFilter]);

  const allFilteredSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.includes(r.id));

  function toggleRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredRecords.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const combined = new Set([...selectedIds, ...filteredRecords.map((r) => r.id)]);
      setSelectedIds(Array.from(combined));
    }
  }

  return (
    <HostelShell
      title="Leave Records Ledger"
      eyebrow="Scanned Passes & Verified Departures"
      backTo="/dashboard/hostel"
      actionButton={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl border border-[rgba(64,61,57,0.15)] bg-white hover:bg-[#f5f0e5] text-[#252422] transition-colors cursor-pointer"
            title="Print Ledger"
            aria-label="Print Ledger"
          >
            <Printer size={15} />
          </button>
          <button
            type="button"
            onClick={loadRecords}
            className="p-2 rounded-xl border border-[rgba(64,61,57,0.15)] bg-white hover:bg-[#f5f0e5] text-[#252422] transition-colors cursor-pointer"
            title="Refresh Ledger"
            aria-label="Refresh Ledger"
          >
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={15} /> Add Record Manually
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

        {/* Filter & Command Control Toolbar */}
        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#756f67]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, roll number, or mentor..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#756f67] hover:text-[#252422]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Source filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              >
                <option value="all">All Sources</option>
                <option value="qr">QR Scans Only</option>
                <option value="manual">Manual Entries</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="unapproved">Unapproved</option>
              </select>
            </div>
          </div>

          {/* Bulk Selection Notification Bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#252422] text-[#fffcf2] text-xs font-semibold animate-in fade-in duration-150">
              <span className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#eb5e28] text-white font-mono font-bold text-[11px]">
                  {selectedIds.length}
                </span>{" "}
                record(s) selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2.5 py-1 rounded-lg text-white/70 hover:text-white transition-colors"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 size={13} /> Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leave Records Table */}
        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader type="table" count={5} />
            </div>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No leave records match"
              description={
                searchTerm || sourceFilter !== "all" || statusFilter !== "all"
                  ? "Try clearing your filters or search keyword."
                  : "No gate passes or manual leave entries have been recorded yet."
              }
              actionLabel="Add Manual Record"
              onAction={() => setShowAddModal(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] text-[#756f67] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleAll}
                        aria-label="Select all records"
                        className="rounded border-[rgba(64,61,57,0.3)] text-[#eb5e28] focus:ring-[#eb5e28] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Student & Roll No</th>
                    <th className="py-3 px-4">Leave Duration</th>
                    <th className="py-3 px-4">Contacts</th>
                    <th className="py-3 px-4">Mentor</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(64,61,57,0.08)]">
                  {filteredRecords.map((record) => {
                    const isSelected = selectedIds.includes(record.id);
                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors hover:bg-[#fffcf2]/60 ${
                          isSelected ? "bg-[#eb5e28]/5" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(record.id)}
                            aria-label={`Select ${record.studentName}`}
                            className="rounded border-[rgba(64,61,57,0.3)] text-[#eb5e28] focus:ring-[#eb5e28] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          <div className="font-bold text-[#252422]">{record.studentName}</div>
                          <span className="font-mono text-[#756f67] text-[11px]">
                            {record.rollNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#403d39]">
                          <div className="font-semibold">
                            {formatDate(record.leaveStartDate)} → {formatDate(record.leaveEndDate)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#756f67]">
                          <div>Student: {record.contactNumber || "—"}</div>
                          <div>Parent: {record.parentsPhoneNumber || "—"}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#403d39] font-medium">
                          {record.mentorName || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={record.source === "qr" ? "brand" : "neutral"}
                            size="sm"
                          >
                            {record.source === "qr" ? "QR Scanned" : "Manual"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={record.approved ? "approved" : "rejected"}
                            size="sm"
                            dot
                          >
                            {record.approved ? "Approved" : "Unapproved"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Manual Add Record Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Leave Record Manually"
        description="Record a student's departure when digital QR scan is bypassed with authorized permissions."
        size="lg"
      >
        <form onSubmit={handleAddRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-[#756f67] uppercase tracking-wider block mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                name="studentName"
                value={form.studentName}
                onChange={updateForm}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#756f67] uppercase tracking-wider block mb-1">
                University Roll No *
              </label>
              <input
                type="text"
                name="rollNumber"
                value={form.rollNumber}
                onChange={updateForm}
                placeholder="e.g. 21051234"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#756f67] uppercase tracking-wider block mb-1">
                Student Contact Number *
              </label>
              <input
                type="text"
                name="contactNumber"
                value={form.contactNumber}
                onChange={updateForm}
                placeholder="10-digit mobile number"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#756f67] uppercase tracking-wider block mb-1">
                Parents Phone Number *
              </label>
              <input
                type="text"
                name="parentsPhoneNumber"
                value={form.parentsPhoneNumber}
                onChange={updateForm}
                placeholder="Emergency guardian contact"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#756f67] uppercase tracking-wider block mb-1">
                Faculty Mentor Name *
              </label>
              <input
                type="text"
                name="mentorName"
                value={form.mentorName}
                onChange={updateForm}
                placeholder="Assigned faculty mentor"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2.5 text-xs font-bold text-[#252422] cursor-pointer">
                <input
                  type="checkbox"
                  name="approved"
                  checked={form.approved}
                  onChange={updateForm}
                  className="rounded border-[rgba(64,61,57,0.3)] text-[#eb5e28] focus:ring-[#eb5e28]"
                />
                Mark as Approved & Verified Departure
              </label>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#756f67] uppercase tracking-wider block mb-1">
                Leave Start Date *
              </label>
              <input
                type="date"
                name="leaveStartDate"
                value={form.leaveStartDate}
                onChange={updateForm}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#756f67] uppercase tracking-wider block mb-1">
                Leave End Date *
              </label>
              <input
                type="date"
                name="leaveEndDate"
                value={form.leaveEndDate}
                onChange={updateForm}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(64,61,57,0.1)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white text-[#252422] text-xs font-bold hover:bg-[#f5f0e5] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Add to Leave Ledger"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Deletion"
        description="Are you sure you want to permanently delete the selected leave records? This action cannot be reverted."
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              You are about to delete <strong>{selectedIds.length}</strong> record(s) from the hostel ledger.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white text-[#252422] text-xs font-bold hover:bg-[#f5f0e5] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDeleteSelected}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </HostelShell>
  );
}
