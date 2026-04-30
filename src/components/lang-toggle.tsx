"use client";

import { useLang } from "@/lib/i18n";

interface Props {
  variant?: "light" | "dark";
}

export default function LangToggle({ variant = "dark" }: Props) {
  const { lang, setLang } = useLang();
  const isDark = variant === "dark";

  return (
    <div
      className={`inline-flex items-center rounded-full p-0.5 text-xs font-semibold ${
        isDark ? "bg-white/10 border border-white/20" : "bg-gray-100"
      }`}
      role="group"
      aria-label="Language"
    >
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 rounded-full transition-colors ${
          lang === "en"
            ? isDark ? "bg-white text-primary" : "bg-primary text-white"
            : isDark ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-gray-800"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLang("am")}
        className={`px-3 py-1 rounded-full transition-colors ${
          lang === "am"
            ? isDark ? "bg-white text-primary" : "bg-primary text-white"
            : isDark ? "text-white/70 hover:text-white" : "text-gray-500 hover:text-gray-800"
        }`}
        aria-pressed={lang === "am"}
      >
        አማ
      </button>
    </div>
  );
}
