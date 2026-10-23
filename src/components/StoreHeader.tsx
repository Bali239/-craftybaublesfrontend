"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { App, Avatar, Button } from "antd";
import { api } from "../lib/api";
import { clearSession, readSession, saveSession, type StoreUser } from "../lib/session";
import GoogleSignInButton from "./GoogleSignInButton";

export default function StoreHeader() {
  const { message } = App.useApp();
  const router = useRouter();
  const [user, setUser] = useState<StoreUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const handoff = fragment.get("session");
    if (handoff) {
      try {
        const session = JSON.parse(handoff);
        if (session.token && Date.parse(session.expiresAt) > Date.now()) saveSession(session);
      } catch { message.error("Sign-in response could not be read."); }
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    const authError = new URLSearchParams(window.location.search).get("auth_error");
    if (authError) {
      message.error(authError);
      const search = new URLSearchParams(window.location.search);
      search.delete("auth_error");
      const query = search.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    }
    const session = readSession();
    if (!session) { const task = window.setTimeout(() => { if (!cancelled) setReady(true); }, 0); return () => { cancelled = true; window.clearTimeout(task); }; }
    api<{ user: StoreUser }>("/api/auth/me").then(({ user: nextUser }) => {
      if (!cancelled) { setUser(nextUser); saveSession({ ...session, user: nextUser }); }
    }).catch(() => { clearSession(); if (!cancelled) setUser(null); }).finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [message]);
  const logout = async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch { /* local sign-out still clears this device */ }
    clearSession(); setUser(null); router.push("/");
  };
  return <header className="sticky top-0 z-20 border-b border-[#e8e6de] bg-[#fbfaf7]/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
      <Link href="/" className="font-serif text-xl text-[#303429]">NaqshCorner</Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/cart" className="px-2 text-[#53594c] hover:text-[#8a7051]">Cart</Link>
        {user?.role === "admin" && <Link href="/admin" className="px-2 text-[#53594c]">Manage store</Link>}
        {ready && (user ? <><Avatar size="small" src={user.photoUrl}>{user.name[0]}</Avatar><span className="hidden text-[#53594c] sm:inline">{user.name.split(" ")[0]}</span><Button size="small" onClick={logout}>Sign out</Button></> : <GoogleSignInButton type="primary" shape="round">Sign in</GoogleSignInButton>)}
      </nav>
    </div>
  </header>;
}
