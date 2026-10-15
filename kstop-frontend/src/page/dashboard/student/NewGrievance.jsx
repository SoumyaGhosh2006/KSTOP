import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import Toast from "../../../components/Toast";
import Badge from "../../../components/Badge";
import api from "../../../utils/api";
import {
  AlertCircle,
  Plus,
  Shield,
  FileText,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
} from "../../../components/Icons";

const CATEGORIES = [
  { value: "Water", base: 70, label: "Water Supply & RO", desc: "No water, contaminated water, dispenser issue" },
  { value: "Electrical", base: 75, label: "Electrical & Power", desc: "Outage, switches, wiring, fan/AC failure" },
  { value: "Plumbing", base: 60, label: "Plumbing & Drainage", desc: "Leakage, clogged drain, washroom taps" },
  { value: "Transport", base: 50, label: "Campus Transport", desc: "Bus schedules, campus shuttle issues" },
  { value: "Internet", base: 45, label: "WiFi & Internet", desc: "Hostel WiFi connectivity, LAN issues" },
  { value: "Cleaning", base: 40, label: "Housekeeping & Cleaning", desc: "Room cleaning, corridor garbage, pests" },
  { value: "Food", base: 55, label: "Mess & Food Quality", desc: "Food hygiene, menu shortage, kitchen clean" },
  { value: "Other", base: 30, label: "Other Campus Facility", desc: "Carpentry, security, miscellaneous issues" },
];

const SEVERITY_GROUPS = [
  {
    score: 30,
    terms: ["fire", "smoke", "gas leak", "electric shock", "sparks", "explosion", "flood", "sewage overflow", "emergency", "dangerous"],
  },
  {
    score: 20,
    terms: ["no water", "no electricity", "power outage", "blackout", "short circuit", "severe leak", "broken pipe", "unsafe", "urgent"],
  },
  {
    score: 10,
    terms: ["leak", "broken", "not working", "unusable", "infection", "dirty water", "repeated", "days", "week"],
  },
];

function calculatePriority(category, title, description) {
  const catObj = CATEGORIES.find((c) => c.value === category);
  const base = catObj ? catObj.base : 30;
  const text = `${title || ""} ${description || ""}`.toLowerCase();
  let boost = 0;
  for (const group of SEVERITY_GROUPS) {
    if (group.terms.some((term) => text.includes(term))) {
      boost += group.score;
    }
  }
  return Math.min(100, base + boost);
}

export default function NewGrievance() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const estimatedPriority = useMemo(() => {
    return calculatePriority(form.category, form.title, form.description);
  }, [form.category, form.title, form.description]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.category || !form.description.trim()) {
      setError("Please complete all required fields (Category, Headline, and Description).");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post("/grievance/create", form);
      setSuccessMsg("Grievance ticket created and dispatched to your hostel administration.");
      setTimeout(() => {
        navigate("/dashboard/student/grievances");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit grievance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentShell
      title="File a Grievance"
      subtitle="Hostel Maintenance & Facilities"
      backTo="/dashboard/student/grievances"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {error && <Toast type="error" message={error} onClose={() => setError("")} />}
        {successMsg && <Toast type="success" message={successMsg} />}

        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-[rgba(64,61,57,0.08)]">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
              Automated Ticket Dispatch
            </span>
            <h2 className="text-xl font-bold text-[#252422] m-0 mt-1">
              Submit Facility / Campus Complaint
            </h2>
            <p className="text-xs text-[#756f67] m-0 mt-1">
              Complaints are automatically routed to your hostel warden and faculty mentor with intelligent priority scoring.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Grid */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-2">
                Select Category *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CATEGORIES.map((c) => {
                  const isSelected = form.category === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, category: c.value }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#eb5e28]/10 border-[#eb5e28] shadow-xs"
                          : "bg-[#fbfaf6] border-[rgba(64,61,57,0.12)] hover:border-[#eb5e28]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong
                          className={`text-xs font-bold ${
                            isSelected ? "text-[#eb5e28]" : "text-[#252422]"
                          }`}
                        >
                          {c.label}
                        </strong>
                        <span className="text-[10px] font-mono text-[#756f67]">
                          Base {c.base}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#756f67] block leading-tight">
                        {c.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1">
                Headline / Short Summary *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. 2nd Floor Water Purifier Leaking, Floor Flooded"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1">
                Detailed Description & Location in Hostel *
              </label>
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Include room number, wing, when the issue began, and urgency details..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-xs text-[#252422] focus:outline-none focus:border-[#eb5e28] resize-none"
              />
            </div>

            {/* Priority Preview Indicator */}
            {form.category && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <Sparkles size={16} className="text-[#eb5e28]" />
                  <span>
                    Estimated Urgency Score: <strong>{estimatedPriority} / 100</strong>
                  </span>
                </div>
                <Badge
                  variant={
                    estimatedPriority >= 75
                      ? "urgent"
                      : estimatedPriority >= 55
                      ? "brand"
                      : "neutral"
                  }
                  size="sm"
                >
                  {estimatedPriority >= 75
                    ? "CRITICAL ATTENTION"
                    : estimatedPriority >= 55
                    ? "HIGH PRIORITY"
                    : "NORMAL QUEUE"}
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(64,61,57,0.1)]">
              <button
                type="button"
                onClick={() => navigate("/dashboard/student/grievances")}
                className="px-4 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] text-xs font-bold text-[#756f67] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Lodge Grievance Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </StudentShell>
  );
}
