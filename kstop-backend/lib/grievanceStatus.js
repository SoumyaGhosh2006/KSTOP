// Central grievance resolution rules.
//
// The database keeps the two independent decisions:
// - staffStatus: OPEN / RESOLVED
// - studentStatus: PENDING / CONFIRMED / DISPUTED
//
// The dashboard status is derived from those two decisions so we do not
// introduce another database field that can drift out of sync.

function getGrievanceResolutionStatus(grievance) {
  const staffResolved = grievance.staffStatus === "RESOLVED";
  const studentResolved = grievance.studentStatus === "CONFIRMED";
  const studentUnresolved = grievance.studentStatus === "DISPUTED";

  // A student's unresolved response is authoritative against a hostel-side
  // resolved decision. A hostel can report a fix, but the grievance must not
  // be treated as resolved if the student says it is still unresolved.
  if (studentUnresolved) return "UNRESOLVED";
  if (staffResolved && studentResolved) return "RESOLVED";
  if (!staffResolved && studentResolved) return "CLASHED";

  return "IN_PROGRESS";
}

function withGrievanceResolutionStatus(grievance) {
  return {
    ...grievance,
    resolutionStatus: getGrievanceResolutionStatus(grievance),
  };
}

function sortGrievances(grievances) {
  const statusRank = {
    CLASHED: 0,
    UNRESOLVED: 1,
    IN_PROGRESS: 2,
    RESOLVED: 3,
  };

  return [...grievances].sort((a, b) => {
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
    return {
      staffStatus: "RESOLVED",
      studentStatus: "CONFIRMED",
      OR: [
        { studentRespondedAt: { lt: getRecentResolvedCutoff() } },
        { studentRespondedAt: null },
      ],
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
