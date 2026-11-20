import type { Route } from "./+types/teams-confirmed";
import { PageHead } from "~/components/ui";
import { TeamDirectory } from "~/components/TeamPortal";

export const meta: Route.MetaFunction = () => [
  { title: "Confirmed Teams | The Big Hack 2.0" },
  { name: "description", content: "Teams with a confirmed seat at The Big Hack 2026." },
  { name: "robots", content: "noindex, nofollow" },
];

export default function ConfirmedTeams() {
  return <><PageHead path="~/teams/confirmed" cmd="ls teams/confirmed" title="Confirmed teams" intro="Seats appear here after organisers verify the payment proof." /><TeamDirectory stage="confirmed" /></>;
}
