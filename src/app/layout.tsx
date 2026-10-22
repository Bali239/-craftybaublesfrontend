import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "antd/dist/reset.css";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Naqash Corner | Thoughtfully chosen",
  description: "Discover thoughtfully chosen products at Naqash Corner.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f4f1eb] font-sans text-[#252820] antialiased">
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
