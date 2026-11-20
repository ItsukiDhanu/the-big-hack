import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("schedule", "routes/schedule.tsx"),
  route("prizes", "routes/prizes.tsx"),
  route("rules", "routes/rules.tsx"),
  route("faq", "routes/faq.tsx"),
  route("announcements", "routes/announcements.tsx"),
  route("teams", "routes/teams.tsx"),
  route("teams/shortlisted", "routes/teams-shortlisted.tsx"),
  route("teams/confirmed", "routes/teams-confirmed.tsx"),
  route("admin", "routes/admin.tsx"),
  route("register", "routes/register.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
