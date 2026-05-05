"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const t = {
  am: {
    title: "የሜካኒክ መግቢያ",
    subtitle: "በስልክ ቁጥር እና በፒን ይግቡ",
    phone: "ስልክ ቁጥር",
    pin: "ፒን (4 ቁጥር)",
    signIn: "ይግቡ",
    signingIn: "በመግባት ላይ...",
    invalid: "ስልክ ወይም ፒን ስህተት ነው",
    error: "ስህተት ተፈጥሯል",
  },
  en: {
    title: "Mechanic Login",
    subtitle: "Sign in with your phone and PIN",
    phone: "Phone Number",
    pin: "PIN (4 digits)",
    signIn: "Sign In",
    signingIn: "Signing in...",
    invalid: "Invalid phone or PIN",
    error: "Something went wrong",
  },
};

export default function MechanicLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"am" | "en">("am");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("mechanic-token")) {
      router.replace("/mechanic");
    }
  }, [router]);

  const L = t[lang];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/mechanic/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || L.invalid);
        return;
      }
      localStorage.setItem("mechanic-token", data.token);
      localStorage.setItem("mechanic-name", data.mechanic.full_name);
      localStorage.setItem("mechanic-id", data.mechanic.id);
      router.push("/mechanic");
    } catch {
      setError(L.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === "am" ? "en" : "am")}
            className="text-sm text-gray-500 underline"
          >
            {lang === "am" ? "English" : "አማርኛ"}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Car<span className="text-accent">Care</span>
          </h1>
          <p className="text-gray-700 mt-3 text-lg font-semibold">{L.title}</p>
          <p className="text-gray-500 mt-1 text-sm">{L.subtitle}</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {L.phone}
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XXXXXXXX"
              className="w-full px-4 py-4 text-lg rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {L.pin}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full px-4 py-4 text-lg tracking-[0.5em] text-center rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !phone || pin.length < 4}
            className="w-full py-4 bg-primary hover:bg-primary-light disabled:bg-gray-300 text-white text-lg font-bold rounded-xl transition-colors"
          >
            {loading ? L.signingIn : L.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}
