"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_URL, api } from "../../../lib/api";
import {
  clearSession,
  readSession,
  saveSession,
  type StoreUser,
} from "../../../lib/session";
import { disconnectSocket } from "../../../lib/socket";
import NotificationBell from "../../notifications/components/NotificationBell";

export default function StoreHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StoreUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const handoff = fragment.get("session");
    if (handoff) {
      try {
        const session = JSON.parse(handoff);
        if (session.token && Date.parse(session.expiresAt) > Date.now())
          saveSession(session);
      } catch {
        toast.error("Sign-in response could not be read.");
      }
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }

    const authError = new URLSearchParams(window.location.search).get(
      "auth_error",
    );
    if (authError) {
      toast.error(authError);
      const search = new URLSearchParams(window.location.search);
      search.delete("auth_error");
      const query = search.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`,
      );
    }

    const session = readSession();
    if (!session)
      return () => {
        cancelled = true;
      };
    api<{ user: StoreUser }>("/api/auth/me")
      .then(({ user: nextUser }) => {
        if (!cancelled) {
          setUser(nextUser);
          saveSession({ ...session, user: nextUser });
        }
      })
      .catch(() => {
        clearSession();
        disconnectSocket();
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeKey =
    pathname === "/admin"
      ? "admin"
      : pathname === "/cart"
        ? "cart"
        : pathname.startsWith("/wishlist")
          ? "wishlist"
          : pathname.startsWith("/orders")
            ? "orders"
            : pathname === "/shop" || pathname.startsWith("/products/")
              ? "shop"
              : "home";

  const startGoogleSignIn = () => {
    const authorizationUrl = new URL("/api/auth/google", API_URL);
    authorizationUrl.searchParams.set("returnTo", "/cart");
    window.location.assign(authorizationUrl.toString());
  };

  const openCart = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (user && readSession()) return;
    event.preventDefault();

    const session = readSession();
    if (session) {
      try {
        const { user: authenticatedUser } = await api<{ user: StoreUser }>(
          "/api/auth/me",
        );
        saveSession({ ...session, user: authenticatedUser });
        setUser(authenticatedUser);
        router.push("/cart");
        return;
      } catch {
        clearSession();
      }
    }
    startGoogleSignIn();
  };

  const navItems = [
    { key: "home", label: "Home", href: "/" },
    { key: "shop", label: "Shop", href: "/shop" },
    { key: "wishlist", label: "Wishlist", href: "/wishlist" },
    { key: "orders", label: "My Orders", href: "/orders" },
    { key: "cart", label: "Cart", href: "/cart" },
    ...(user?.role === "admin"
      ? [{ key: "admin", label: "Manage Store", href: "/admin" }]
      : []),
  ];

  return (
    <>
      <div aria-hidden="true" className="h-16 sm:h-[76px]" />
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-2 py-3 sm:py-4 [&_a]:cursor-pointer">
        <nav
          aria-label="Primary"
          className="w-fit max-w-full overflow-x-auto rounded-full bg-[#17191d] p-1.5 shadow-lg shadow-black/15"
        >
          <LayoutGroup id="store-nav-active-pill">
            <div className="flex w-max max-w-full items-center justify-center gap-0.5">
              {navItems.map((item) => {
                const active = activeKey === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={item.key === "cart" ? openCart : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`relative isolate flex shrink-0 items-center justify-center rounded-full px-2.5 py-2 text-[11px] font-bold text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#17191d] sm:px-4 sm:py-2.5 sm:text-sm ${active ? "text-[#17191d]" : "hover:text-white"}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="store-nav-active"
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 rounded-full bg-white"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                      />
                    )}
                    <span style={{ color: active ? "#17191d" : "#ffffff" }}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              {user && (
                <div className="ml-1 flex items-center">
                  <NotificationBell />
                </div>
              )}
            </div>
          </LayoutGroup>
        </nav>
      </header>
    </>
  );
}
