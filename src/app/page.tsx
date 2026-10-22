"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type AuthUser = { id: string; name: string; username: string; email: string; photoUrl: string };
const SESSION_STORAGE_KEY = "naqashcorner.session";
type StoredSession = { token: string; user: AuthUser; expiresAt: string };

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
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
    try {
      if (stored) {
        const session = JSON.parse(stored) as StoredSession;
        await fetch(`${apiUrl}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` } });
      }
    } finally { localStorage.removeItem(SESSION_STORAGE_KEY); setUser(null); }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark" aria-hidden="true">N<span>.</span></div>
        <p className="eyebrow">NAQASH CORNER</p>
        {user ? <>
          <h1>Welcome, {user.name.split(" ")[0]}.</h1>
          <p className="subtitle">You’re signed in and ready to continue.</p>
          <div className="profile">
            {user.photoUrl ? <Image src={user.photoUrl} alt="" width={44} height={44} unoptimized referrerPolicy="no-referrer" /> : <div className="avatar-fallback">{user.name[0]}</div>}
            <div><strong>{user.username}</strong><span>{user.email}</span></div>
          </div>
          <button className="signout" onClick={signOut}>Sign out</button>
        </> : <>
          <h1>Your next chapter<br />starts here.</h1>
          <p className="subtitle">Sign in to your Naqash Corner account to pick up where you left off.</p>
          <div className="signin-area">
            <a className="google-button" href={`${apiUrl}/api/auth/google`}>Continue with Google</a>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <p className="terms">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
        </>}
      </section>
      <footer>Thoughtfully made for what matters.</footer>
    </main>
  );
}
