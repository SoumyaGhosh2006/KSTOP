import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HostelShell from "../../../components/hostel/HostelShell";
import StatusCard from "../../../components/StatusCard";
import Badge from "../../../components/Badge";
import EmptyState from "../../../components/EmptyState";
import SkeletonLoader from "../../../components/SkeletonLoader";
import Toast from "../../../components/Toast";
import api from "../../../utils/api";
import { formatDate } from "../../../utils/formatDate";
import {
  Star,
  Utensils,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Building,
  Upload,
  Calendar,
  Clock,
  User,
} from "../../../components/Icons";

export default function MessFeedback() {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [foodGrievances, setFoodGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("kstop_user")) || {};
    } catch {
      return {};
    }
  })();

  const hostelName =
    user?.assignedHostelName ||
    user?.hostelName ||
    user?.name ||
    "Campus Hostel";

  async function loadData() {
    setLoading(true);
    try {
      const [menusRes, grievancesRes] = await Promise.allSettled([
        api.get("/hostel/mess-menus"),
        api.get("/hostel/grievances", { params: { view: "active" } }),
      ]);

      if (menusRes.status === "fulfilled" && menusRes.value.data?.menus) {
        setMenus(menusRes.value.data.menus);
      }

      if (grievancesRes.status === "fulfilled" && grievancesRes.value.data?.grievances) {
        const allGrievances = grievancesRes.value.data.grievances;
        // Filter food or mess related grievances
        const foodIssues = allGrievances.filter(
          (g) =>
            g.category?.toLowerCase().includes("food") ||
            g.category?.toLowerCase().includes("mess") ||
            g.title?.toLowerCase().includes("food") ||
            g.title?.toLowerCase().includes("mess")
        );
        setFoodGrievances(foodIssues);
      }
    } catch {
      setToast({
        type: "error",
        message: "Could not load mess feedback records.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter to menus belonging to this assigned hostel
  const ownMenus = useMemo(() => {
    return menus.filter(
      (m) =>
        m.hostel?.id === user?.assignedHostelId ||
        m.hostelId === user?.assignedHostelId ||
        m.hostel?.name === user?.name ||
        m.hostel?.name === user?.assignedHostelName
    );
  }, [menus, user]);

  // Aggregate ratings across all menus of this hostel
  const allRatings = useMemo(() => {
    const list = [];
    ownMenus.forEach((menu) => {
      if (Array.isArray(menu.foodRatings)) {
        list.push(...menu.foodRatings);
      }
    });
    return list;
  }, [ownMenus]);

  const ratingCount = allRatings.length;
  const averageRating =
    ratingCount > 0
      ? (allRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingCount).toFixed(1)
      : null;

  return (
    <HostelShell
      title="Mess & Dining Feedback"
      eyebrow={`${hostelName} · Student Ratings`}
      backTo="/dashboard/hostel"
      actionButton={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl border border-[rgba(64,61,57,0.15)] bg-white hover:bg-[#f5f0e5] text-[#252422] transition-colors cursor-pointer"
            title="Refresh Feedback"
            aria-label="Refresh Feedback"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            to="/dashboard/hostel/mess-menu"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eb5e28] hover:bg-[#c94a1b] text-white text-xs font-bold transition-all shadow-sm"
          >
            <Upload size={14} /> Update Mess Menu
          </Link>
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

        {/* Hero KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusCard
            eyebrow="Dining Quality Score"
            value={averageRating ? `${averageRating} / 5.0` : "No Ratings"}
            subtext={
              ratingCount > 0
                ? `Calculated across ${ratingCount} student feedback entries`
                : "Awaiting meal ratings from residents"
            }
            icon={Star}
            isActionable={Boolean(averageRating)}
          />

          <StatusCard
            eyebrow="Active Mess Menus"
            value={ownMenus.length}
            subtext={`Published dining schedules for ${hostelName}`}
            icon={Utensils}
          />

          <StatusCard
            eyebrow="Dining Concerns"
            value={foodGrievances.length}
            subtext={
              foodGrievances.length > 0
                ? `${foodGrievances.length} open maintenance/mess complaint(s)`
                : "No active mess complaints logged"
            }
            icon={AlertCircle}
            isUrgent={foodGrievances.length > 0}
          />
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Menu Ratings Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28]">
                    Menu Quality Audit
                  </span>
                  <h3 className="text-base font-bold text-[#252422] m-0">Resident Ratings per Menu</h3>
                </div>
                <Badge variant="brand" size="sm">
                  {hostelName}
                </Badge>
              </div>

              {loading ? (
                <SkeletonLoader type="card" count={2} />
              ) : ownMenus.length === 0 ? (
                <EmptyState
                  icon={Utensils}
                  title="No menus published yet"
                  description="Publish today's mess menu first so residents can review and submit ratings."
                  actionLabel="Upload First Menu"
                  onAction={() => navigate("/dashboard/hostel/mess-menu")}
                />
              ) : (
                <div className="space-y-4">
                  {ownMenus.map((menu) => {
                    const ratings = Array.isArray(menu.foodRatings) ? menu.foodRatings : [];
                    const count = ratings.length;
                    const avg =
                      count > 0
                        ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1)
                        : null;

                    return (
                      <div
                        key={menu.id}
                        className="p-4 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:shadow-xs transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {menu.imageUrl && (
                              <img
                                src={menu.imageUrl}
                                alt="Menu thumbnail"
                                className="w-14 h-14 rounded-lg object-cover border border-black/10 flex-shrink-0"
                              />
                            )}
                            <div>
                              <strong className="text-sm font-bold text-[#252422] block">
                                Menu of {new Date(menu.createdAt).toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </strong>
                              <span className="text-xs text-[#756f67] block mt-0.5">
                                {count} verified resident rating{count === 1 ? "" : "s"}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            {avg ? (
                              <div className="flex items-center gap-1 font-mono font-bold text-base text-amber-600">
                                <Star size={16} className="fill-amber-500 text-amber-500" />
                                <span>{avg}</span>
                                <span className="text-xs text-[#756f67]">/5.0</span>
                              </div>
                            ) : (
                              <Badge variant="neutral" size="sm">
                                Pending Reviews
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* List individual feedback comments if available */}
                        {ratings.length > 0 && (
                          <div className="pt-2 border-t border-[rgba(64,61,57,0.08)] space-y-2">
                            <span className="text-[10px] font-bold text-[#756f67] uppercase tracking-wider block">
                              Recent Student Feedback
                            </span>
                            {ratings.slice(0, 3).map((r, idx) => (
                              <div
                                key={r.id || idx}
                                className="p-2 rounded-lg bg-white border border-black/5 text-xs text-[#403d39] flex items-center justify-between"
                              >
                                <span>{r.comment || "Rated without comment"}</span>
                                <span className="font-mono font-bold text-amber-600 flex items-center gap-0.5">
                                  {r.rating} ★
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Food & Mess Grievances (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-[rgba(64,61,57,0.14)] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(64,61,57,0.08)]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67]">
                    Dining Issues
                  </span>
                  <h3 className="text-base font-bold text-[#252422] m-0">Food Grievances</h3>
                </div>
                <Badge variant={foodGrievances.length > 0 ? "urgent" : "approved"} size="sm">
                  {foodGrievances.length} Active
                </Badge>
              </div>

              {loading ? (
                <SkeletonLoader type="card" count={2} />
              ) : foodGrievances.length === 0 ? (
                <div className="text-center py-8 text-[#756f67]">
                  <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-600 opacity-60" />
                  <p className="text-xs font-semibold m-0">No active dining complaints.</p>
                  <span className="text-[11px] block mt-1">
                    Residents of {hostelName} have reported no issues with food quality or mess cleanliness.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {foodGrievances.map((g) => (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-xl border border-[rgba(64,61,57,0.1)] bg-[#fbfaf6] hover:bg-white hover:shadow-xs transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-xs font-bold text-[#252422] block truncate">
                          {g.title}
                        </strong>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/5 text-[#403d39] flex-shrink-0">
                          P{g.priorityScore ?? "—"}
                        </span>
                      </div>
                      <p className="text-xs text-[#756f67] m-0 line-clamp-2 leading-relaxed">
                        {g.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#756f67] pt-1">
                        <span>{g.student?.name || "Student"}</span>
                        <Link
                          to="/dashboard/hostel/grievances"
                          className="text-[#eb5e28] font-bold hover:underline"
                        >
                          Resolve →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Standard Info Box */}
            <div className="rounded-2xl border border-[rgba(64,61,57,0.14)] bg-[#fbfaf6] p-4 text-xs text-[#403d39] space-y-1.5">
              <strong className="text-[#252422] flex items-center gap-1.5 font-bold">
                <Building size={14} className="text-[#eb5e28]" /> Catering Oversight
              </strong>
              <p className="m-0 leading-relaxed text-[11px] text-[#756f67]">
                Mess feedback ratings and dining grievances are reviewed during monthly hostel administration meetings to evaluate catering quality, nutritional balance, and dietary hygiene.
              </p>
            </div>
          </div>
        </div>
      </div>
    </HostelShell>
  );
}