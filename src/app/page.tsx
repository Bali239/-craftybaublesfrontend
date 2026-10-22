"use client";

import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = {
  accounts: { id: {
    initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
    renderButton(element: HTMLElement, options: Record<string, string>): void;
  } };
};

type AuthUser = { id: string; name: string; email: string; picture: string };

export default function Home() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const saved = localStorage.getItem("naqashcorner.auth");
    if (saved) {
      try { setUser(JSON.parse(saved).user); } catch { localStorage.removeItem("naqashcorner.auth"); }
    }
  }, []);

  useEffect(() => {
    if (!clientId || !buttonRef.current || user) return;
    let script = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const render = () => {
      const googleIdentity = (window as Window & { google?: GoogleIdentity }).google;
      if (!googleIdentity || !buttonRef.current) return;
      googleIdentity.accounts.id.initialize({ client_id: clientId, callback: async ({ credential }) => {
        setLoading(true); setError("");
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/google`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Unable to sign in.");
          localStorage.setItem("naqashcorner.auth", JSON.stringify(data)); setUser(data.user);
        } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in."); }
        finally { setLoading(false); }
      } });
      googleIdentity.accounts.id.renderButton(buttonRef.current, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: "320" });
    };
    if (!script) {
      script = document.createElement("script"); script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.defer = true;
      script.onload = render; document.head.appendChild(script);
    } else if ((window as Window & { google?: unknown }).google) render(); else script.addEventListener("load", render, { once: true });
  }, [clientId, user]);

  const signOut = () => { localStorage.removeItem("naqashcorner.auth"); setUser(null); };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark" aria-hidden="true">N<span>.</span></div>
        <p className="eyebrow">NAQASH CORNER</p>
        {user ? <>
          <h1>Welcome, {user.name.split(" ")[0]}.</h1>
          <p className="subtitle">You’re signed in and ready to continue.</p>
          <div className="profile">
            {user.picture ? <img src={user.picture} alt="" /> : <div className="avatar-fallback">{user.name[0]}</div>}
            <div><strong>{user.name}</strong><span>{user.email}</span></div>
          </div>
          <button className="signout" onClick={signOut}>Sign out</button>
        </> : <>
          <h1>Your next chapter<br />starts here.</h1>
          <p className="subtitle">Sign in to your Naqash Corner account to pick up where you left off.</p>
          <div className="signin-area">
            {clientId ? <div ref={buttonRef} className="google-button" /> : <p className="config-error">Google sign-in needs a client ID. Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.</p>}
          </div>
          {loading && <p className="status">Signing you in…</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <p className="terms">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
        </>}
      </section>
      <footer>Thoughtfully made for what matters.</footer>
    </main>
  );
}
