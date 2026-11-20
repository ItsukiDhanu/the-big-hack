import { useSearchParams } from "react-router";
import type { Route } from "./+types/teams";
import { PageHead } from "~/components/ui";
import { TeamDirectory, TeamWorkspace } from "~/components/TeamPortal";

export const meta: Route.MetaFunction = () => [
  { title: "Teams | The Big Hack 2.0" },
  { name: "description", content: "Browse confirmed teams and open your private team portal." },
  { name: "robots", content: "noindex, nofollow" },
];

export default function Teams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const slug = searchParams.get("team");
  const back = () => setSearchParams({}, { replace: true });
  return (
    <>
      <PageHead path="~/teams" cmd={slug ? "open team-portal" : "ls teams/confirmed"}
        title={slug ? "Team portal" : "Teams"}
        intro={slug ? "Sign in with your leader’s registered email to view private team information and payment status." : "Browse teams with confirmed seats."} />
      {slug ? <TeamWorkspace key={slug} slug={slug} onBack={back} /> : <TeamDirectory stage="confirmed" />}
    </>
  );
}
