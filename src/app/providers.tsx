"use client";

import { ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { store } from "../store/store";
import { useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, retry: 1 } } }));
  return (
      <Provider store={store}><QueryClientProvider client={queryClient}><ConfigProvider theme={{ token: { colorPrimary: "#758064", colorText: "#252820", borderRadius: 10, fontFamily: "Arial, Helvetica, sans-serif" } }}>{children}<Toaster position="top-right" /></ConfigProvider></QueryClientProvider></Provider>
  );
}
