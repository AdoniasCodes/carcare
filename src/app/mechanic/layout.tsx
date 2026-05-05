"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("mechanic-token") : null;
    if (!token && pathname !== "/mechanic/login") {
      router.replace("/mechanic/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (pathname === "/mechanic/login") return <>{children}</>;
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>
    );
  }
  return <>{children}</>;
}
