"use client";

import { ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { catalogStorageKey, restoreCatalog, store } from "../store/store";
import { useEffect, useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, retry: 1 } } }));
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(catalogStorageKey);
      if (saved) store.dispatch(restoreCatalog(JSON.parse(saved)));
    } catch {
      window.localStorage.removeItem(catalogStorageKey);
    }
    const unsubscribe = store.subscribe(() => {
      try { window.localStorage.setItem(catalogStorageKey, JSON.stringify(store.getState().catalog)); } catch { /* storage may be unavailable */ }
    });
    return unsubscribe;
  }, []);
  return (
      <Provider store={store}><QueryClientProvider client={queryClient}><ConfigProvider theme={{ token: { colorPrimary: "#758064", colorText: "#252820", borderRadius: 10, fontFamily: "Arial, Helvetica, sans-serif" } }}>{children}<Toaster position="top-right" /></ConfigProvider></QueryClientProvider></Provider>
  );
}
