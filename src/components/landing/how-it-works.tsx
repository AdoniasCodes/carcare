"use client";

import { useLang } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

const steps: { number: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { number: "1", titleKey: "how.step1.title", descKey: "how.step1.desc" },
  { number: "2", titleKey: "how.step2.title", descKey: "how.step2.desc" },
  { number: "3", titleKey: "how.step3.title", descKey: "how.step3.desc" },
];

export default function HowItWorks() {
  const { t } = useLang();

  return (
    <section className="py-20 sm:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">{t("how.title")}</h2>
          <p className="text-lg text-gray-600">{t("how.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-accent to-accent/20" />
              )}

              <div className="relative z-10 w-20 h-20 bg-accent text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-accent/20">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t(step.titleKey)}</h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
