import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowUpRight, Check, Clock3, GitBranch, ImagePlus, LockKeyhole, LogOut, Upload } from "lucide-react";
import QRCode from "qrcode";
import { Pane } from "~/components/ui";
import { requestJson } from "~/lib/api";
import { getRound2Problem, ROUND2_TRACKS } from "~/data/round2";

type Stage = "shortlisted" | "confirmed" | "standby";
type DirectoryStage = Exclude<Stage, "standby">;
type PaymentStatus = "not_submitted" | "pending" | "confirmed" | "rejected";
type DirectoryTeam = { slug: string; name: string; stage: Stage };
type PortalData = {
  team: { id: string; slug: string; name: string; leaderName: string; members: string[]; stage: Stage; paymentStatus: PaymentStatus; githubRepoUrl: string | null; round2TrackId: string | null; round2ProblemStatementId: string | null; round3Qualified: boolean };
  githubRepoSubmissionEnabled: boolean;
  round2ChoicesOpen: boolean;
  proof: { id: string; status: string; uploadedAt: string; note: string | null } | null;
  paymentUrl: string | null;
  paymentAmount: number;
};

const api = <T,>(url: string, options?: RequestInit) => requestJson<T>(url, options, "The request could not be completed.");

export function TeamDirectory({ stage }: { stage: DirectoryStage }) {
  const [teams, setTeams] = useState<DirectoryTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceError, setServiceError] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ teams: DirectoryTeam[] }>(`/api/teams?stage=${stage}`)
      .then(({ teams: rows }) => { if (active) { setTeams(rows); setServiceError(false); } })
      .catch(() => {
        if (!active) return;
        setServiceError(true);
        setTeams([]);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [stage]);

  return (
    <div className="wrap space-y-6 pb-10">
      {serviceError && (
        <p role="status" className="border border-amber/40 bg-amber/5 p-4 text-sm leading-relaxed text-amber">
          Live team status is temporarily unavailable. Please refresh in a moment.
        </p>
      )}
      <Pane title={`${stage} · ${teams.length} teams`} className="overflow-hidden">
        <div className="flex items-baseline justify-between gap-3 border-b border-line bg-raise px-5 py-4">
          <h2 className="font-bold text-fg">{stage === "confirmed" ? "Confirmed seats" : "Shortlisted teams"}</h2>
          <p className="text-sm text-dim">{loading ? "syncing…" : `${teams.length} teams`}</p>
        </div>
        {teams.length ? (
          <ul className="grid sm:grid-cols-2">
            {teams.map((team, index) => (
              <li key={team.slug} className="border-b border-line/60 sm:odd:border-r">
                <Link to={`/teams?team=${encodeURIComponent(team.slug)}`} className="group flex min-h-14 items-center gap-3 px-5 py-3 text-sm hover:bg-raise focus-visible:bg-raise">
                  <span aria-hidden className="w-7 shrink-0 text-right text-faint">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-fg group-hover:text-green">{team.name}</span>
                  <ArrowUpRight aria-hidden className="size-4 text-faint group-hover:text-green" />
                  <span className="sr-only">Open private team portal</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : loading ? (
          <p className="px-5 py-8 text-sm text-dim">Loading teams…</p>
        ) : (
          <div className="px-5 py-8">
            <p className="text-fg">{stage === "confirmed" ? "No confirmed seats yet." : "No shortlisted teams yet."}</p>
            <p className="mt-2 text-sm text-dim">{stage === "confirmed" ? "Teams appear here after their payment is reviewed by the organisers." : "There are no teams in this list right now."}</p>
          </div>
        )}
      </Pane>
      <p className="text-xs leading-relaxed text-faint">Open a team to view its portal. Team records are private after sign-in.</p>
    </div>
  );
}

export function TeamWorkspace({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [email, setEmail] = useState("");
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [paymentQr, setPaymentQr] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [githubNotice, setGithubNotice] = useState("");
  const [round2TrackId, setRound2TrackId] = useState("");
  const [round2ProblemStatementId, setRound2ProblemStatementId] = useState("");
  const [round2Notice, setRound2Notice] = useState("");
  const [choiceConfirmationOpen, setChoiceConfirmationOpen] = useState(false);
  const [choiceConfirmSeconds, setChoiceConfirmSeconds] = useState(0);

  useEffect(() => {
    if (!choiceConfirmationOpen) return;
    const timer = window.setInterval(() => setChoiceConfirmSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [choiceConfirmationOpen]);

  const loadPortal = useCallback(async () => {
    try {
      const result = await api<PortalData>(`/api/team-portal?slug=${encodeURIComponent(slug)}`);
      setData(result);
      setGithubRepoUrl(result.team.githubRepoUrl ?? "");
      setRound2TrackId(result.team.round2TrackId ?? "");
      setRound2ProblemStatementId(result.team.round2ProblemStatementId ?? "");
      setSignedOut(false);
      setError("");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not load team details.";
      if (message.includes("Sign in")) setSignedOut(true);
      else setError(message);
      setData(null);
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    setPaymentQr("");
    if (data?.paymentUrl) {
      void QRCode.toDataURL(data.paymentUrl, { errorCorrectionLevel: "M", margin: 2, width: 280 })
        .then((url) => { if (active) setPaymentQr(url); })
        .catch(() => { if (active) setError("Could not create the payment QR. Use the UPI button instead."); });
    }
    return () => { active = false; };
  }, [data?.paymentUrl]);

  useEffect(() => {
    let lastRefresh = Date.now();
    void loadPortal();
    const refreshWhenVisible = () => {
      const now = Date.now();
      if (document.visibilityState !== "visible" || now - lastRefresh < 1_000) return;
      lastRefresh = now;
      void loadPortal();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadPortal]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<PortalData>("/api/team-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, email }) });
      setData(result);
      setGithubRepoUrl(result.team.githubRepoUrl ?? "");
      setRound2TrackId(result.team.round2TrackId ?? "");
      setRound2ProblemStatementId(result.team.round2ProblemStatementId ?? "");
      setSignedOut(false);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally { setBusy(false); }
  }

  async function uploadProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) { setError("Choose a payment screenshot first."); return; }
    const body = new FormData();
    body.set("proof", file);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ proof: NonNullable<PortalData["proof"]> }>("/api/team-proof", { method: "POST", body });
      setFile(null);
      setData((current) => current ? {
        ...current,
        team: { ...current.team, paymentStatus: "pending" },
        proof: result.proof,
      } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  async function submitGithubRepo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setGithubNotice("");
    try {
      const result = await api<{ githubRepoUrl: string | null }>("/api/team-portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: githubRepoUrl }),
      });
      setData((current) => current ? { ...current, team: { ...current.team, githubRepoUrl: result.githubRepoUrl } } : current);
      setGithubRepoUrl(result.githubRepoUrl ?? "");
      setGithubNotice(result.githubRepoUrl ? "Repository link saved." : "Repository link removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the GitHub link.");
    } finally { setBusy(false); }
  }

  function submitProblemChoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setRound2Notice("");
    setChoiceConfirmSeconds(5);
    setChoiceConfirmationOpen(true);
  }

  async function confirmProblemChoice() {
    setBusy(true);
    setError("");
    setRound2Notice("");
    try {
      const result = await api<{ round2TrackId: string; round2ProblemStatementId: string }>("/api/team-portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ round2Choice: { trackId: round2TrackId, problemStatementId: round2ProblemStatementId } }),
      });
      setData((current) => current ? { ...current, team: { ...current.team, ...result } } : current);
      setRound2Notice("Problem statement choice saved.");
      setChoiceConfirmationOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your problem statement choice.");
    } finally { setBusy(false); }
  }

  async function signOut() {
    await api("/api/team-logout", { method: "POST" }).catch(() => undefined);
    setData(null);
    setSignedOut(true);
  }

  const stageLabel = data?.team.stage === "confirmed" ? "Seat confirmed" : data?.team.stage === "standby" ? "No active seat" : "Shortlisted";
  const paymentLabel = data?.team.paymentStatus === "confirmed" ? "Payment confirmed"
    : data?.team.paymentStatus === "pending" ? "Screenshot pending review"
    : data?.team.paymentStatus === "rejected" ? "Screenshot needs an update"
    : "Payment proof not submitted";
  const selectedProblem = data ? getRound2Problem(data.team.round2TrackId, data.team.round2ProblemStatementId) : null;

  return (
    <div className="wrap space-y-6 pb-10">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-sm text-dim hover:text-green">
        <ArrowLeft aria-hidden className="size-4" /> Back to teams
      </button>

      {choiceConfirmationOpen && data && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="choice-confirm-title" className="w-full max-w-lg border border-line-hi bg-panel p-5 shadow-2xl sm:p-7">
            <p className="text-xs uppercase tracking-wider text-green">Final confirmation</p>
            <h2 id="choice-confirm-title" className="mt-2 text-xl font-bold text-fg">Confirm your Round 2 choice</h2>
            <p className="mt-3 text-sm leading-relaxed text-dim">Once confirmed, your track and problem statement are locked and cannot be changed.</p>
            <div className="mt-5 border border-line bg-bg p-4">
              <p className="text-xs text-faint">Track</p>
              <p className="mt-1 text-sm font-semibold text-fg">{ROUND2_TRACKS.find((track) => track.id === round2TrackId)?.name ?? "—"}</p>
              <p className="mt-4 text-xs text-faint">Problem statement</p>
              <p className="mt-1 text-sm font-semibold text-fg">{getRound2Problem(round2TrackId, round2ProblemStatementId)?.problem.name ?? "—"}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => setChoiceConfirmationOpen(false)} disabled={busy} className="inline-flex min-h-11 items-center border border-line-hi px-4 text-sm text-fg disabled:opacity-50">Go back</button>
              <button type="button" onClick={confirmProblemChoice} disabled={busy || choiceConfirmSeconds > 0} className="inline-flex min-h-11 items-center gap-2 bg-green px-4 text-sm font-bold text-green-ink disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "Confirming…" : choiceConfirmSeconds > 0 ? `Yes, confirm (${choiceConfirmSeconds})` : "Yes, confirm"}
              </button>
            </div>
          </section>
        </div>
      )}

      {data ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <Pane title="team record" className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-faint">team/{data.team.slug}</p>
                <h2 className="mt-2 text-2xl font-bold text-fg">{data.team.name}</h2>
                <p className="mt-2 text-sm text-dim">Team leader: {data.team.leaderName}</p>
                {data.round2ChoicesOpen && (
                  <a href="/The_Big_Hack_2.0_Problem_Statements.pdf" download className="mt-5 inline-flex min-h-12 items-center gap-3 border border-green/40 bg-green/5 px-4 text-sm font-bold text-green hover:bg-green/10">
                    Download Round 2 problem statements PDF <ArrowUpRight aria-hidden className="size-4" />
                  </a>
                )}
              </div>
              <button type="button" onClick={signOut} className="inline-flex min-h-11 items-center gap-2 border border-line-hi px-3 text-xs text-dim hover:text-fg">
                <LogOut aria-hidden className="size-4" /> Sign out
              </button>
            </div>
            <dl className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
              <div><dt className="text-xs text-faint">Shortlist</dt><dd className="mt-1 text-sm text-green">{stageLabel}</dd></div>
              <div><dt className="text-xs text-faint">Payment</dt><dd className="mt-1 text-sm text-amber">{paymentLabel}</dd></div>
              <div><dt className="text-xs text-faint">Event</dt><dd className="mt-1 text-sm text-fg">20–21 November 2026</dd></div>
              <div><dt className="text-xs text-faint">Seat fee</dt><dd className="mt-1 text-sm text-fg">₹{data.paymentAmount} per team</dd></div>
            </dl>
            <div className="mt-6 border-t border-line pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold text-fg">Registered team members</h3>
                <span className="text-xs text-faint">{data.team.members.length} people</span>
              </div>
              <ul className="mt-3 divide-y divide-line/60">
                {data.team.members.map((name, index) => (
                  <li key={`${index}-${name}`} className="flex min-h-11 items-center gap-3 py-2 text-sm">
                    <span aria-hidden className="w-7 shrink-0 text-right text-faint">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-fg">{name}</span>
                    {index === 0 && <span className="border border-green/30 px-2 py-1 text-[10px] uppercase tracking-wider text-green">Leader</span>}
                  </li>
                ))}
              </ul>
            </div>
            {data.proof?.note && <p className="mt-5 border-l-2 border-amber px-3 py-2 text-sm text-dim">Review note: {data.proof.note}</p>}
            <p className="mt-5 text-xs leading-relaxed text-faint">A seat is confirmed after an organiser reviews your payment and screenshot.</p>
          </Pane>

          {data.team.stage === "standby" ? (
            <Pane title="registration-closed" className="p-5 sm:p-6">
              <h3 className="text-lg font-bold text-fg">Registration closed</h3>
              <p className="mt-3 text-sm leading-relaxed text-dim">This team does not have an active seat or payment access. Registration for additional teams is closed.</p>
            </Pane>
          ) : data.team.stage === "shortlisted" ? (
          <Pane title="payment proof" className="p-5 sm:p-6">
            <h3 className="text-lg font-bold text-fg">Confirm your seat</h3>
            <p className="mt-2 text-sm leading-relaxed text-dim">Pay ₹{data.paymentAmount} per team to the Big Hack UPI ID. The payment note is prefilled with your team name and leader name.</p>
            {paymentQr && (
              <div className="mt-5 inline-flex flex-col items-center gap-3 border border-line bg-white p-4">
                <img src={paymentQr} alt={`₹${data.paymentAmount} UPI payment QR for ${data.team.name}, led by ${data.team.leaderName}`} width={240} height={240} className="size-60 max-w-full" />
                <p className="text-xs text-black">Scan with any UPI app · ₹{data.paymentAmount}</p>
              </div>
            )}
            {data.paymentUrl ? (
              <a href={data.paymentUrl} className="mt-4 inline-flex min-h-11 items-center gap-2 bg-green px-4 text-sm font-bold text-green-ink hover:shadow-[0_0_0_3px_rgb(140_255_122/0.25)]">
                Open UPI app <ArrowUpRight aria-hidden className="size-4" />
              </a>
            ) : data.team.paymentStatus === "not_submitted" || data.team.paymentStatus === "rejected" ? (
              <p className="mt-4 text-sm text-amber">The payment link is not configured yet.</p>
            ) : null}

            {data.team.paymentStatus === "pending" ? (
              <p className="mt-5 flex items-center gap-2 border border-amber/30 bg-amber/5 p-4 text-sm text-amber"><Clock3 aria-hidden className="size-4 shrink-0" /> Your screenshot is in the organiser review queue.</p>
            ) : data.team.paymentStatus === "confirmed" ? (
              <p className="mt-5 flex items-center gap-2 border border-green/30 bg-green/5 p-4 text-sm text-green"><Check aria-hidden className="size-4 shrink-0" /> Payment verified. Your seat is confirmed.</p>
            ) : (
              <form onSubmit={uploadProof} className="mt-6 space-y-4 border-t border-line pt-5">
                <label className="block text-sm font-semibold text-fg" htmlFor="payment-proof">Upload payment screenshot</label>
                <input id="payment-proof" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)} className="block w-full text-sm text-dim file:mr-3 file:min-h-11 file:border-0 file:bg-raise file:px-3 file:text-sm file:text-fg" />
                <p className="text-xs leading-relaxed text-faint">PNG, JPEG, or WebP. Up to 3 MB. Organisers can view the image to verify your seat.</p>
                <button type="submit" disabled={busy || !file} className="inline-flex min-h-11 items-center gap-2 border border-line-hi px-4 text-sm text-fg disabled:cursor-not-allowed disabled:opacity-50 hover:border-green hover:text-green">
                  <Upload aria-hidden className="size-4" /> {busy ? "Uploading…" : "Submit for review"}
                </button>
              </form>
            )}
          </Pane>
          ) : (
            <Pane title="seat-confirmed" className="p-5 sm:p-6">
              <h3 className="text-lg font-bold text-green">Your seat is confirmed</h3>
              <p className="mt-3 text-sm leading-relaxed text-dim">Your payment has been verified by the organisers. Please watch the announcements page for event updates.</p>
              {data.round2ChoicesOpen || data.team.round2TrackId || data.team.round2ProblemStatementId ? (
                <div className="mt-6 border-t border-line pt-5">
                  <h3 className="text-sm font-bold text-fg">Round 2 problem statement</h3>
                  {selectedProblem ? <p className="mt-2 text-sm text-green">{selectedProblem.track.name} · {selectedProblem.problem.name}</p> : <p className="mt-2 text-sm text-dim">Choose one problem statement from the available tracks.</p>}
                  {data.team.round2TrackId || data.team.round2ProblemStatementId ? (
                    <p className="mt-3 flex items-center gap-2 border border-green/30 bg-green/5 p-3 text-sm text-green"><LockKeyhole aria-hidden className="size-4 shrink-0" /> This choice is confirmed and locked.</p>
                  ) : data.round2ChoicesOpen ? (
                    <form onSubmit={submitProblemChoice} className="mt-4 space-y-3">
                      <label htmlFor="round2-track" className="block text-xs font-semibold text-dim">Track</label>
                      <select id="round2-track" required value={round2TrackId} onChange={(event) => { setRound2TrackId(event.currentTarget.value); setRound2ProblemStatementId(""); }} className="min-h-11 w-full border border-line-hi bg-bg px-3 text-sm text-fg">
                        <option value="">Choose a track</option>
                        {ROUND2_TRACKS.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
                      </select>
                      <p className="text-xs leading-relaxed text-dim">{ROUND2_TRACKS.find((track) => track.id === round2TrackId)?.rule}</p>
                      <label htmlFor="round2-problem" className="block text-xs font-semibold text-dim">Problem statement</label>
                      <select id="round2-problem" required value={round2ProblemStatementId} onChange={(event) => setRound2ProblemStatementId(event.currentTarget.value)} disabled={!round2TrackId} className="min-h-11 w-full border border-line-hi bg-bg px-3 text-sm text-fg disabled:opacity-50">
                        <option value="">Choose a problem statement</option>
                        {ROUND2_TRACKS.find((track) => track.id === round2TrackId)?.problems.map((problem) => <option key={problem.id} value={problem.id}>{problem.name}</option>)}
                      </select>
                      <button type="submit" disabled={busy || !round2TrackId || !round2ProblemStatementId} className="inline-flex min-h-11 items-center gap-2 bg-green px-4 text-sm font-bold text-green-ink disabled:opacity-50">Review choice</button>
                      {round2Notice && <p role="status" className="text-sm text-green">{round2Notice}</p>}
                    </form>
                  ) : <p className="mt-2 text-xs text-faint">Choices are closed. Contact the organisers if you need a correction.</p>}
                  {data.team.round3Qualified && <p className="mt-3 border border-green/30 bg-green/5 p-3 text-sm text-green">Your team has advanced to Round 3.</p>}
                </div>
              ) : null}
              {data.githubRepoSubmissionEnabled && (
                <form onSubmit={submitGithubRepo} className="mt-6 space-y-4 border-t border-line pt-5">
                  <div className="flex items-center gap-2 text-fg"><GitBranch aria-hidden className="size-5" /><h3 className="text-sm font-bold">Hackathon GitHub repository</h3></div>
                  <p className="text-sm leading-relaxed text-dim">Create an empty GitHub repository for your team and submit its link here. Do not add files yet.</p>
                  {data.team.githubRepoUrl && <p className="text-xs text-dim">Current link: <a href={data.team.githubRepoUrl} target="_blank" rel="noreferrer" className="break-all text-green underline underline-offset-4">{data.team.githubRepoUrl}</a></p>}
                  <label htmlFor="github-repo-url" className="block text-sm font-semibold text-fg">Repository URL</label>
                  <input id="github-repo-url" type="url" inputMode="url" autoComplete="url" required value={githubRepoUrl} onChange={(event) => setGithubRepoUrl(event.currentTarget.value)} placeholder="https://github.com/team/repository" className="min-h-12 w-full border border-line-hi bg-bg px-3 text-sm text-fg placeholder:text-faint" />
                  <button type="submit" disabled={busy || !githubRepoUrl.trim()} className="inline-flex min-h-11 items-center gap-2 bg-green px-4 text-sm font-bold text-green-ink disabled:cursor-not-allowed disabled:opacity-50"><GitBranch aria-hidden className="size-4" /> {busy ? "Saving…" : data.team.githubRepoUrl ? "Update repository link" : "Submit repository link"}</button>
                  {githubNotice && <p role="status" className="text-sm text-green">{githubNotice}</p>}
                </form>
              )}
            </Pane>
          )}
        </div>
      ) : signedOut ? (
        <Pane title="team sign-in" className="mx-auto max-w-xl p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center border border-green/30 bg-green/5 text-green"><LockKeyhole aria-hidden className="size-5" /></span>
            <div><h2 className="font-bold text-fg">Open your team portal</h2><p className="mt-1 text-xs text-dim">Access is limited to this team’s payment and contact details.</p></div>
          </div>
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <label htmlFor="leader-email" className="block text-sm font-semibold text-fg">Leader’s registered email</label>
            <input id="leader-email" type="email" autoComplete="username" inputMode="email" required value={email} onChange={(event) => setEmail(event.currentTarget.value)} placeholder="name@example.com" className="min-h-12 w-full border border-line-hi bg-bg px-3 text-sm text-fg placeholder:text-faint" />
            <p className="text-xs leading-relaxed text-faint">Enter the same email used in the team submission. It acts as this team’s password.</p>
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 bg-green px-4 text-sm font-bold text-green-ink disabled:opacity-50">
              <LockKeyhole aria-hidden className="size-4" /> {busy ? "Signing in…" : "Open team portal"}
            </button>
          </form>
        </Pane>
      ) : (
        <Pane title="loading team record" className="mx-auto max-w-xl p-6">
          <p className="text-sm text-dim">Loading team status…</p>
          {error && <p role="alert" className="mt-4 text-sm text-red">{error}</p>}
          <button type="button" onClick={() => { setSignedOut(true); setError(""); }} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-dim hover:text-green">
            <ImagePlus aria-hidden className="size-4" /> Continue to sign in
          </button>
        </Pane>
      )}
      {error && (data || signedOut) && <p role="alert" className="border border-red/30 bg-red/5 p-3 text-sm text-red">{error}</p>}
      <p className="text-xs text-faint">Need help? Contact <a className="underline underline-offset-4 hover:text-green" href="mailto:bigo@acharya.ac.in">The Big O organisers</a>.</p>
    </div>
  );
}
