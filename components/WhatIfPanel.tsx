"use client";

import { LocalEvent, Weather } from "@/lib/forecast/engine";
import { useAppStore } from "@/lib/state/store";
import { CloudRain, Save, RotateCcw, Sun, Snowflake, Cloud, Flame } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n/useT";

const WEATHER_OPTIONS: { v: Weather; key: string; Icon: any }[] = [
  { v: "sunny", key: "whatif.weather.sunny", Icon: Sun },
  { v: "cloudy", key: "whatif.weather.cloudy", Icon: Cloud },
  { v: "rainy", key: "whatif.weather.rainy", Icon: CloudRain },
  { v: "cold", key: "whatif.weather.cold", Icon: Snowflake },
  { v: "hot", key: "whatif.weather.hot", Icon: Flame },
];

const EVENT_OPTIONS: { v: LocalEvent; key: string }[] = [
  { v: "none", key: "whatif.event.none" },
  { v: "match", key: "whatif.event.match" },
  { v: "holiday", key: "whatif.event.holiday" },
  { v: "school_break", key: "whatif.event.school_break" },
];

export function WhatIfPanel() {
  const whatIf = useAppStore((s) => s.whatIf);
  const setWhatIf = useAppStore((s) => s.setWhatIf);
  const reset = useAppStore((s) => s.resetWhatIf);
  const save = useAppStore((s) => s.saveScenario);
  const scenarios = useAppStore((s) => s.scenarios);
  const load = useAppStore((s) => s.loadScenario);
  const del = useAppStore((s) => s.deleteScenario);
  const [name, setName] = useState("");
  const { t } = useT();

  return (
    <div className="ph-card p-5 space-y-5">
      <div>
        <div className="ph-label mb-2">{t("whatif.weather")}</div>
        <div className="flex flex-wrap gap-2">
          {WEATHER_OPTIONS.map((o) => (
            <button
              key={o.v}
              onClick={() => setWhatIf({ weather: o.v })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                whatIf.weather === o.v
                  ? "bg-ph-red text-white border-ph-red shadow-pop"
                  : "bg-white text-ph-ink border-ph-line hover:border-ph-red"
              }`}
            >
              <o.Icon className="h-3.5 w-3.5" />
              {t(o.key)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="ph-label mb-2">{t("whatif.event")}</div>
        <div className="flex flex-wrap gap-2">
          {EVENT_OPTIONS.map((o) => (
            <button
              key={o.v}
              onClick={() => setWhatIf({ event: o.v })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                whatIf.event === o.v
                  ? "bg-ph-black text-white border-ph-black"
                  : "bg-white text-ph-ink border-ph-line hover:border-ph-black"
              }`}
            >
              {t(o.key)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="ph-label">{t("whatif.promo_uplift")}</div>
          <div className="text-sm font-bold text-ph-red">
            {whatIf.promoUpliftPct > 0 ? "+" : ""}
            {whatIf.promoUpliftPct}%
          </div>
        </div>
        <input
          type="range"
          min={-30}
          max={50}
          step={5}
          value={whatIf.promoUpliftPct}
          onChange={(e) =>
            setWhatIf({ promoUpliftPct: parseInt(e.target.value, 10) })
          }
          className="w-full accent-ph-red mt-1"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="ph-label">{t("whatif.marketing_push")}</div>
          <div className="text-sm font-bold text-ph-red">+{whatIf.marketingPushPct}%</div>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          step={5}
          value={whatIf.marketingPushPct}
          onChange={(e) =>
            setWhatIf({ marketingPushPct: parseInt(e.target.value, 10) })
          }
          className="w-full accent-ph-red mt-1"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="ph-label">{t("whatif.price_change")}</div>
          <div className="text-sm font-bold text-ph-red">
            {whatIf.pricePct > 0 ? "+" : ""}
            {whatIf.pricePct}%
          </div>
        </div>
        <input
          type="range"
          min={-10}
          max={10}
          step={1}
          value={whatIf.pricePct}
          onChange={(e) => setWhatIf({ pricePct: parseInt(e.target.value, 10) })}
          className="w-full accent-ph-red mt-1"
        />
      </div>

      <div className="pt-2 border-t border-ph-line space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("whatif.scenario_placeholder")}
            className="flex-1 text-sm border border-ph-line rounded-xl px-3 py-2 outline-none focus:border-ph-red"
          />
          <button
            disabled={!name.trim()}
            onClick={() => {
              save(name.trim());
              setName("");
            }}
            className="ph-btn-primary disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {t("common.save")}
          </button>
          <button onClick={reset} className="ph-btn-ghost border border-ph-line">
            <RotateCcw className="h-4 w-4" /> {t("common.reset")}
          </button>
        </div>
        {scenarios.length > 0 && (
          <div className="space-y-1.5">
            <div className="ph-label">{t("whatif.saved_scenarios")}</div>
            {scenarios.map((sc) => (
              <div
                key={sc.id}
                className="flex items-center justify-between gap-2 bg-ph-surface rounded-xl px-3 py-2"
              >
                <button
                  onClick={() => load(sc.id)}
                  className="text-sm font-semibold text-ph-black text-left hover:text-ph-red"
                >
                  {sc.name}
                </button>
                <span className="text-[11px] text-ph-muted">
                  {t(`whatif.weather.${sc.whatIf.weather}`)} ·{" "}
                  {t(`whatif.event.${sc.whatIf.event}`)} ·{" "}
                  {sc.whatIf.promoUpliftPct >= 0 ? "+" : ""}
                  {sc.whatIf.promoUpliftPct}%
                </span>
                <button
                  onClick={() => del(sc.id)}
                  className="text-xs text-ph-muted hover:text-ph-red"
                >
                  {t("common.remove")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
