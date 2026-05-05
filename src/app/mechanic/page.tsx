"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMLang } from "@/lib/mechanic-i18n";

interface Booking {
  id: string;
  name: string;
  phone: string;
  car_make: string;
  car_model: string;
  car_year: string;
  service_type: string;
  location: string;
  description: string | null;
  status: string;
  preferred_date: string;
}

interface Me {
  mechanic: {
    id: string;
    full_name: string;
    availability: "available" | "busy" | "off";
  };
  today: { jobsDone: number; cashCollected: number; revenue: number; estCommission: number };
}

const serviceLabel: Record<string, { am: string; en: string }> = {
  preventative: { am: "የመከላከያ", en: "Preventative" },
  routine: { am: "ተራ ጥገና", en: "Routine" },
  roadside: { am: "የመንገድ ላይ", en: "Roadside" },
  other: { am: "ሌላ", en: "Other" },
};

function fmtETB(n: number) {
  return new Intl.NumberFormat("en-ET").format(Math.round(n)) + " ETB";
}

export default function MechanicDashboard() {
  const router = useRouter();
  const { lang, setLang, t } = useMLang();
  const [me, setMe] = useState<Me | null>(null);
  const [active, setActive] = useState<Booking[]>([]);
  const [assigned, setAssigned] = useState<Booking[]>([]);
  const [open, setOpen] = useState<Booking[]>([]);
  const [showWalkin, setShowWalkin] = useState(false);
  const [loading, setLoading] = useState(true);

  const headers = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("mechanic-token") : "";
    return { "x-mechanic-token": token || "", "Content-Type": "application/json" };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [meRes, jobsRes] = await Promise.all([
        fetch("/api/mechanic/me", { headers: headers() }),
        fetch("/api/mechanic/jobs", { headers: headers() }),
      ]);
      if (meRes.status === 401 || jobsRes.status === 401) {
        localStorage.removeItem("mechanic-token");
        router.replace("/mechanic/login");
        return;
      }
      const meData = await meRes.json();
      const jobsData = await jobsRes.json();
      setMe(meData);
      setActive(jobsData.active || []);
      setAssigned(jobsData.assigned || []);
      setOpen(jobsData.open || []);
    } finally {
      setLoading(false);
    }
  }, [headers, router]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  const setAvailability = async (av: "available" | "busy" | "off") => {
    await fetch("/api/mechanic/availability", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ availability: av }),
    });
    refresh();
  };

  const startJob = async (id: string) => {
    const res = await fetch(`/api/mechanic/jobs/${id}/start`, {
      method: "PATCH",
      headers: headers(),
    });
    if (res.ok) router.push(`/mechanic/job/${id}`);
    else {
      const err = await res.json();
      alert(err.error || "Failed");
    }
  };

  const signOut = async () => {
    await fetch("/api/mechanic/auth/logout", { method: "POST", headers: headers() });
    localStorage.removeItem("mechanic-token");
    localStorage.removeItem("mechanic-name");
    localStorage.removeItem("mechanic-id");
    router.replace("/mechanic/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">…</div>;
  }

  const av = me?.mechanic.availability || "off";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-10 shadow">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">{t("hi")}</p>
            <p className="font-bold truncate max-w-[180px]">{me?.mechanic.full_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === "am" ? "en" : "am")} className="text-sm underline opacity-80">
              {lang === "am" ? "EN" : "አማ"}
            </button>
            <button onClick={signOut} className="text-sm opacity-80 underline">
              {t("signOut")}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-5">
        {/* Availability toggle */}
        <div className="grid grid-cols-3 gap-2">
          {(["available", "busy", "off"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setAvailability(s)}
              className={`py-3 rounded-xl font-bold text-sm transition-colors ${
                av === s
                  ? s === "available"
                    ? "bg-green-600 text-white"
                    : s === "busy"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-700 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {t(s)}
            </button>
          ))}
        </div>

        {/* Walk-in CTA */}
        <button
          onClick={() => setShowWalkin(true)}
          className="w-full py-5 bg-accent hover:opacity-90 text-white text-lg font-bold rounded-2xl shadow-sm"
        >
          {t("newWalkin")}
        </button>

        {/* Active job */}
        {active.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
              {t("activeJob")}
            </h2>
            <div className="space-y-3">
              {active.map((b) => (
                <JobCard
                  key={b.id}
                  booking={b}
                  lang={lang}
                  primary={
                    <Link
                      href={`/mechanic/job/${b.id}`}
                      className="block w-full text-center py-4 bg-primary hover:bg-primary-light text-white text-lg font-bold rounded-xl"
                    >
                      {t("continue")}
                    </Link>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Assigned */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
            {t("assigned")}
          </h2>
          {assigned.length === 0 ? (
            <p className="text-gray-400 text-sm bg-white rounded-xl p-4 text-center">{t("noJobs")}</p>
          ) : (
            <div className="space-y-3">
              {assigned.map((b) => (
                <JobCard
                  key={b.id}
                  booking={b}
                  lang={lang}
                  primary={
                    <button
                      onClick={() => startJob(b.id)}
                      className="block w-full text-center py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl"
                    >
                      {t("startWork")}
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Open / unassigned */}
        {open.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
              {t("open")}
            </h2>
            <div className="space-y-3">
              {open.map((b) => (
                <JobCard
                  key={b.id}
                  booking={b}
                  lang={lang}
                  primary={
                    <button
                      onClick={() => startJob(b.id)}
                      className="block w-full text-center py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl"
                    >
                      {t("pickUp")}
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Today tally */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">{t("today")}</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{me?.today.jobsDone || 0}</p>
              <p className="text-xs text-gray-500">{t("jobsDone")}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-700">{fmtETB(me?.today.cashCollected || 0)}</p>
              <p className="text-xs text-gray-500">{t("cash")}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-700">{fmtETB(me?.today.estCommission || 0)}</p>
              <p className="text-xs text-gray-500">{t("estCommission")}</p>
            </div>
          </div>
        </section>
      </main>

      {showWalkin && (
        <WalkinModal
          lang={lang}
          onClose={() => setShowWalkin(false)}
          onCreated={(id) => {
            setShowWalkin(false);
            router.push(`/mechanic/job/${id}`);
          }}
        />
      )}
    </div>
  );
}

function JobCard({
  booking,
  lang,
  primary,
}: {
  booking: Booking;
  lang: "am" | "en";
  primary: React.ReactNode;
}) {
  const svc = serviceLabel[booking.service_type]?.[lang] || booking.service_type;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 truncate">{booking.name}</p>
          <p className="text-sm text-gray-500 truncate">
            {booking.car_year} {booking.car_make} {booking.car_model}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              {svc}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1 truncate">📍 {booking.location}</p>
        </div>
        <a
          href={`tel:${booking.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl"
          aria-label="call"
        >
          📞
        </a>
      </div>
      {primary}
    </div>
  );
}

function WalkinModal({
  lang,
  onClose,
  onCreated,
}: {
  lang: "am" | "en";
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useMLang();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    car_make: "",
    car_model: "",
    car_year: "",
    service_type: "roadside",
    location: "",
    description: "",
    source: "phone" as "phone" | "walk_in",
    start_now: true,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("mechanic-token") || "";
      const res = await fetch("/api/mechanic/jobs/manual", {
        method: "POST",
        headers: { "x-mechanic-token": token, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed");
        return;
      }
      onCreated(data.id);
    } finally {
      setSaving(false);
    }
  };

  const upd = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const services: Array<{ value: string; label: string }> = [
    { value: "roadside", label: serviceLabel.roadside[lang] },
    { value: "preventative", label: serviceLabel.preventative[lang] },
    { value: "routine", label: serviceLabel.routine[lang] },
    { value: "other", label: serviceLabel.other[lang] },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-lg">{t("newJob")}</h3>
          <button onClick={onClose} className="text-gray-500 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <Field label={t("customerName")} value={form.name} onChange={(v) => upd("name", v)} required />
          <Field label={t("phone")} value={form.phone} onChange={(v) => upd("phone", v)} type="tel" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("carMake")} value={form.car_make} onChange={(v) => upd("car_make", v)} required />
            <Field label={t("carModel")} value={form.car_model} onChange={(v) => upd("car_model", v)} required />
          </div>
          <Field label={t("carYear")} value={form.car_year} onChange={(v) => upd("car_year", v)} />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t("serviceType")}</label>
            <select
              value={form.service_type}
              onChange={(e) => upd("service_type", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base"
            >
              {services.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <Field label={t("location")} value={form.location} onChange={(v) => upd("location", v)} required />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t("description")}</label>
            <textarea
              value={form.description}
              onChange={(e) => upd("description", e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t("source")}</label>
            <div className="grid grid-cols-2 gap-2">
              {(["phone", "walk_in"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => upd("source", s)}
                  className={`py-3 rounded-xl font-bold text-sm ${
                    form.source === s ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {s === "phone" ? t("sourcePhone") : t("sourceWalkin")}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              checked={form.start_now}
              onChange={(e) => upd("start_now", e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-base font-medium">{t("startNow")}</span>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-green-600 disabled:bg-gray-300 text-white text-lg font-bold rounded-xl"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base"
      />
    </div>
  );
}
