import { useEffect, useMemo, useState } from "react";
import StudentShell from "../../../components/student/StudentShell";
import api from "../../../utils/api";
import "./student-dashboard.css";

/**
 * Reads the stored user data safely.
 */
function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("kstop_user"));
  } catch {
    return null;
  }
}

/**
 * Displays official hostel mess menus.
 *
 * Students can view menus from all hostels.
 * The "(yours)" label identifies the student's assigned hostel.
 */
export default function MessMenu() {
  const [menus, setMenus] = useState([]);
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const user = readStoredUser();

  // Build a unique hostel list from available menus.
  const hostels = useMemo(() => {
    const hostelMap = new Map();

    menus.forEach((menu) => {
      if (menu.hostel) {
        hostelMap.set(menu.hostel.id, menu.hostel);
      }
    });

    return Array.from(hostelMap.values());
  }, [menus]);

  // Filter menus only when a hostel is selected.
  const visibleMenus = selectedHostelId
    ? menus.filter((menu) => menu.hostel.id === selectedHostelId)
    : menus;

  async function loadMenus() {
    try {
      setError("");
      const response = await api.get("/hostel/mess-menus");
      setMenus(response.data.menus || []);
    } catch {
      setError("Could not load hostel menus.");
    }
  }

  useEffect(() => {
    loadMenus();
  }, []);

  async function handleUpload(event) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Choose a JPEG or PNG menu image before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("menuImage", file);

    try {
      setUploading(true);
      await api.post("/hostel/mess-menu", formData, {
        headers: { "Content-Type": undefined },
      });
      setFile(null);
      event.currentTarget.reset();
      await loadMenus();
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || "Menu upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <StudentShell title="Mess Menu" backTo="/dashboard/student">
      <section className="student-surface student-list-card" style={{ marginBottom: "16px" }}>
        <div className="student-list-subtle" style={{ marginBottom: "10px", fontWeight: 700 }}>
          Update your hostel's menu
        </div>
        <form onSubmit={handleUpload}>
          <input
            className="student-input"
            type="file"
            accept="image/jpeg,image/png"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <button
            type="submit"
            className="student-primary-button"
            style={{ marginTop: "10px" }}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Menu"}
          </button>
        </form>
      </section>

      <div className="student-toolbar">
        <select
          className="student-input student-hostel-select"
          value={selectedHostelId}
          onChange={(event) => setSelectedHostelId(event.target.value)}
        >
          <option value="">All hostels</option>

          {hostels.map((hostel) => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name}
              {hostel.id === user?.hostelId ? " (yours)" : ""}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="student-note" style={{ color: "#d34c3f" }}>
          {error}
        </p>
      ) : null}

      <section className="student-grievance-list">
        {visibleMenus.map((menu) => (
          <article
            key={menu.id}
            className="student-surface student-list-card"
          >
            <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>
              {menu.hostel.name} Mess Menu
            </h2>

            <div
              className="student-hero-image"
              style={{ width: "100%", height: "auto" }}
            >
              <img
                src={menu.imageUrl}
                alt={`${menu.hostel.name} mess menu`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </article>
        ))}

        {!visibleMenus.length ? (
          <section className="student-surface student-list-card">
            <p className="student-note">
              No hostel menu has been uploaded yet.
            </p>
          </section>
        ) : null}
      </section>
    </StudentShell>
  );
}