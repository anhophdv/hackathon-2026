"use client";

import { useState } from "react";
import { Play, X, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

export function DemoBanner() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { t } = useT();

  const stepKeys = [
    { titleKey: "demo.step1.title", bodyKey: "demo.step1.body" },
    { titleKey: "demo.step2.title", bodyKey: "demo.step2.body" },
    { titleKey: "demo.step3.title", bodyKey: "demo.step3.body" },
    { titleKey: "demo.step4.title", bodyKey: "demo.step4.body" },
    { titleKey: "demo.step5.title", bodyKey: "demo.step5.body" },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-4 rounded-2xl bg-gradient-to-r from-ph-red to-ph-redDark text-white p-4 text-left shadow-pop hover:brightness-110 transition flex items-center gap-4"
      >
        <div className="rounded-xl bg-white/20 p-2.5">
          <Play className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-ph-yellow">
            <Sparkles className="h-3 w-3" /> {t("demo.banner_kicker")}
          </div>
          <div className="font-extrabold text-base md:text-lg">
            {t("demo.banner_title")}
          </div>
          <div className="text-white/85 text-xs md:text-sm">
            {t("demo.banner_sub")}
          </div>
        </div>
        <ChevronRight className="h-5 w-5" />
      </button>
    );
  }

  const s = stepKeys[step];

  return (
    <div className="mb-4 rounded-2xl bg-ph-black text-white p-5 shadow-pop relative overflow-hidden">
      <button
        onClick={() => {
          setOpen(false);
          setStep(0);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10"
        aria-label={t("common.close")}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-ph-yellow mb-1.5">
        <Sparkles className="h-3 w-3" /> {t("demo.active_kicker")}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-xl">{t(s.titleKey)}</div>
          <p
            className="text-white/90 text-sm leading-relaxed mt-1"
            dangerouslySetInnerHTML={{
              __html: t(s.bodyKey).replace(
                /\*\*(.+?)\*\*/g,
                '<strong class="text-ph-yellow">$1</strong>',
              ),
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex gap-1.5">
          {stepKeys.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step ? "bg-ph-yellow w-8" : "bg-white/30 w-2 hover:bg-white/50",
              )}
              aria-label={`${i + 1}`}
            />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-sm font-semibold hover:bg-white/20"
            >
              {t("common.back")}
            </button>
          )}
          {step < stepKeys.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-3 py-1.5 rounded-lg bg-ph-red text-white text-sm font-bold hover:bg-ph-redDark"
            >
              {t("common.next")}
            </button>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                setStep(0);
              }}
              className="px-3 py-1.5 rounded-lg bg-ph-yellow text-ph-black text-sm font-bold hover:brightness-110"
            >
              {t("common.finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
