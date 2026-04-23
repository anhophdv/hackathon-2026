"use client";

import { useState } from "react";
import { Play, X, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = {
  title: string;
  body: string;
  anchor?: string; // selector for a pulse-anchor (future)
};

// Guided demo walkthrough for the "Friday lunch rush" story from the PDF.
// The 5 PDF steps: Pain → Plan → Why → What-if → Outcome.
export function DemoBanner() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const steps: Step[] = [
    {
      title: "1 · The pain",
      body:
        "It's Friday. Mike usually guesses how much dough to prep, then firefights when lunch hits. Last Friday he ran out of mozzarella at 1:12 PM.",
    },
    {
      title: "2 · The plan",
      body:
        "The Copilot's forecast says **demand +30% vs typical Friday** because of the Family Deal. It surfaces **Top 3 actions** — extra dough, an extra make-line cover, and a depot order — each with owner and deadline.",
    },
    {
      title: "3 · Ask \"why?\"",
      body:
        "Mike taps **Why?** on the lead action. The system explains: \"Based on last 3 Fridays + active Friday Family Deal, pepperoni share boosts 15%.\" No jargon, just cited drivers.",
    },
    {
      title: "4 · Simulate before acting",
      body:
        "Mike opens the Copilot and asks *\"What if I reduce prep by 20%?\"* — instantly: **\"You run out of mozzarella at 12:50 PM, service delay +15%.\"** He undoes the cut.",
    },
    {
      title: "5 · Confident decision",
      body:
        "Mike assigns all 3 actions as tasks to the kitchen & shift lead. No firefighting. End of service: ticket time 11 min, zero stockouts.",
    },
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
            <Sparkles className="h-3 w-3" /> Guided demo
          </div>
          <div className="font-extrabold text-base md:text-lg">
            Friday lunch rush · 5-step story
          </div>
          <div className="text-white/85 text-xs md:text-sm">
            Pain → Plan → Why → What-if → Outcome
          </div>
        </div>
        <ChevronRight className="h-5 w-5" />
      </button>
    );
  }

  const s = steps[step];

  return (
    <div className="mb-4 rounded-2xl bg-ph-black text-white p-5 shadow-pop relative overflow-hidden">
      <button
        onClick={() => {
          setOpen(false);
          setStep(0);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10"
        aria-label="Close demo"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-ph-yellow mb-1.5">
        <Sparkles className="h-3 w-3" /> Guided demo · Friday lunch rush
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-xl">{s.title}</div>
          <p
            className="text-white/90 text-sm leading-relaxed mt-1"
            dangerouslySetInnerHTML={{
              __html: s.body.replace(
                /\*\*(.+?)\*\*/g,
                '<strong class="text-ph-yellow">$1</strong>',
              ),
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step ? "bg-ph-yellow w-8" : "bg-white/30 w-2 hover:bg-white/50",
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-sm font-semibold hover:bg-white/20"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-3 py-1.5 rounded-lg bg-ph-red text-white text-sm font-bold hover:bg-ph-redDark"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                setStep(0);
              }}
              className="px-3 py-1.5 rounded-lg bg-ph-yellow text-ph-black text-sm font-bold hover:brightness-110"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
