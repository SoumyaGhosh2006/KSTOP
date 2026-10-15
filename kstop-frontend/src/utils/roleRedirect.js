export function getRoleDashboardPath(role) {
  switch (String(role).toLowerCase()) {
    case "student":
      return "/dashboard/student";
    case "parent":
      return "/dashboard/parent";
    case "mentor":
      return "/dashboard/mentor";
    case "hostel":
      return "/dashboard/hostel";
    default:
      return "/login";
  }
}

export default getRoleDashboardPath;
