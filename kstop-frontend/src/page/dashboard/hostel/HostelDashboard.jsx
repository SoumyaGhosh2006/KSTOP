import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HostelShell from "../../../components/hostel/HostelShell";
import api from "../../../utils/api";

export default function HostelDashboard() {
  const [summary, setSummary] = useState({
    leaveCount: 0,
    openGrievances: 0,
    latestMenu: null,
  });

  useEffect(() => {
    async function loadSummary() {
      try {
        const response = await api.get("/hostel/summary");
        setSummary(response.data);
      } catch {
        setSummary((current) => current);
      }
    }

    loadSummary();
  }, []);

  return (
    <HostelShell title="Hostel Dashboard" eyebrow="Hostel user view">
      <section className="hostel-grid">
        <article className="hostel-card">
          <span>Leave records</span>
          <strong>{summary.leaveCount}</strong>
        </article>
        <article className="hostel-card">
          <span>Open grievances</span>
          <strong>{summary.openGrievances}</strong>
        </article>
        <article className="hostel-card">
          <span>Latest menu</span>
          <strong>{summary.latestMenu ? "Uploaded" : "None"}</strong>
        </article>
      </section>

      <section className="hostel-panel" style={{ marginTop: 16 }}>
        <h2>Quick actions</h2>
        <div className="hostel-actions">
          <Link className="hostel-button" to="/dashboard/hostel/mess-menu">
            Upload Menu
          </Link>
          <Link className="hostel-button-muted" to="/dashboard/hostel/scan-qr">
            Scan QR
          </Link>
          <Link className="hostel-button-muted" to="/dashboard/hostel/leave-records">
            View Leave Table
          </Link>
          <Link className="hostel-button-muted" to="/dashboard/hostel/grievances">
            View Grievances
          </Link>
        </div>
      </section>

      {summary.latestMenu ? (
        <section className="hostel-panel" style={{ marginTop: 16 }}>
          <h2>Current menu</h2>
          <div className="hostel-menu-preview">
            <img src={summary.latestMenu.imageUrl} alt="Latest uploaded hostel menu" />
          </div>
        </section>
      ) : null}
    </HostelShell>
  );
}
