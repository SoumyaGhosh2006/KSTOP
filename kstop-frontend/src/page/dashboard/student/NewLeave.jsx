import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import Toast from "../../../components/Toast";
import Badge from "../../../components/Badge";
import api from "../../../utils/api";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Shield,
  FileText,
  MapPin,
  Phone,
  AlertCircle,
} from "../../../components/Icons";

const LEAVE_TYPES = [
  { value: "Medical", label: "Medical Leave", desc: "Illness, medical checkup or doctor visit" },
  { value: "Vacation", label: "Vacation / Home Visit", desc: "Scheduled holiday, festival, or home visit" },
  { value: "FamilyEmergency", label: "Family Emergency", desc: "Urgent family event requiring immediate departure" },
  { value: "Other", label: "Other Purpose", desc: "Co-curricular events, external exams or personal leave" },
];

const FLOW_STEPS = [
  { step: 1, title: "Submit Request", desc: "Student application" },
  { step: 2, title: "Parent Approval", desc: "Parent endorsement" },
  { step: 3, title: "Mentor Decision", desc: "Faculty review" },
  { step: 4, title: "Gate Pass Ready", desc: "Official QR pass" },
];

export default function NewLeave() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1: Fill Form, 2: Review & Confirm, 3: Success
  const [form, setForm] = useState({
    type: "",
    startDate: "",
    endDate: "",
    contactNumber: "",
    place: "",
    purpose: "",
    arrivalDetails: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLeave, setCreatedLeave] = useState(null);

  // Today's minimum date in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError("");
  }

  function validate() {
    const errs = {};
    if (!form.type) errs.type = "Please select a leave category.";
    if (!form.startDate) errs.startDate = "Start date is required.";
    if (!form.endDate) errs.endDate = "End date is required.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = "End date cannot be earlier than start date.";
    }
    if (!form.contactNumber.trim()) {
      errs.contactNumber = "Emergency contact phone is required.";
    } else if (!/^[0-9+ -]{7,15}$/.test(form.contactNumber.trim())) {
      errs.contactNumber = "Enter a valid phone number.";
    }
    if (!form.place.trim()) errs.place = "Destination place/address is required.";
    if (!form.purpose.trim()) errs.purpose = "Detailed purpose is required.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleGoToReview(e) {
    e.preventDefault();
    if (validate()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setServerError("");

    try {
      const res = await api.post("/leave", form);
      setCreatedLeave(res.data.leave);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Failed to submit leave request. Please check your inputs and try again."
      );
      setCurrentStep(1);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <StudentShell
      title="Apply for Leave"
      subtitle="Leave Management"
      backTo="/dashboard/student"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Dynamic Approval Stepper */}
        <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-4 sm:p-6 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FLOW_STEPS.map((s) => {
              const isActive = currentStep === s.step;
              const isPast = currentStep > s.step;

              return (
                <div
                  key={s.step}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive
                      ? "bg-[#eb5e28]/10 border-[#eb5e28] text-[#252422]"
                      : isPast
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-[#fbfaf6] border-[rgba(64,61,57,0.1)] text-[#756f67]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        isActive
                          ? "bg-[#eb5e28] text-white"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-black/10 text-[#756f67]"
                      }`}
                    >
                      {isPast ? "✓" : s.step}
                    </span>
                    <strong className="text-xs font-bold">{s.title}</strong>
                  </div>
                  <span className="text-[10px] block opacity-80 pl-8">{s.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Server Error Toast */}
        {serverError && (
          <Toast type="error" message={serverError} onClose={() => setServerError("")} />
        )}

        {/* STEP 1: Form Fill */}
        {currentStep === 1 && (
          <form
            onSubmit={handleGoToReview}
            className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div>
              <h3 className="text-lg font-bold text-[#252422] m-0">Leave Details</h3>
              <p className="text-xs text-[#756f67] m-0 mt-1">
                Provide accurate information. Once submitted, your parent will receive a notification to approve.
              </p>
            </div>

            {/* Leave Type Selector Cards */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-2">
                Leave Category *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEAVE_TYPES.map((lt) => (
                  <label
                    key={lt.value}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                      form.type === lt.value
                        ? "bg-[#eb5e28]/10 border-[#eb5e28] shadow-xs"
                        : "bg-[#fbfaf6] border-[rgba(64,61,57,0.12)] hover:border-[#eb5e28]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={lt.value}
                      checked={form.type === lt.value}
                      onChange={handleChange}
                      className="mt-1 accent-[#eb5e28]"
                    />
                    <div>
                      <strong className="text-xs font-bold text-[#252422] block">
                        {lt.label}
                      </strong>
                      <span className="text-[11px] text-[#756f67] block mt-0.5 leading-snug">
                        {lt.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.type && <p className="text-xs text-rose-600 mt-1.5 m-0 font-medium">{errors.type}</p>}
            </div>

            {/* Date Range with Guards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                  Start Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="startDate"
                    min={todayStr}
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-sm text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white transition-all"
                  />
                </div>
                {errors.startDate && (
                  <p className="text-xs text-rose-600 mt-1 m-0 font-medium">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                  End Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="endDate"
                    min={form.startDate || todayStr}
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-sm text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white transition-all"
                  />
                </div>
                {errors.endDate && (
                  <p className="text-xs text-rose-600 mt-1 m-0 font-medium">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Contact & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                  Contact Phone During Leave *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-sm text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white transition-all"
                />
                {errors.contactNumber && (
                  <p className="text-xs text-rose-600 mt-1 m-0 font-medium">{errors.contactNumber}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                  Destination Place / City *
                </label>
                <input
                  type="text"
                  name="place"
                  value={form.place}
                  onChange={handleChange}
                  placeholder="e.g. Cuttack, Home address, Hospital"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-sm text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white transition-all"
                />
                {errors.place && (
                  <p className="text-xs text-rose-600 mt-1 m-0 font-medium">{errors.place}</p>
                )}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                Purpose of Leave *
              </label>
              <textarea
                name="purpose"
                rows={3}
                value={form.purpose}
                onChange={handleChange}
                placeholder="Briefly state the reason for leaving campus..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-sm text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white transition-all resize-y"
              />
              {errors.purpose && (
                <p className="text-xs text-rose-600 mt-1 m-0 font-medium">{errors.purpose}</p>
              )}
            </div>

            {/* Arrival Details (optional) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#403d39] block mb-1.5">
                Arrival / Return Travel Details <span className="text-[#756f67] lowercase font-normal">(optional)</span>
              </label>
              <input
                type="text"
                name="arrivalDetails"
                value={form.arrivalDetails}
                onChange={handleChange}
                placeholder="e.g. Flight 6E-204 arriving at 8:30 PM, Train No 12801"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-[#fbfaf6] text-sm text-[#252422] focus:outline-none focus:border-[#eb5e28] focus:bg-white transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[rgba(64,61,57,0.1)] flex items-center justify-between gap-4">
              <Link
                to="/dashboard/student"
                className="px-4 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white hover:bg-black/5 text-[#252422] text-xs font-bold transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span>Review & Confirm</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Review Screen */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="pb-4 border-b border-[rgba(64,61,57,0.1)]">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                Step 2 of 3
              </span>
              <h3 className="text-xl font-bold text-[#252422] m-0">Review Your Leave Request</h3>
              <p className="text-xs text-[#756f67] m-0 mt-1">
                Please verify all details before submitting. An SMS/Notification will be triggered to your parent.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.1)] text-xs">
              <div>
                <span className="text-[#756f67] block uppercase font-bold text-[10px]">Leave Type</span>
                <strong className="text-[#252422] text-sm font-bold block mt-0.5">{form.type} Leave</strong>
              </div>
              <div>
                <span className="text-[#756f67] block uppercase font-bold text-[10px]">Destination Place</span>
                <strong className="text-[#252422] text-sm font-bold block mt-0.5">{form.place}</strong>
              </div>
              <div>
                <span className="text-[#756f67] block uppercase font-bold text-[10px]">Start Date</span>
                <strong className="text-[#252422] text-sm block mt-0.5">{form.startDate}</strong>
              </div>
              <div>
                <span className="text-[#756f67] block uppercase font-bold text-[10px]">End Date</span>
                <strong className="text-[#252422] text-sm block mt-0.5">{form.endDate}</strong>
              </div>
              <div>
                <span className="text-[#756f67] block uppercase font-bold text-[10px]">Emergency Phone</span>
                <strong className="text-[#252422] text-sm font-mono block mt-0.5">{form.contactNumber}</strong>
              </div>
              <div>
                <span className="text-[#756f67] block uppercase font-bold text-[10px]">Arrival Details</span>
                <span className="text-[#252422] text-xs block mt-0.5">{form.arrivalDetails || "None provided"}</span>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-[rgba(64,61,57,0.08)]">
                <span className="text-[#756f67] block uppercase font-bold text-[10px]">Purpose</span>
                <p className="text-[#252422] text-xs italic m-0 mt-1 leading-relaxed">
                  "{form.purpose}"
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <Shield size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Two-tier authorization note:</strong> Your leave request will first transition to{" "}
                <span className="font-bold underline">Pending Parent Approval</span>. After your parent endorses it, it
                will route to your assigned Faculty Mentor for final QR Gate Pass issuance.
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(64,61,57,0.1)] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white hover:bg-black/5 text-[#252422] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Submitting Request..." : "Confirm & Submit Request"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-md text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 block mb-1">
                Submission Successful
              </span>
              <h2 className="text-2xl font-black text-[#252422] m-0">Leave Request Dispatched</h2>
              <p className="text-xs text-[#756f67] max-w-md mx-auto m-0 mt-2">
                Your request has been recorded in the central K-STOP ledger. Your parent has been notified to provide
                endorsement.
              </p>
            </div>

            {createdLeave && (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-[#fbfaf6] border border-[rgba(64,61,57,0.1)] text-left text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-[rgba(64,61,57,0.08)]">
                  <span className="text-[#756f67]">Status:</span>
                  <Badge variant="pending_parent" dot>
                    PENDING PARENT
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#756f67]">Period:</span>
                  <strong>
                    {createdLeave.startDate?.slice(0, 10)} to {createdLeave.endDate?.slice(0, 10)}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#756f67]">Destination:</span>
                  <strong>{createdLeave.place}</strong>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard/student/leaves"
                className="px-5 py-2.5 rounded-xl bg-[#252422] hover:bg-black text-white text-xs font-bold transition-all shadow-sm"
              >
                View in My Leaves
              </Link>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    type: "",
                    startDate: "",
                    endDate: "",
                    contactNumber: "",
                    place: "",
                    purpose: "",
                    arrivalDetails: "",
                  });
                  setCurrentStep(1);
                }}
                className="px-4 py-2.5 rounded-xl border border-[rgba(64,61,57,0.2)] bg-white hover:bg-black/5 text-[#252422] text-xs font-semibold transition-all"
              >
                Apply for Another Leave
              </button>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
