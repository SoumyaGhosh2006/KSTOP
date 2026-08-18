import { useState } from "react";
import { Link } from "react-router-dom";
import StudentShell from "../../../components/student/StudentShell";
import api from "../../../utils/api";
import "./student-dashboard.css";

// ─────────────────────────────────────────────
//  NewLeave — "Apply for Leave" page
//
//  The page has 3 steps, all inside this one component:
//    1. "form"   → the student fills in the leave details
//    2. "review" → a summary screen to double-check everything
//    3. "done"   → success message after the request is saved
//
//  The "Review & Confirm" button moves form → review.
//  The "Confirm & Submit" button sends the data to the backend
//  (POST /api/leave) which stores it in the Leave table with the
//  status PENDING_PARENT.
// ─────────────────────────────────────────────

const STEPS = [
  // This sequence explains the approval chain from request to gate pass.
  "1 - You submit",
  "2 - Parent approves",
  "3 - Mentor approves",
  "4 - QR gate pass",
];

// The values must match the LeaveType enum in prisma/schema.prisma
// exactly, otherwise the database rejects the request.
const LEAVE_TYPES = [
  { value: "Medical", label: "Medical" },
  { value: "Vacation", label: "Vacation" },
  { value: "FamilyEmergency", label: "Family Emergency" },
  { value: "Other", label: "Other" },
];

// What the form looks like before the student types anything.
// Keeping it in one constant makes "clear the form" a one-liner.
const EMPTY_FORM = {
  type: "",
  startDate: "",
  endDate: "",
  contactNumber: "",
  place: "",
  purpose: "",
  arrivalDetails: "",
};

// Checks the form and returns a list of human-readable problems.
// An empty list means the form is ready for the review step.
function validateForm(form) {
  const problems = [];

  if (!form.type) problems.push("Choose a leave type.");
  if (!form.startDate) problems.push("Choose a start date.");
  if (!form.endDate) problems.push("Choose an end date.");
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    problems.push("The end date cannot be before the start date.");
  }
  if (!form.contactNumber.trim()) problems.push("Enter your contact number.");
  if (!form.place.trim()) problems.push("Enter the place you are going to.");
  if (!form.purpose.trim()) problems.push("Write a short purpose for the leave.");

  return problems;
}

export default function NewLeave() {
  // step: which of the 3 screens is visible right now
  const [step, setStep] = useState("form");
  // form: everything the student has typed so far
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // One shared onChange handler for every input/textarea/select.
  // It reads the input's "name" attribute and updates that one key.
  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // "Review & Confirm" — validate first, only then show the summary.
  function goToReview() {
    const problems = validateForm(form);
    if (problems.length) {
      setError(problems.join(" "));
      return;
    }
    setError("");
    setStep("review");
  }

  // "Confirm & Submit" — send the request to the backend.
  async function submitLeave() {
    setError("");
    setIsSubmitting(true);

    try {
      await api.post("/leave", form);
      setStep("done");
    } catch (submitError) {
      // The backend sends a readable message (e.g. "mentor not registered")
      // — show exactly that so the student knows what to fix.
      setError(submitError.response?.data?.message || "Could not submit the leave request. Please try again.");
      setStep("form"); // back to the form so nothing is lost
    } finally {
      setIsSubmitting(false);
    }
  }

  // "Apply for another leave" on the success screen.
  function resetForm() {
    setForm(EMPTY_FORM);
    setError("");
    setStep("form");
  }

  return (
    <StudentShell title="Apply for Leave" backTo="/dashboard/student">
      {/* Progress chips show where the student is in the leave approval flow. */}
      <section className="student-progress-row" aria-label="Leave approval flow">
        {STEPS.map((stepLabel, index) => (
          <div key={stepLabel} className={`student-progress-chip${index === 0 ? " is-active" : ""}`}>
            {stepLabel}
          </div>
        ))}
      </section>

      {/* ── STEP 1: the form ── */}
      {step === "form" ? (
        <section className="student-form-card">
          <div className="student-form-grid" style={{ padding: "16px" }}>
            {/* A dropdown (not free text) so the value always matches
                the LeaveType enum the database expects. */}
            <select className="student-select" name="type" value={form.type} onChange={updateForm}>
              <option value="">Leave type *</option>
              {LEAVE_TYPES.map((leaveType) => (
                <option key={leaveType.value} value={leaveType.value}>
                  {leaveType.label}
                </option>
              ))}
            </select>

            {/* type="date" opens the browser's calendar picker and
                always stores the date as YYYY-MM-DD — no format confusion. */}
            <input
              className="student-input"
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={updateForm}
              aria-label="Start date"
            />
            <input
              className="student-input"
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={updateForm}
              aria-label="End date"
            />
            <input
              className="student-input"
              name="contactNumber"
              value={form.contactNumber}
              onChange={updateForm}
              placeholder="Contact number *"
            />
            <input
              className="student-input student-full-width"
              name="place"
              value={form.place}
              onChange={updateForm}
              placeholder="Place *"
            />
            <textarea
              className="student-textarea student-full-width"
              name="purpose"
              value={form.purpose}
              onChange={updateForm}
              placeholder="Purpose - short text area *"
            />
            <textarea
              className="student-textarea student-full-width"
              name="arrivalDetails"
              value={form.arrivalDetails}
              onChange={updateForm}
              placeholder="Arrival details (optional) - text area"
            />
          </div>
        </section>
      ) : null}

      {/* ── STEP 2: review the details before sending ── */}
      {step === "review" ? (
        <section className="student-form-card">
          <div className="student-form-grid" style={{ padding: "16px" }}>
            {/* Read-only summary. Each row reuses student-input so it
                looks like the form but cannot be edited here. */}
            <input className="student-input" value={`Leave type: ${form.type}`} readOnly />
            <input className="student-input" value={`Contact: ${form.contactNumber}`} readOnly />
            <input className="student-input" value={`From: ${form.startDate}`} readOnly />
            <input className="student-input" value={`To: ${form.endDate}`} readOnly />
            <input className="student-input student-full-width" value={`Place: ${form.place}`} readOnly />
            <textarea className="student-textarea student-full-width" value={`Purpose: ${form.purpose}`} readOnly />
            {form.arrivalDetails ? (
              <textarea
                className="student-textarea student-full-width"
                value={`Arrival details: ${form.arrivalDetails}`}
                readOnly
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── STEP 3: success ── */}
      {step === "done" ? (
        <section className="student-form-card">
          <div style={{ padding: "16px" }}>
            <p className="student-note">
              Your leave request has been submitted. It is now waiting for your parent's approval.
              You can track it on the My Leaves page.
            </p>
          </div>
        </section>
      ) : null}

      {/* Buttons change depending on the step. */}
      <div className="student-action-row">
        {step === "form" ? (
          <>
            <button type="button" className="student-primary-button" onClick={goToReview}>
              Review & Confirm
            </button>
            <Link to="/dashboard/student" className="student-secondary-button">
              Cancel
            </Link>
          </>
        ) : null}

        {step === "review" ? (
          <>
            <button
              type="button"
              className="student-primary-button"
              onClick={submitLeave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </button>
            <button type="button" className="student-secondary-button" onClick={() => setStep("form")}>
              Back to Edit
            </button>
          </>
        ) : null}

        {step === "done" ? (
          <>
            <Link to="/dashboard/student/leaves" className="student-primary-button">
              Go to My Leaves
            </Link>
            <button type="button" className="student-secondary-button" onClick={resetForm}>
              Apply for Another Leave
            </button>
          </>
        ) : null}
      </div>

      {/* Any validation or server error shows up here in plain words. */}
      {error ? <p className="student-note" style={{ color: "#b3261e" }}>{error}</p> : null}
    </StudentShell>
  );
}
