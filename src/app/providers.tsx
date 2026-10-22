"use client";

import { App, ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { store } from "../store/store";
import { useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }));
  return (
    <Provider store={store}><QueryClientProvider client={queryClient}><ConfigProvider theme={{ token: { colorPrimary: "#758064", colorText: "#252820", borderRadius: 10, fontFamily: "Arial, Helvetica, sans-serif" } }}><App>{children}</App></ConfigProvider></QueryClientProvider></Provider>
  );
}
