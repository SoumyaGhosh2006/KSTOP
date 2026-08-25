import { useEffect, useMemo, useState } from "react";
import StudentShell from "../../../components/student/StudentShell";
import api from "../../../utils/api";
import "./student-dashboard.css";

/**
 * Reads the stored user data from local storage.
 * @return {Object|null} The parsed user data, or `null` if it cannot be parsed.
 */
function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("kstop_user"));
  } catch {
    return null;
  }
}

/**
 * Display hostel mess menus with hostel filtering and ratings for the student's hostel.
 * @returns {JSX.Element} The mess menu view.
 */
export default function MessMenu() {
  const [menus, setMenus] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const user = readStoredUser();
  const hostels = useMemo(() => {
    const map = new Map();
    menus.forEach((menu) => map.set(menu.hostel.id, menu.hostel));
    return Array.from(map.values());
  }, [menus]);

  const visibleMenus = selectedHostelId
    ? menus.filter((menu) => menu.hostel.id === selectedHostelId)
    : menus;

  useEffect(() => {
    async function loadMenus() {
      try {
        const response = await api.get("/hostel/mess-menus");
        setMenus(response.data.menus);
      } catch {
        setError("Could not load hostel menus.");
      }
    }

    loadMenus();
  }, []);

  async function rateMenu(menuId, rating) {
    setError("");
    setMessage("");

    try {
      await api.post(`/hostel/mess-menus/${menuId}/rate`, { rating });
      setMessage("Your menu rating has been saved.");
    } catch (ratingError) {
      setError(ratingError.response?.data?.message || "Could not save rating.");
    }
  }

  return (
    <StudentShell title="Mess Menu" backTo="/dashboard/student">
      <div className="student-toolbar">
        <select
          className="student-input student-hostel-select"
          value={selectedHostelId}
          onChange={(event) => setSelectedHostelId(event.target.value)}
        >
          <option value="">All hostels</option>
          {hostels.map((hostel) => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name}{hostel.id === user?.hostelId ? " (yours)" : ""}
            </option>
          ))}
        </select>
        <span className="student-list-subtle">Other hostels: read-only, rating disabled</span>
      </div>

      {message ? <p className="student-note" style={{ color: "#2d8b53" }}>{message}</p> : null}
      {error ? <p className="student-note" style={{ color: "#d34c3f" }}>{error}</p> : null}

      <section className="student-grievance-list">
        {visibleMenus.map((menu) => {
          const canRate = menu.hostel.id === user?.hostelId;
          const average =
            menu.foodRatings.length > 0
              ? (
                  menu.foodRatings.reduce((sum, rating) => sum + rating.rating, 0) /
                  menu.foodRatings.length
                ).toFixed(1)
              : "No ratings";

          return (
            <article key={menu.id} className="student-surface student-list-card">
              <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>{menu.hostel.name} Menu</h2>
              <div className="student-hero-image" style={{ width: "100%", height: "auto" }}>
                <img
                  src={menu.imageUrl}
                  alt={`${menu.hostel.name} mess menu`}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <div className="student-action-row">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className="student-secondary-button"
                    disabled={!canRate}
                    onClick={() => rateMenu(menu.id, rating)}
                    aria-label={`Rate ${rating} stars`}
                  >
                    {rating} star
                  </button>
                ))}
              </div>
              <p className="student-note">
                Average rating: {average}. {canRate ? "You can rate this menu." : "Rating is locked for other hostels."}
              </p>
            </article>
          );
        })}

        {!visibleMenus.length ? (
          <section className="student-surface student-list-card">
            <p className="student-note">No hostel menu has been uploaded yet.</p>
          </section>
        ) : null}
      </section>
    </StudentShell>
  );
}
