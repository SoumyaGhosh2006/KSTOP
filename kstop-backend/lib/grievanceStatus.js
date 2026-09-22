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
  const studentResponded = Boolean(grievance.studentRespondedAt);
  const hostelResolved = grievance.staffStatus === "RESOLVED";
  const studentResolved = grievance.studentStatus === "CONFIRMED";
  const studentUnresolved = grievance.studentStatus === "DISPUTED";

  // The overall status is derived from the two recorded decisions:
  // - both resolved -> RESOLVED
  // - hostel resolved + student unresolved -> CLASHED
  // - student unresolved -> UNRESOLVED
  // - neither side has responded -> IN_PROGRESS
  // A hostel "OPEN" response is explicitly distinguishable from no response
  // by staffRespondedAt.
  if (hostelResolved && studentResolved) return "RESOLVED";
  if (hostelResolved && studentUnresolved) return "CLASHED";
  if (studentUnresolved) return "UNRESOLVED";
  if (!hostelResponded && !studentResponded) return "IN_PROGRESS";
  if (hostelResponded && !hostelResolved) return "UNRESOLVED";

  // One side has responded with "resolved", while the other has not
  // responded yet.
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
      staffStatus: "RESOLVED",
      studentStatus: "CONFIRMED",
      studentRespondedAt: { gte: getRecentResolvedCutoff() },
    };
  }

  if (view === "history") {
    // History is the complete resolved register. "Recently Resolved" is
    // simply the convenient 30-day subset; keeping History inclusive makes
    // the tab useful regardless of when a grievance was closed.
    return {
      staffStatus: "RESOLVED",
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
  if (grievance.staffStatus === "RESOLVED" && grievance.studentStatus === "CONFIRMED") {
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
