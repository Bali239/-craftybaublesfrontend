"use client";

import { ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { catalogStorageKey, restoreCatalog, store } from "../store/store";
import { useEffect, useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, retry: 1 },
        },
      }),
  );
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(catalogStorageKey);
      if (saved) store.dispatch(restoreCatalog(JSON.parse(saved)));
    } catch {
      window.localStorage.removeItem(catalogStorageKey);
    }
    const unsubscribe = store.subscribe(() => {
      try {
        window.localStorage.setItem(
          catalogStorageKey,
          JSON.stringify(store.getState().catalog),
        );
      } catch {
        /* storage may be unavailable */
      }
    });
    return unsubscribe;
  }, []);
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#758064",
              colorText: "#252820",
              borderRadius: 10,
              fontFamily: "Arial, Helvetica, sans-serif",
            },
          }}
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand
            className="!left-3 !right-3 !top-[max(0.75rem,env(safe-area-inset-top))] !w-auto sm:!left-auto sm:!right-4 sm:!top-4 sm:!w-[min(26rem,calc(100vw-2rem))]"
            toastOptions={{
              className:
                "!min-h-[3.25rem] !w-full !rounded-xl !border !border-[#e7e5dc] !bg-white !px-4 !py-3 !text-sm !leading-snug !text-[#252820] !shadow-lg",
              duration: 4000,
            }}
          />
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}
