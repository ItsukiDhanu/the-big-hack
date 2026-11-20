import { useEffect, useState, type FormEvent } from "react";
import type { Route } from "./+types/admin";
import { Download, GitBranch, LockKeyhole, LogOut, RefreshCw, Search } from "lucide-react";
import { PageHead, Pane } from "~/components/ui";
import { requestJson } from "~/lib/api";
import { getRound2Problem, JUDGING_CRITERIA, ROUND2_CHOICES_CONFIGURED, ROUND2_TRACKS, type JudgingScores } from "~/data/round2";

export const meta: Route.MetaFunction = () => [
  { title: "Admin | The Big Hack 2.0" },
  { name: "robots", content: "noindex, nofollow, noarchive" },
];

type AdminTeam = {
  id: string;
  slug: string;
  name: string;
  leaderName: string;
  round2TrackId?: string | null;
  round2ProblemStatementId?: string | null;
  round3Qualified?: boolean;
  innovation?: number | null;
  technicalDepth?: number | null;
  evidence?: number | null;
  impact?: number | null;
  presentation?: number | null;
  judgingNotes?: string | null;
  judgedAt?: string | null;
};

const api = <T,>(url: string, options?: RequestInit) => requestJson<T>(url, options, "Request failed.");

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [judgingTeams, setJudgingTeams] = useState<AdminTeam[]>([]);
  const [filter, setFilter] = useState<"choices" | "judging">("judging");
  const [judgingLoaded, setJudgingLoaded] = useState(false);
  const [judgingSearch, setJudgingSearch] = useState("");
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [error, setError] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [githubRepoEnabled, setGithubRepoEnabled] = useState(false);
  const [round2ChoicesOpen, setRound2ChoicesOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  async function loadQueue(view: "choices" | "judging" = filter) {
    const result = await api<{ teams: AdminTeam[] }>(`/api/admin-teams?view=${view}`);
    setTeams(result.teams);
    if (view === "judging") {
      setJudgingTeams(result.teams);
      setJudgingLoaded(true);
    }
  }

  async function loadGithubSetting() {
    const result = await api<{ githubRepoSubmissionEnabled: boolean; round2ChoicesOpen: boolean }>("/api/admin-session");
    setGithubRepoEnabled(result.githubRepoSubmissionEnabled);
    setRound2ChoicesOpen(result.round2ChoicesOpen);
  }

  async function toggleGithubSubmission() {
    setBusyId("github-setting");
    setError("");
    setEmailNotice("");
    try {
      const result = await api<{ enabled: boolean }>("/api/admin-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !githubRepoEnabled }),
      });
      setGithubRepoEnabled(result.enabled);
      setEmailNotice(result.enabled ? "GitHub repository submissions are open for confirmed teams." : "GitHub repository submissions are closed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update GitHub submission setting.");
    } finally { setBusyId(""); }
  }

  async function toggleRound2Choices() {
    setBusyId("round2-choices");
    setError("");
    try {
      const result = await api<{ enabled: boolean }>("/api/admin-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: "round2_choices_open", enabled: !round2ChoicesOpen }),
      });
      setRound2ChoicesOpen(result.enabled);
      setEmailNotice(result.enabled ? "Problem statement choices are open for confirmed teams." : "Problem statement choices are closed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update problem statement settings.");
    } finally { setBusyId(""); }
  }

  async function downloadTeamsCsv() {
    setExportBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin-teams?view=export", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || "Could not download team data.");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "the-big-hack-teams.csv";
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not download team data.");
    } finally { setExportBusy(false); }
  }

  function changeFilter(view: "choices" | "judging") {
    setFilter(view);
    if (view === "judging" && judgingLoaded) {
      setTeams(judgingTeams);
      return;
    }
    void loadQueue(view).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load teams."));
  }

  useEffect(() => {
    let active = true;
    api<{ authenticated: boolean; githubRepoSubmissionEnabled: boolean; round2ChoicesOpen: boolean }>("/api/admin-session")
      .then(async (session) => {
        if (!active) return;
        if (!session.authenticated) return;
        setAuthenticated(true);
        setGithubRepoEnabled(session.githubRepoSubmissionEnabled);
        setRound2ChoicesOpen(session.round2ChoicesOpen);
        await loadQueue("judging");
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not load review queue.");
      })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusyId("login");
    try {
      await api("/api/admin-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      setPassword("");
      setAuthenticated(true);
      await Promise.all([loadQueue("judging"), loadGithubSetting()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally { setBusyId(""); }
  }

  async function signOut() {
    await api("/api/admin-session", { method: "DELETE" }).catch(() => undefined);
    setAuthenticated(false);
    setTeams([]);
    setGithubRepoEnabled(false);
    setRound2ChoicesOpen(false);
  }

  async function setRound3Status(team: AdminTeam, qualified: boolean) {
    setBusyId(team.id);
    setError("");
    try {
      const result = await api<{ qualified: boolean }>("/api/admin-teams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamId: team.id, qualified }),
      });
      setTeams((current) => current.map((item) => item.id === team.id ? { ...item, round3Qualified: result.qualified } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update Round 3 status.");
    } finally { setBusyId(""); }
  }

  async function saveJudgement(team: AdminTeam) {
    const scores: JudgingScores = {
      innovation: team.innovation ?? 0,
      technicalDepth: team.technicalDepth ?? 0,
      evidence: team.evidence ?? 0,
      impact: team.impact ?? 0,
      presentation: team.presentation ?? 0,
    };
    setBusyId(team.id);
    setError("");
    setEmailNotice("");
    try {
      const result = await api<{ judgedAt: string }>("/api/admin-teams", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamId: team.id, scores, notes: team.judgingNotes ?? "" }),
      });
      setTeams((current) => current.map((item) => item.id === team.id ? { ...item, judgedAt: result.judgedAt } : item));
      setJudgingTeams((current) => current.map((item) => item.id === team.id ? { ...item, ...scores, judgingNotes: team.judgingNotes ?? "", judgedAt: result.judgedAt } : item));
      setEmailNotice(`Scores saved for ${team.name} · ${Object.values(scores).reduce((sum, score) => sum + score, 0)}/100.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save team scores.");
    } finally { setBusyId(""); }
  }

  const unassignedTeams = teams.filter((team) => !team.round2TrackId);

  return (
    <>
      <PageHead path="~/admin" cmd="sudo manage-event" title="Admin console" intro="Private organiser access · manage team judging and event operations." />
      <div className="wrap space-y-6 pb-12">
        {checking ? (
          <Pane title="server session" className="p-5"><p className="text-sm text-dim">Checking admin session…</p></Pane>
        ) : !authenticated ? (
          <Pane title="admin authentication" className="mx-auto max-w-xl p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center border border-green/30 bg-green/5 text-green"><LockKeyhole aria-hidden className="size-5" /></span>
              <div><h2 className="font-bold text-fg">Organiser sign-in</h2><p className="mt-1 text-xs text-dim">The password is checked by the server.</p></div>
            </div>
            <form onSubmit={signIn} className="mt-6 space-y-4">
              <label htmlFor="admin-password" className="block text-sm font-semibold text-fg">Admin password</label>
              <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.currentTarget.value)} className="min-h-12 w-full border border-line-hi bg-bg px-3 text-sm text-fg" />
              <button type="submit" disabled={busyId === "login"} className="inline-flex min-h-11 items-center gap-2 bg-green px-4 text-sm font-bold text-green-ink disabled:opacity-50">
                <LockKeyhole aria-hidden className="size-4" /> {busyId === "login" ? "Checking…" : "Sign in"}
              </button>
            </form>
          </Pane>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-amber">{teams.length} confirmed teams</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Admin views">
                  {(["judging", "choices"] as const).map((value) => (
                    <button key={value} type="button" onClick={() => changeFilter(value)} aria-pressed={filter === value} className={`min-h-10 border px-3 text-xs ${filter === value ? "border-green text-green" : "border-line-hi text-dim hover:text-fg"}`}>
                      {value === "choices" ? "Track choices" : "Judging"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void loadQueue().catch((cause) => setError(cause instanceof Error ? cause.message : "Refresh failed."))} className="inline-flex min-h-10 items-center gap-2 border border-line-hi px-3 text-xs text-dim hover:text-fg"><RefreshCw aria-hidden className="size-4" /> Refresh</button>
                <button type="button" onClick={signOut} className="inline-flex min-h-10 items-center gap-2 border border-line-hi px-3 text-xs text-dim hover:text-fg"><LogOut aria-hidden className="size-4" /> Sign out</button>
              </div>
            </div>
            <Pane title="hackathon operations" className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-bold text-fg"><GitBranch aria-hidden className="size-4" /> GitHub repository submissions</div>
                <p className="mt-1 text-xs text-dim">{githubRepoEnabled ? "Open · confirmed teams can submit or update their empty repository link." : "Closed · links remain saved in the team export."}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void toggleGithubSubmission()} disabled={busyId === "github-setting"} aria-pressed={githubRepoEnabled} className={`inline-flex min-h-11 items-center gap-2 border px-4 text-sm disabled:opacity-50 ${githubRepoEnabled ? "border-green/50 text-green" : "border-line-hi text-dim hover:text-fg"}`}>
                  <GitBranch aria-hidden className="size-4" /> {busyId === "github-setting" ? "Saving…" : githubRepoEnabled ? "Disable submissions" : "Enable submissions"}
                </button>
                <button type="button" onClick={() => void downloadTeamsCsv()} disabled={exportBusy} className="inline-flex min-h-11 items-center gap-2 bg-green px-4 text-sm font-bold text-green-ink disabled:opacity-50">
                  <Download aria-hidden className="size-4" /> {exportBusy ? "Preparing CSV…" : "Download all teams CSV"}
                </button>
              </div>
            </Pane>
            <Pane title="round-2/problem-statements" className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0">
                <div className="text-sm font-bold text-fg">Track and problem statement choices</div>
                <p className="mt-1 text-xs text-dim">{round2ChoicesOpen ? "Open · confirmed teams can choose or update one problem statement." : "Closed · choices are fixed and Round 3 advancement can be managed."}</p>
                <p className="mt-1 text-xs text-faint">Each track advances at most 10 teams to Round 3.</p>
                {!ROUND2_CHOICES_CONFIGURED && <p className="mt-1 text-xs text-amber">Replace the placeholder track and problem names before opening choices.</p>}
              </div>
              <button type="button" onClick={() => void toggleRound2Choices()} disabled={busyId === "round2-choices" || (!ROUND2_CHOICES_CONFIGURED && !round2ChoicesOpen)} aria-pressed={round2ChoicesOpen} className={`inline-flex min-h-11 items-center border px-4 text-sm disabled:opacity-50 ${round2ChoicesOpen ? "border-amber/50 text-amber" : "border-green/50 text-green"}`}>
                {busyId === "round2-choices" ? "Saving…" : round2ChoicesOpen ? "Close choices" : "Open choices"}
              </button>
            </Pane>
            {filter === "judging" && (
              <section className="space-y-5" aria-label="Team judging">
                <label className="relative block max-w-xl">
                  <span className="sr-only">Search teams by team name or leader</span>
                  <Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
                  <input type="search" value={judgingSearch} onChange={(event) => setJudgingSearch(event.currentTarget.value)} placeholder="Search team or leader…" className="min-h-11 w-full border border-line-hi bg-bg pl-10 pr-3 text-sm text-fg placeholder:text-faint" />
                </label>
                <p className="text-xs text-dim">Scores are saved per team. Search filters this loaded list locally and does not query Neon.</p>
                {ROUND2_TRACKS.map((track) => {
                  const query = judgingSearch.trim().toLocaleLowerCase();
                  const trackTeams = teams.filter((team) => team.round2TrackId === track.id && (!query || `${team.name} ${team.leaderName}`.toLocaleLowerCase().includes(query)));
                  if (!trackTeams.length) return null;
                  return <Pane key={track.id} title={`judging/${track.name}`} className="overflow-hidden">
                    <div className="border-b border-line bg-raise p-4"><p className="text-sm font-bold text-fg">{track.name}</p><p className="mt-1 text-xs leading-relaxed text-dim">{track.rule}</p></div>
                    <ul className="divide-y divide-line/60">
                      {trackTeams.map((team) => {
                        const chosen = getRound2Problem(team.round2TrackId ?? null, team.round2ProblemStatementId ?? null);
                        const total = (team.innovation ?? 0) + (team.technicalDepth ?? 0) + (team.evidence ?? 0) + (team.impact ?? 0) + (team.presentation ?? 0);
                        return <li key={team.id} className="p-4 sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div><h2 className="font-bold text-fg">{team.name}</h2><p className="mt-1 text-xs text-dim">Leader: {team.leaderName} · {chosen?.problem.name ?? "Problem statement not set"}</p></div>
                            <p className="text-sm text-green">{total}/100{team.judgedAt ? <span className="ml-2 text-xs text-faint">Saved</span> : <span className="ml-2 text-xs text-amber">Not scored</span>}</p>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {JUDGING_CRITERIA.map((criterion) => {
                              const key = criterion.id as keyof JudgingScores;
                              const field = key === "technicalDepth" ? "technicalDepth" : key;
                              return <label key={criterion.id} className="border border-line bg-bg p-3">
                                <span className="flex justify-between gap-2 text-xs font-semibold text-fg"><span>{criterion.name}</span><span className="text-dim">/ {criterion.max}</span></span>
                                <span className="mt-1 block text-[11px] leading-relaxed text-faint">{criterion.description}</span>
                                <input type="number" inputMode="numeric" min={0} max={criterion.max} step={1} aria-label={`${criterion.name} score for ${team.name}`} value={team[field] ?? 0} onChange={(event) => {
                                  const value = event.currentTarget.value === "" ? null : Number(event.currentTarget.value);
                                  setTeams((current) => current.map((item) => item.id === team.id ? { ...item, [field]: value } : item));
                                }} className="mt-2 min-h-10 w-full border border-line-hi bg-panel px-3 text-sm text-fg" />
                              </label>;
                            })}
                          </div>
                          <label className="mt-3 block text-xs font-semibold text-dim">Judge notes <span className="font-normal text-faint">(optional)</span>
                            <textarea rows={2} maxLength={2000} value={team.judgingNotes ?? ""} onChange={(event) => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, judgingNotes: event.currentTarget.value } : item))} className="mt-2 w-full border border-line-hi bg-bg p-3 text-sm text-fg" />
                          </label>
                          <button type="button" disabled={busyId === team.id || [team.innovation, team.technicalDepth, team.evidence, team.impact, team.presentation].some((score, index) => score != null && score > JUDGING_CRITERIA[index]!.max)} onClick={() => void saveJudgement(team)} className="mt-3 inline-flex min-h-10 items-center gap-2 bg-green px-4 text-xs font-bold text-green-ink disabled:opacity-50">{busyId === team.id ? "Saving…" : "Save scores"}</button>
                        </li>;
                      })}
                    </ul>
                  </Pane>;
                })}
                {unassignedTeams.some((team) => !judgingSearch.trim() || `${team.name} ${team.leaderName}`.toLocaleLowerCase().includes(judgingSearch.trim().toLocaleLowerCase())) && <Pane title="unassigned/confirmed-teams" className="p-4"><p className="text-sm text-fg">Some confirmed teams have not selected a track and are not available for scoring.</p></Pane>}
                {teams.filter((team) => `${team.name} ${team.leaderName}`.toLocaleLowerCase().includes(judgingSearch.trim().toLocaleLowerCase())).length === 0 && <Pane title="judging/no-matches" className="p-5"><p className="text-sm text-dim">No confirmed teams match this search.</p></Pane>}
              </section>
            )}
            {filter === "choices" && (
              <div className="space-y-5">
                <p className="text-sm text-dim">Confirmed teams are grouped by their selected track and problem statement. Close choices before selecting Round 3 teams.</p>
                {ROUND2_TRACKS.map((track) => {
                  const trackTeams = teams.filter((team) => team.round2TrackId === track.id);
                  const advancing = trackTeams.filter((team) => team.round3Qualified).length;
                  return (
                    <Pane key={track.id} title={`track/${track.name} · ${advancing}/10 to round 3`} className="overflow-hidden">
                      {trackTeams.length ? (
                        <ul className="divide-y divide-line/60">
                          {trackTeams.map((team) => {
                            const choice = getRound2Problem(team.round2TrackId ?? null, team.round2ProblemStatementId ?? null);
                            return (
                              <li key={team.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                                <div><p className="font-semibold text-fg">{team.name}</p><p className="mt-1 text-xs text-dim">{choice?.problem.name ?? "Problem statement not set"}</p></div>
                                <button type="button" disabled={round2ChoicesOpen || busyId === team.id || (!team.round3Qualified && advancing >= 10)} onClick={() => void setRound3Status(team, !team.round3Qualified)} className={`inline-flex min-h-10 items-center border px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${team.round3Qualified ? "border-green/50 text-green" : "border-line-hi text-dim hover:text-fg"}`}>
                                  {team.round3Qualified ? "Qualified for Round 3 · Remove" : "Advance to Round 3"}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : <p className="p-4 text-sm text-dim">No confirmed teams have chosen this track yet.</p>}
                    </Pane>
                  );
                })}
                <Pane title={`unassigned/confirmed-teams · ${unassignedTeams.length}`} className="overflow-hidden">
                  {unassignedTeams.length ? (
                    <>
                      <p className="p-4 text-sm text-dim">
                        {round2ChoicesOpen
                          ? "These confirmed teams have not submitted a track choice yet."
                          : "No track choices have been submitted yet. Open choices to let confirmed teams choose their track and problem statement."}
                      </p>
                      <button type="button" aria-expanded={showUnassigned} onClick={() => setShowUnassigned((open) => !open)} className="min-h-11 w-full border-t border-line px-4 py-3 text-left text-xs text-green">
                        {showUnassigned ? "Hide" : "View"} {unassignedTeams.length} teams without a choice
                      </button>
                      {showUnassigned && <ul className="divide-y divide-line/60 border-t border-line">
                        {unassignedTeams.map((team) => <li key={team.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-fg">{team.name}<span className="text-xs text-faint">{team.leaderName} · No selection</span></li>)}
                      </ul>}
                    </>
                  ) : <p className="p-4 text-sm text-dim">Every confirmed team has selected a track.</p>}
                </Pane>
              </div>
            )}
          </>
        )}
        {error && <p role="alert" className="border border-red/30 bg-red/5 p-3 text-sm text-red">{error}</p>}
        {emailNotice && <p role="status" className="border border-green/30 bg-green/5 p-3 text-sm text-green">{emailNotice}</p>}
      </div>
    </>
  );
}
