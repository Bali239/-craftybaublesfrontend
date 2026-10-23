"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type FooterRevealProps = { children: ReactNode };

/** Renders the store footer directly after the page content. */
export default function FooterReveal({ children }: FooterRevealProps) {
  const pathname = usePathname();
  const hideFooter = pathname !== "/";

  if (hideFooter) {
    return <div className="w-full bg-[#fbfaf7]">{children}</div>;
  }

  return (
    <div className="w-full [&_a]:cursor-pointer">
      <div className="bg-[#fbfaf7]">{children}</div>

      <footer className="flex min-h-[360px] items-end bg-[#303429] text-[#fbfaf7] sm:min-h-[390px]">
        <div className="mx-auto w-full max-w-7xl px-5 pb-7 sm:pb-9 ">
          <div className="grid gap-10 border-b border-white/15 pb-10 sm:grid-cols-[1.4fr_0.6fr] sm:gap-8">
            <div className="max-w-lg">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#c6c8b8]">
                Thoughtfully chosen
              </p>
              <p className="mt-4 font-serif text-4xl tracking-tight sm:text-5xl">
                NaqshCorner
              </p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/65">
                Everyday essentials and considered details, gathered in one place.
              </p>
            </div>

            <nav aria-label="Footer" className="sm:justify-self-end">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Explore
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><Link className="text-white/80 transition-colors hover:text-white" href="/#shop">Shop all</Link></li>
                <li><Link className="text-white/80 transition-colors hover:text-white" href="/cart">Your cart</Link></li>
              </ul>
            </nav>
          </div>

          <div className="flex flex-col gap-2 pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} NaqshCorner</span>
            <Link className="transition-colors hover:text-white/80" href="/">
              Thoughtfully made for what matters.
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
