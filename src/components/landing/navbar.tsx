"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span
              className={`text-2xl font-bold transition-colors ${
                scrolled ? "text-primary" : "text-white"
              }`}
            >
              Car<span className="text-accent">Care</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-6">
            <a
              href="#services"
              className={`text-sm font-medium transition-colors ${
                scrolled
                  ? "text-gray-600 hover:text-primary"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Services
            </a>
            <a
              href="tel:+251900000000"
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                scrolled
                  ? "text-gray-600 hover:text-primary"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Us
            </a>
            <Link
              href="/book"
              className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile CTA */}
          <Link
            href="/book"
            className="sm:hidden px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Book Now
          </Link>
        </div>
      </div>
    </nav>
  );
}
