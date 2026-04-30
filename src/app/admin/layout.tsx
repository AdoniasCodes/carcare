"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/bookings", label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: "M3 8l4-4m0 0l4 4m-4-4v18m13-2l-4 4m0 0l-4-4m4 4V3" },
  { href: "/admin/pricing", label: "Pricing", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10" },
  { href: "/admin/promo", label: "Promo Codes", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  { href: "/admin/testimonials", label: "Videos", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem("admin-key");
    if (!key && pathname !== "/admin/login") {
      router.push("/admin/login");
    } else if (key) {
      setAuthenticated(true);
    }
  }, [pathname, router]);

  // Don't wrap login page in admin layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top nav */}
      <header className="bg-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-white">
                Car<span className="text-accent">Care</span>
              </h1>
              <nav className="hidden sm:flex gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("admin-key");
                router.push("/admin/login");
              }}
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="sm:hidden bg-white border-b shadow-sm">
        <div className="flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 px-4 py-3 text-center text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
