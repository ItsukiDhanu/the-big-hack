import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("schedule", "routes/schedule.tsx"),
  route("prizes", "routes/prizes.tsx"),
  route("rules", "routes/rules.tsx"),
  route("faq", "routes/faq.tsx"),
  route("register", "routes/register.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
