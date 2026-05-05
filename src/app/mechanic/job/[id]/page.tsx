"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  before_photos: string[] | null;
  after_photos: string[] | null;
  mechanic_notes: string | null;
  cash_collected: number | null;
  payment_method: string | null;
  revenue: number | null;
  assigned_mechanic_id: string | null;
  started_at: string | null;
}

const serviceLabel: Record<string, { am: string; en: string }> = {
  preventative: { am: "የመከላከያ", en: "Preventative" },
  routine: { am: "ተራ ጥገና", en: "Routine" },
  roadside: { am: "የመንገድ ላይ", en: "Roadside" },
  other: { am: "ሌላ", en: "Other" },
};

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { lang, t } = useMLang();
  const [job, setJob] = useState<Booking | null>(null);
  const [notes, setNotes] = useState("");
  const [cash, setCash] = useState("");
  const [payment, setPayment] = useState<"cash" | "transfer" | "pending">("cash");
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [saving, setSaving] = useState(false);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const headers = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("mechanic-token") : "";
    return { "x-mechanic-token": token || "" };
  }, []);

  const load = useCallback(async () => {
    const res = await fetch(`/api/mechanic/jobs/${id}`, { headers: headers() });
    if (res.status === 401) {
      router.replace("/mechanic/login");
      return;
    }
    if (!res.ok) {
      router.replace("/mechanic");
      return;
    }
    const data = await res.json();
    setJob(data);
    setNotes(data.mechanic_notes || "");
    setCash(data.cash_collected ? String(data.cash_collected) : "");
    if (data.payment_method) setPayment(data.payment_method);
  }, [headers, id, router]);

  useEffect(() => { load(); }, [load]);

  const uploadPhotos = async (phase: "before" | "after", files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(phase);
    try {
      const fd = new FormData();
      fd.append("phase", phase);
      Array.from(files).forEach((f) => fd.append("photos", f));
      const res = await fetch(`/api/mechanic/jobs/${id}/photos`, {
        method: "POST",
        headers: headers(),
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Upload failed");
        return;
      }
      await load();
    } finally {
      setUploading(null);
    }
  };

  const complete = async () => {
    if (!confirm(lang === "am" ? "ሥራውን ጨርሻለሁ?" : "Mark this job as done?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/mechanic/jobs/${id}/complete`, {
        method: "PATCH",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({
          cash_collected: cash || 0,
          payment_method: payment,
          mechanic_notes: notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed");
        return;
      }
      router.push("/mechanic");
    } finally {
      setSaving(false);
    }
  };

  if (!job) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">…</div>;
  }

  const svc = serviceLabel[job.service_type]?.[lang] || job.service_type;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`;
  const isActive = job.status === "in_progress";

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-primary text-white sticky top-0 z-10 shadow">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/mechanic" className="text-sm underline opacity-90">
            {t("back")}
          </Link>
          <span className="text-xs opacity-70">{job.id}</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-5">
        {/* Customer */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-xl">{job.name}</p>
            <a
              href={`tel:${job.phone}`}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl text-sm"
            >
              📞 {t("call")}
            </a>
          </div>
          <p className="text-gray-600">
            <span className="font-semibold">{t("car")}:</span> {job.car_year} {job.car_make} {job.car_model}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">{t("service")}:</span> {svc}
          </p>
          {job.description && (
            <p className="text-gray-600 mt-1 text-sm">{job.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-gray-700 text-sm truncate">📍 {job.location}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline text-sm font-semibold ml-3 shrink-0"
            >
              {t("openMap")}
            </a>
          </div>
        </section>

        {/* Before photos */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-2">{t("before")}</h2>
          <PhotoGrid urls={job.before_photos || []} emptyLabel={t("noPhotos")} />
          <input
            ref={beforeRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => uploadPhotos("before", e.target.files)}
          />
          <button
            onClick={() => beforeRef.current?.click()}
            disabled={uploading === "before"}
            className="mt-3 w-full py-4 bg-gray-800 disabled:bg-gray-400 text-white font-bold rounded-xl text-base"
          >
            {uploading === "before" ? t("uploading") : t("takeBefore")}
          </button>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block font-bold text-gray-800 mb-2">{t("notes")}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base"
          />
        </section>

        {/* After photos */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-2">{t("after")}</h2>
          <PhotoGrid urls={job.after_photos || []} emptyLabel={t("noPhotos")} />
          <input
            ref={afterRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => uploadPhotos("after", e.target.files)}
          />
          <button
            onClick={() => afterRef.current?.click()}
            disabled={uploading === "after"}
            className="mt-3 w-full py-4 bg-gray-800 disabled:bg-gray-400 text-white font-bold rounded-xl text-base"
          >
            {uploading === "after" ? t("uploading") : t("takeAfter")}
          </button>
        </section>

        {/* Cash + payment */}
        <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block font-bold text-gray-800 mb-2">{t("cashCollected")}</label>
            <input
              type="number"
              inputMode="numeric"
              value={cash}
              onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="w-full px-4 py-4 rounded-xl border border-gray-200 text-2xl font-bold text-center"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-800 mb-2">{t("paymentMethod")}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "transfer", "pending"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPayment(p)}
                  className={`py-3 rounded-xl text-sm font-bold ${
                    payment === p ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {p === "cash" ? t("payCash") : p === "transfer" ? t("payTransfer") : t("payPending")}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Sticky complete button */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg p-3 z-10">
        <div className="max-w-md mx-auto">
          <button
            onClick={complete}
            disabled={saving || !isActive}
            className="w-full py-5 bg-green-600 disabled:bg-gray-300 text-white text-xl font-bold rounded-2xl shadow"
          >
            {saving ? t("saving") : t("markDone")}
          </button>
          {!isActive && (
            <p className="text-xs text-gray-500 text-center mt-1">
              {lang === "am" ? "ሥራው አልተጀመረም" : "Job not started"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotoGrid({ urls, emptyLabel }: { urls: string[]; emptyLabel: string }) {
  if (!urls || urls.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">{emptyLabel}</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <a key={i} href={u} target="_blank" rel="noreferrer">
          <img
            src={u}
            alt={`photo-${i}`}
            className="w-full aspect-square object-cover rounded-lg border border-gray-200"
          />
        </a>
      ))}
    </div>
  );
}
