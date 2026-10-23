import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "antd/dist/reset.css";
import "./globals.css";
import Providers from "./providers";
import FooterReveal from "../components/pixel-perfect/footer-reveal";
import StoreHeader from "../components/StoreHeader";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "NaqshCorner | Thoughtfully chosen",
  description: "Discover thoughtfully chosen products at NaqshCorner.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-[#fbfaf7] font-sans text-[#252820] antialiased">
        <AntdRegistry>
          <Providers><StoreHeader /><FooterReveal>{children}</FooterReveal></Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
