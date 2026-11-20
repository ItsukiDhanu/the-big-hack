import type { Route } from "./+types/teams-shortlisted";
import { PageHead } from "~/components/ui";
import { TeamDirectory } from "~/components/TeamPortal";

export const meta: Route.MetaFunction = () => [
  { title: "Shortlisted Teams | The Big Hack 2.0" },
  { name: "description", content: "Shortlisted teams from both selection phases for The Big Hack 2026." },
  { name: "robots", content: "noindex, nofollow" },
];

export default function ShortlistedTeams() {
  return <><PageHead path="~/teams/shortlisted" cmd="ls teams/shortlisted" title="Shortlisted teams" intro="Teams selected in both phases. Open a team to sign in and view its private status." /><TeamDirectory stage="shortlisted" /></>;
}
