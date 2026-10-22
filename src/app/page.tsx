"use client";

import { useEffect, useState } from "react";
import { Alert, Avatar, Button, Card } from "antd";

type AuthUser = { id: string; name: string; username: string; email: string; photoUrl: string };
const SESSION_STORAGE_KEY = "naqashcorner.session";
type StoredSession = { token: string; user: AuthUser; expiresAt: string };

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    let cancelled = false;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const sessionResponse = fragment.get("session");
    if (sessionResponse) {
      try {
        const session = JSON.parse(sessionResponse) as StoredSession;
        if (session.token && Date.parse(session.expiresAt) > Date.now()) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          window.setTimeout(() => { if (!cancelled) setUser(session.user); }, 0);
        } else window.setTimeout(() => { if (!cancelled) setError("Sign-in session was invalid. Please try again."); }, 0);
      } catch { window.setTimeout(() => { if (!cancelled) setError("Sign-in response could not be read. Please try again."); }, 0); }
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      return () => { cancelled = true; };
    }
    const authError = new URLSearchParams(window.location.search).get("auth_error");
    if (authError) {
      window.setTimeout(() => { if (!cancelled) setError(authError); }, 0);
      window.history.replaceState(null, "", window.location.pathname);
    }
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return () => { cancelled = true; };
    let session: StoredSession;
    try { session = JSON.parse(stored); }
    catch { localStorage.removeItem(SESSION_STORAGE_KEY); return () => { cancelled = true; }; }
    if (!session.token || Date.parse(session.expiresAt) <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return () => { cancelled = true; };
    }
    fetch(`${apiUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (data?.user) { session.user = data.user; localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session)); setUser(data.user); }
        else localStorage.removeItem(SESSION_STORAGE_KEY);
      })
      .catch(() => { if (!cancelled) setError("Could not connect to the authentication server."); });
    return () => { cancelled = true; };
  }, [apiUrl]);

  const signOut = async () => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    setSigningOut(true);
    try {
      if (stored) {
        const session = JSON.parse(stored) as StoredSession;
        await fetch(`${apiUrl}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` } });
      }
    } finally { localStorage.removeItem(SESSION_STORAGE_KEY); setUser(null); setSigningOut(false); }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#fbfaf7] via-[#f4f1eb] to-[#ece9df] px-5 py-9">
      <Card
        className="w-full max-w-[480px] border border-[#535845]/10 bg-white/85 text-center shadow-[0_20px_70px_rgba(53,56,44,0.07)]"
        styles={{ body: { padding: 0 } }}
      >
        <div className="px-6 py-11 sm:px-[58px] sm:py-14">
          <div aria-hidden="true" className="mx-auto mb-6 grid size-12 place-items-center rounded-full border border-[#9ba18d] font-serif text-2xl text-[#59634c]">
            N<span className="text-[#b08b58]">.</span>
          </div>
          <p className="mb-[22px] text-[10px] font-bold tracking-[0.25em] text-[#7c806f]">NAQASH CORNER</p>
          {user ? <>
            <h1 className="font-serif text-[31px] font-normal leading-tight tracking-[-0.025em] text-[#282b24] sm:text-[35px]">
              Welcome, {user.name.split(" ")[0]}.
            </h1>
            <p className="mx-auto mb-7 mt-4 max-w-[320px] text-sm leading-7 text-[#77796e]">You’re signed in and ready to continue.</p>
            <div className="mx-auto mb-6 flex max-w-[320px] items-center gap-3.5 rounded-md border border-[#e6e6dc] p-4 text-left">
              <Avatar size={48} src={user.photoUrl} alt={user.name}>{user.name[0]}</Avatar>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#282b24]">{user.username}</p>
                <p className="truncate text-xs text-[#77796e]">{user.email}</p>
              </div>
            </div>
            <Button shape="round" onClick={signOut} loading={signingOut} className="!h-10 !border-[#d8dbcf] !px-6 !text-[#4f5944]">
              Sign out
            </Button>
          </> : <>
            <h1 className="font-serif text-[31px] font-normal leading-tight tracking-[-0.025em] text-[#282b24] sm:text-[35px]">
              Your next chapter<br />starts here.
            </h1>
            <p className="mx-auto mb-7 mt-4 max-w-[320px] text-sm leading-7 text-[#77796e]">
              Sign in to your Naqash Corner account to pick up where you left off.
            </p>
            <Button
              href={`${apiUrl}/api/auth/google`}
              size="large"
              block
              shape="round"
              icon={<span aria-hidden="true" className="font-bold text-[#4285f4]">G</span>}
              className="!h-12 !border-[#d6d8cf] !bg-white !font-semibold !text-[#3e4438] shadow-sm hover:!border-[#aeb4a2]"
            >
              Continue with Google
            </Button>
            {error && <Alert className="mt-4 text-left" type="error" showIcon message={error} />}
            <p className="mb-0 mt-7 text-[11px] leading-5 text-[#98998f]">
              By continuing, you agree to our <a className="text-[#626b52] underline underline-offset-2" href="#terms">Terms</a> and <a className="text-[#626b52] underline underline-offset-2" href="#privacy">Privacy Policy</a>.
            </p>
          </>}
        </div>
      </Card>
      <footer className="mt-6 font-serif text-[13px] italic text-[#99998f]">Thoughtfully made for what matters.</footer>
    </main>
  );
}
