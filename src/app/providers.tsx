"use client";

import { ConfigProvider } from "antd";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
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
    </ConfigProvider>
  );
}
