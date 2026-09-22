// Central grievance resolution rules.
//
// The database keeps the two independent decisions:
// - staffStatus: OPEN / RESOLVED
// - studentStatus: PENDING / CONFIRMED / DISPUTED
//
// The dashboard status is derived from those two decisions so we do not
// introduce another database field that can drift out of sync.

function getGrievanceResolutionStatus(grievance) {
  const hostelResponded = Boolean(grievance.staffRespondedAt);
  const hostelResolved = grievance.staffStatus === "RESOLVED";
  const studentResponded = Boolean(grievance.studentRespondedAt);
  const studentResolved = grievance.studentStatus === "CONFIRMED";
  const studentUnresolved = grievance.studentStatus === "DISPUTED";

  // Student confirmation is sufficient to close the grievance. Hostel staff
  // may leave the hostel-side response untouched or explicitly unresolved.
  if (studentResolved) return "RESOLVED";

  // A hostel-side resolved decision conflicts with a student's unresolved
  // decision, so this remains active and is shown as a clash.
  if (hostelResolved && studentUnresolved) return "CLASHED";

  // The student has flagged the grievance as unresolved while the hostel
  // has not responded yet.
  if (!hostelResponded && studentUnresolved) return "UNRESOLVED";

  // Neither side has responded.
  if (!hostelResponded && !studentResponded) return "IN_PROGRESS";

  // If the student has not confirmed resolution, the grievance remains
  // active. This also covers an explicit hostel-unresolved response.
  return "IN_PROGRESS";
}

function withGrievanceResolutionStatus(grievance) {
  return {
    ...grievance,
    resolutionStatus: getGrievanceResolutionStatus(grievance),
  };
}

function sortGrievances(grievances, view = "active") {
  return [...grievances].sort((a, b) => {
    if (view !== "active") {
      const resolvedDateDifference =
        new Date(b.resolvedAt || 0) - new Date(a.resolvedAt || 0);

      if (resolvedDateDifference !== 0) return resolvedDateDifference;
    }

    const statusRank = {
      CLASHED: 0,
      UNRESOLVED: 1,
      IN_PROGRESS: 2,
      RESOLVED: 3,
    };

    const statusDifference =
      statusRank[a.resolutionStatus] - statusRank[b.resolutionStatus];

    if (statusDifference !== 0) return statusDifference;

    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }

    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

const RECENT_RESOLVED_DAYS = 30;

function getRecentResolvedCutoff() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_RESOLVED_DAYS);
  return cutoff;
}

function getGrievanceViewWhere(view = "active") {
  if (view === "recent") {
    return {
      studentStatus: "CONFIRMED",
      studentRespondedAt: { gte: getRecentResolvedCutoff() },
    };
  }

  if (view === "history") {
    // History is the complete resolved register. "Recently Resolved" is
    // simply the convenient 30-day subset; keeping History inclusive makes
    // the tab useful regardless of when a grievance was closed.
    return {
      studentStatus: "CONFIRMED",
    };
  }

  // Active view: everything that is not fully resolved.
  return {
    OR: [
      { staffStatus: { not: "RESOLVED" } },
      { staffStatus: "RESOLVED", studentStatus: "PENDING" },
      { staffStatus: "RESOLVED", studentStatus: "DISPUTED" },
    ],
  };
}

function getResolutionDate(grievance) {
  if (grievance.studentStatus === "CONFIRMED") {
    return grievance.studentRespondedAt || grievance.staffResolvedAt || null;
  }

  return null;
}

module.exports = {
  RECENT_RESOLVED_DAYS,
  getGrievanceResolutionStatus,
  withGrievanceResolutionStatus,
  sortGrievances,
  getGrievanceViewWhere,
  getResolutionDate,
};
