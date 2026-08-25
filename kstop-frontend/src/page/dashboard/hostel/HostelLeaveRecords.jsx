import { useEffect, useMemo, useState } from "react";
import HostelShell from "../../../components/hostel/HostelShell";
import api from "../../../utils/api";

const EMPTY_FORM = {
  studentName: "",
  rollNumber: "",
  contactNumber: "",
  leaveStartDate: "",
  leaveEndDate: "",
  parentsPhoneNumber: "",
  mentorName: "",
  approved: true,
};

/**
 * Formats a date value for display using the Indian locale.
 * @param {*} value - The date value to format.
 * @return {string} The formatted date, or "-" when no value is provided.
 */
function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Displays and manages hostel leave records, including manual entry and bulk deletion.
 * @returns {JSX.Element} The hostel leave-record management page.
 */
export default function HostelLeaveRecords() {
  const [records, setRecords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const allSelected = useMemo(
    () => records.length > 0 && selectedIds.length === records.length,
    [records.length, selectedIds.length]
  );

  async function loadRecords() {
    try {
      const response = await api.get("/hostel/leave-records");
      setRecords(response.data.records);
    } catch {
      setError("Could not load leave records.");
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  function updateForm(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function addRecord(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.post("/hostel/leave-records", form);
      setForm(EMPTY_FORM);
      setMessage("Leave row added.");
      await loadRecords();
    } catch (addError) {
      setError(addError.response?.data?.message || "Could not add leave row.");
    }
  }

  async function deleteSelectedRows() {
    setError("");
    setMessage("");

    try {
      await api.delete("/hostel/leave-records", { data: { ids: selectedIds } });
      setSelectedIds([]);
      setMessage("Selected rows deleted.");
      await loadRecords();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Could not delete selected rows.");
    }
  }

  function toggleRow(recordId) {
    setSelectedIds((current) =>
      current.includes(recordId)
        ? current.filter((id) => id !== recordId)
        : [...current, recordId]
    );
  }

  function toggleAllRows() {
    setSelectedIds(allSelected ? [] : records.map((record) => record.id));
  }

  return (
    <HostelShell title="Leave Data" eyebrow="Scanned and manual entries">
      <section className="hostel-panel">
        <h2>Manual add</h2>
        <form className="hostel-form-grid" onSubmit={addRecord}>
          <input className="hostel-input" name="studentName" value={form.studentName} onChange={updateForm} placeholder="Student name" />
          <input className="hostel-input" name="rollNumber" value={form.rollNumber} onChange={updateForm} placeholder="Roll no" />
          <input className="hostel-input" name="contactNumber" value={form.contactNumber} onChange={updateForm} placeholder="Contact number" />
          <input className="hostel-input" name="parentsPhoneNumber" value={form.parentsPhoneNumber} onChange={updateForm} placeholder="Parents phone number" />
          <input className="hostel-input" name="mentorName" value={form.mentorName} onChange={updateForm} placeholder="Mentor name" />
          <label className="hostel-input" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" name="approved" checked={form.approved} onChange={updateForm} />
            Approved
          </label>
          <input className="hostel-input" type="date" name="leaveStartDate" value={form.leaveStartDate} onChange={updateForm} />
          <input className="hostel-input" type="date" name="leaveEndDate" value={form.leaveEndDate} onChange={updateForm} />
          <div className="hostel-actions hostel-full">
            <button type="submit" className="hostel-button">Add Row</button>
            <button
              type="button"
              className="hostel-danger-button"
              disabled={!selectedIds.length}
              onClick={deleteSelectedRows}
            >
              Delete Selected
            </button>
          </div>
        </form>
        {message ? <p className="hostel-success">{message}</p> : null}
        {error ? <p className="hostel-error">{error}</p> : null}
      </section>

      <section className="hostel-panel" style={{ marginTop: 16 }}>
        <h2>Leave table</h2>
        <div className="hostel-table-wrap">
          <table className="hostel-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allSelected} onChange={toggleAllRows} aria-label="Select all rows" />
                </th>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Contact Number</th>
                <th>Leave Start</th>
                <th>Leave End</th>
                <th>Parents Phone</th>
                <th>Mentor Name</th>
                <th>Approved</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record.id)}
                      onChange={() => toggleRow(record.id)}
                      aria-label={`Select ${record.studentName}`}
                    />
                  </td>
                  <td>{record.studentName}</td>
                  <td>{record.rollNumber}</td>
                  <td>{record.contactNumber}</td>
                  <td>{formatDate(record.leaveStartDate)}</td>
                  <td>{formatDate(record.leaveEndDate)}</td>
                  <td>{record.parentsPhoneNumber}</td>
                  <td>{record.mentorName}</td>
                  <td>
                    <span className={`hostel-pill ${record.approved ? "is-ok" : "is-alert"}`}>
                      {record.approved ? "True" : "False"}
                    </span>
                  </td>
                </tr>
              ))}
              {!records.length ? (
                <tr>
                  <td colSpan="9">No leave records stored yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </HostelShell>
  );
}
