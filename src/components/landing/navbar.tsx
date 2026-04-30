"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { CONTACT } from "@/lib/contact";
import LangToggle from "@/components/lang-toggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkClass = (active: boolean) =>
    `text-sm font-medium transition-colors ${
      scrolled
        ? "text-gray-600 hover:text-primary"
        : "text-white/80 hover:text-white"
    } ${active ? (scrolled ? "text-primary" : "text-white") : ""}`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <span
              className={`text-2xl font-bold transition-colors ${
                scrolled ? "text-primary" : "text-white"
              }`}
            >
              Car<span className="text-accent">Care</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/#services" className={linkClass(false)}>
              {t("nav.services")}
            </Link>
            <Link href="/subscription" className={linkClass(false)}>
              {t("nav.subscription")}
            </Link>
            <a
              href={`tel:${CONTACT.phonePrimary}`}
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                scrolled ? "text-gray-600 hover:text-primary" : "text-white/80 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t("nav.callUs")}
            </a>
            <LangToggle variant={scrolled ? "light" : "dark"} />
            <Link
              href="/book"
              className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {t("nav.bookNow")}
            </Link>
          </div>

          {/* Mobile cluster */}
          <div className="flex md:hidden items-center gap-2">
            <LangToggle variant={scrolled ? "light" : "dark"} />
            <Link
              href="/book"
              className="px-3 py-2 bg-accent hover:bg-accent-dark text-white text-xs font-semibold rounded-lg"
            >
              {t("nav.bookNow")}
            </Link>
            <button
              onClick={() => setMobileOpen((s) => !s)}
              aria-label="Menu"
              className={`p-2 rounded-lg ${scrolled ? "text-primary hover:bg-gray-100" : "text-white hover:bg-white/10"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-3 bg-white rounded-xl shadow-lg p-4 space-y-3">
            <Link href="/#services" className="block text-gray-700 font-medium" onClick={() => setMobileOpen(false)}>
              {t("nav.services")}
            </Link>
            <Link href="/subscription" className="block text-gray-700 font-medium" onClick={() => setMobileOpen(false)}>
              {t("nav.subscription")}
            </Link>
            <a href={`tel:${CONTACT.phonePrimary}`} className="block text-gray-700 font-medium">
              {t("nav.callUs")}
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
