import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HostelShell from "../../../components/hostel/HostelShell";
import api from "../../../utils/api";

export default function HostelDashboard() {
  const [summary, setSummary] = useState({ leaveCount: 0, openGrievances: 0, latestMenu: null });

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
    <HostelShell title="Hostel Dashboard" eyebrow="Operations overview">
      <div className="hostel-dashboard-v2">
        <section className="hostel-command-header">
          <div><span className="hostel-eyebrow">Hostel operations</span><h2>Your daily control surface.</h2><p>Monitor the current hostel state here. Scanning, menu uploads, leave records and grievance handling stay in their dedicated workflows.</p></div>
          <div className="hostel-command-mark"><span>HOSTEL</span><strong>LIVE</strong></div>
        </section>

        <section className="hostel-metric-grid">
          <article className="hostel-card hostel-metric-card"><span>Leave records</span><strong>{summary.leaveCount}</strong><small>Recorded through the hostel workflow</small></article>
          <article className={"hostel-card hostel-metric-card" + (summary.openGrievances ? " is-alert" : "")}><span>Open grievances</span><strong>{summary.openGrievances}</strong><small>{summary.openGrievances ? "Needs operational attention" : "No open issues reported"}</small></article>
          <article className="hostel-card hostel-metric-card"><span>Current menu</span><strong>{summary.latestMenu ? "Ready" : "None"}</strong><small>{summary.latestMenu ? "A menu is available to review" : "No menu has been uploaded yet"}</small></article>
        </section>

        <section className="hostel-dashboard-columns">
          <article className="hostel-panel hostel-dashboard-panel">
            <div className="hostel-panel-heading"><div><span className="hostel-eyebrow">Operations map</span><h2>What needs attention?</h2></div></div>
            <div className="hostel-operations-list">
              <div><span className="hostel-operation-index">01</span><div><strong>Leave verification</strong><p>{summary.leaveCount} records currently stored.</p></div><Link to="/dashboard/hostel/leave-records">Open</Link></div>
              <div><span className="hostel-operation-index">02</span><div><strong>Grievance queue</strong><p>{summary.openGrievances ? summary.openGrievances + " active issue" + (summary.openGrievances === 1 ? "" : "s") + "." : "Queue is currently clear."}</p></div><Link to="/dashboard/hostel/grievances">Open</Link></div>
              <div><span className="hostel-operation-index">03</span><div><strong>Gate scanning</strong><p>Verify approved leave QR passes.</p></div><Link to="/dashboard/hostel/scan-qr">Open</Link></div>
              <div><span className="hostel-operation-index">04</span><div><strong>Mess menu</strong><p>{summary.latestMenu ? "Current menu is available." : "Upload the first current menu."}</p></div><Link to="/dashboard/hostel/mess-menu">Open</Link></div>
            </div>
          </article>

          <article className="hostel-panel hostel-dashboard-panel">
            <div className="hostel-panel-heading"><div><span className="hostel-eyebrow">Current menu</span><h2>{summary.latestMenu ? "Latest upload" : "No menu yet"}</h2></div></div>
            {summary.latestMenu ? <div className="hostel-dashboard-menu"><img src={summary.latestMenu.imageUrl} alt="Latest uploaded hostel menu" /></div> : <div className="hostel-dashboard-empty"><strong>Nothing uploaded yet.</strong><span>The menu preview will appear here after the first upload.</span></div>}
          </article>
        </section>

        <p className="hostel-dashboard-note">The dashboard is a monitoring surface. Use the sidebar for the actual hostel operations.</p>
      </div>
    </HostelShell>
  );
}
