import { useEffect, useMemo, useState } from "react";
import HostelShell from "../../../components/hostel/HostelShell";
import api from "../../../utils/api";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("kstop_user"));
  } catch {
    return null;
  }
}

export default function MessFeedback() {
  const [menus, setMenus] = useState([]);
  const [error, setError] = useState("");
  const user = readStoredUser();

  useEffect(() => {
    async function loadMenus() {
      try {
        // Reuses the same GET /hostel/mess-menus endpoint the student
        // page already uses — it already includes each menu's
        // foodRatings, so no new backend route was needed for this.
        const res = await api.get("/hostel/mess-menus");
        setMenus(res.data.menus);
      } catch {
        setError("Could not load mess feedback.");
      }
    }
    loadMenus();
  }, []);

  // Only show THIS hostel's own menus — a warden shouldn't see
  // other hostels' feedback, matching the isolation rule used
  // everywhere else in this app.
  const ownMenus = useMemo(
    () => menus.filter((menu) => menu.hostel.id === user?.assignedHostelId),
    [menus, user]
  );

  return (
    <HostelShell title="Mess Feedback" eyebrow="Ratings for your hostel only">
      {error ? <p className="hostel-error">{error}</p> : null}

      {ownMenus.map((menu) => {
        const count = menu.foodRatings.length;
        const average = count > 0
          ? (menu.foodRatings.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
          : null;
        const color = average === null ? "#8a8378" : average < 2.5 ? "#d34c3f" : average < 3.5 ? "#c98a1f" : "#2d8b53";

        return (
          <section key={menu.id} className="hostel-panel" style={{ marginBottom: 16 }}>
            <h2>{new Date(menu.createdAt).toLocaleDateString()} menu</h2>
            <p style={{ fontSize: 28, fontWeight: 700, color }}>
              {average ?? "No ratings yet"} {average ? "★" : ""}
            </p>
            <p className="hostel-note">{count} student{count === 1 ? "" : "s"} rated this menu</p>
          </section>
        );
      })}

      {!ownMenus.length ? (
        <section className="hostel-panel">
          <p className="hostel-note">No menu uploaded for your hostel yet — upload one first, then ratings will appear here.</p>
        </section>
      ) : null}
    </HostelShell>
  );
}