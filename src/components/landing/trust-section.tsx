"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { CONTACT } from "@/lib/contact";
import { buildEmbedUrl } from "@/lib/video-embed";
import type { TranslationKey } from "@/lib/translations";

interface VideoTestimonial {
  id: number;
  platform: "tiktok" | "facebook" | "youtube";
  video_url: string;
  customer_name: string | null;
  customer_car: string | null;
  caption: string | null;
}

const stats: { value: string | TranslationKey; label: TranslationKey; isKey?: boolean }[] = [
  { value: "500+", label: "trust.stat.cars" },
  { value: "trust.stat.sameDayValue", label: "trust.stat.sameDay", isKey: true },
  { value: "trust.stat.certifiedValue", label: "trust.stat.certified", isKey: true },
  { value: "trust.stat.areaValue", label: "trust.stat.area", isKey: true },
];

// Static fallback (used when no videos are uploaded yet)
const fallbackTestimonials: { name: string; textKey: TranslationKey; carKey: TranslationKey }[] = [
  { name: "Abebe M.", textKey: "trust.t1.text", carKey: "trust.t1.car" },
  { name: "Sara T.", textKey: "trust.t2.text", carKey: "trust.t2.car" },
  { name: "Daniel K.", textKey: "trust.t3.text", carKey: "trust.t3.car" },
];

export default function TrustSection() {
  const { t } = useLang();
  const [videos, setVideos] = useState<VideoTestimonial[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setVideos(data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const showingVideos = videos.length > 0;

  return (
    <section className="py-20 sm:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden mb-20">
          <Image src="/images/trust-bg.jpg" alt="Car service background" fill className="object-cover" />
          <div className="absolute inset-0 bg-primary/90" />
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 p-8 sm:p-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {stat.isKey ? t(stat.value as TranslationKey) : (stat.value as string)}
                </p>
                <p className="text-white/60 text-sm mt-1">{t(stat.label)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">{t("trust.eyebrow")}</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-2 mb-4">{t("trust.title")}</h2>
          <p className="text-lg text-gray-600">{t("trust.subtitle")}</p>
          {showingVideos && (
            <p className="text-sm text-gray-500 mt-3">
              <a href={CONTACT.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {CONTACT.tiktokHandle}
              </a>{" "}
              ·{" "}
              <a href={CONTACT.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Facebook
              </a>
            </p>
          )}
        </div>

        {showingVideos ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v) => {
              const embed = buildEmbedUrl(v.video_url);
              if (!embed) return null;
              return (
                <div
                  key={v.id}
                  className="bg-surface rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  <div className="relative bg-black aspect-[9/16]">
                    <iframe
                      src={embed.embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      title={v.customer_name || "Customer testimonial"}
                    />
                  </div>
                  {(v.customer_name || v.customer_car || v.caption) && (
                    <div className="p-5">
                      {v.caption && (
                        <p className="text-gray-700 text-sm leading-relaxed mb-3">&ldquo;{v.caption}&rdquo;</p>
                      )}
                      {(v.customer_name || v.customer_car) && (
                        <div className="flex items-center gap-3 border-t border-gray-200 pt-3">
                          {v.customer_name && (
                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold text-sm">{v.customer_name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            {v.customer_name && (
                              <p className="font-semibold text-gray-900 text-sm">{v.customer_name}</p>
                            )}
                            {v.customer_car && <p className="text-xs text-gray-500">{v.customer_car}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Fallback: static testimonials shown until first video is added
          loaded && (
            <div className="grid md:grid-cols-3 gap-8">
              {fallbackTestimonials.map((testimonial, index) => (
                <div key={index} className="bg-surface rounded-2xl p-8 relative border border-gray-100">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6">&ldquo;{t(testimonial.textKey)}&rdquo;</p>
                  <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                      <p className="text-xs text-gray-500">{t(testimonial.carKey)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
}
