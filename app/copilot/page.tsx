"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  ChevronDown,
  Lightbulb,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { PageHeader } from "@/components/Shell";
import { useHistory } from "@/lib/data/useHistory";
import { useAppStore } from "@/lib/state/store";
import {
  answer,
  CopilotCard,
  CopilotMessage,
  initialCopilotMessages,
  SUGGESTIONS_DEFAULT,
} from "@/lib/copilot/engine";
import { cn } from "@/lib/utils";
import { SeverityChip } from "@/components/SeverityChip";

// Conversational surface for the Smart Planning Copilot. Grounded in the same
// forecast/recommendation/timeline engines that power the rest of the app —
// deterministic core, LLM-style narrative on top, manager always in control.
export default function CopilotPage() {
  const history = useHistory();
  const whatIf = useAppStore((s) => s.whatIf);
  const today = history.endDate;

  const ctx = useMemo(
    () => ({ history, targetDate: today, whatIf }),
    [history, today, whatIf],
  );

  const [messages, setMessages] = useState<CopilotMessage[]>(() =>
    initialCopilotMessages(ctx),
  );
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  function send(text: string) {
    if (!text.trim()) return;
    const user: CopilotMessage = {
      id: "u_" + Math.random().toString(36).slice(2, 9),
      role: "user",
      text,
    };
    setMessages((m) => [...m, user]);
    setInput("");
    setPending(true);
    // simulate thinking
    setTimeout(() => {
      const reply = answer(text, ctx);
      setMessages((m) => [...m, reply]);
      setPending(false);
    }, 550);
  }

  const lastSuggested =
    [...messages].reverse().find((m) => m.role === "copilot")?.suggested ??
    SUGGESTIONS_DEFAULT;

  return (
    <>
      <PageHeader
        title="Smart Planning Copilot"
        subtitle="Ask anything about today: demand, risks, what-ifs. Every answer cites drivers and confidence. You stay in control."
        right={
          <>
            <span className="ph-chip-muted">
              <ShieldCheck className="h-3 w-3" /> Grounded in today's forecast
            </span>
            <Link href="/today" className="ph-btn-ghost border border-ph-line">
              Open Today's Plan <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Chat column */}
        <div className="ph-card flex flex-col min-h-[620px] h-[75vh]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-ph-line">
            <div className="rounded-lg bg-ph-red text-white p-1.5">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-ph-black text-sm">Copilot</div>
              <div className="text-[11px] text-ph-green flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-ph-green" /> Online · deterministic engine
              </div>
            </div>
            <span className="ml-auto ph-chip-muted">Session 1</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m) => (
              <Bubble key={m.id} msg={m} />
            ))}
            {pending && (
              <div className="flex items-end gap-2">
                <div className="rounded-xl bg-ph-red text-white p-1.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="px-3 py-2 bg-ph-surface rounded-2xl rounded-bl-sm border border-ph-line">
                  <div className="flex gap-1">
                    <Dot />
                    <Dot delay="0.15s" />
                    <Dot delay="0.3s" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          <div className="px-4 pt-1 pb-2 border-t border-ph-line flex flex-wrap gap-1.5">
            {lastSuggested.slice(0, 5).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={pending}
                className="ph-chip-muted hover:bg-ph-line/80 transition cursor-pointer"
              >
                <Lightbulb className="h-3 w-3 text-ph-amber" /> {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t border-ph-line flex gap-2 items-center bg-ph-surface/60 rounded-b-2xl"
          >
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-ph-line">
              <MessageCircle className="h-4 w-4 text-ph-muted" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Ask something like "What if I reduce prep by 20%?"'
                className="bg-transparent outline-none flex-1 text-sm"
                disabled={pending}
              />
            </div>
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className={cn(
                "ph-btn-primary",
                (pending || !input.trim()) && "opacity-50 cursor-not-allowed",
              )}
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>

        {/* Side panel */}
        <aside className="space-y-4">
          <div className="ph-card p-4">
            <h3 className="ph-h2 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ph-red" /> Core positioning
            </h3>
            <p className="text-sm text-ph-ink leading-relaxed">
              "We're not building a dashboard — we're building a system that turns
              data into <strong>timely, confident decisions</strong>, enabling managers to operate
              proactively instead of reactively."
            </p>
          </div>

          <div className="ph-card p-4">
            <h3 className="ph-h2 mb-2">Try these</h3>
            <ul className="space-y-1.5">
              {[
                "What's my biggest risk today?",
                "Why is demand higher than usual?",
                "What if I reduce prep by 20%?",
                "When will we run out of dough?",
                "What if it rains tonight?",
                "Compare vs last Friday",
                "How confident are you?",
              ].map((q) => (
                <li key={q}>
                  <button
                    onClick={() => send(q)}
                    disabled={pending}
                    className="w-full text-left text-sm px-2.5 py-2 rounded-lg hover:bg-ph-line/60 text-ph-ink flex items-center gap-2"
                  >
                    <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-ph-red shrink-0" />
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="ph-card p-4">
            <h3 className="ph-h2 mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-ph-green" /> How this is grounded
            </h3>
            <ul className="text-sm text-ph-ink space-y-2">
              <li>
                <span className="font-bold">Deterministic core:</span> decisions come from the same forecast + BOM + capacity engine as the rest of the app.
              </li>
              <li>
                <span className="font-bold">LLM-style narrative:</span> the Copilot explains, it doesn't override.
              </li>
              <li>
                <span className="font-bold">Human in control:</span> every action is opt-in, never auto-executed.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function Bubble({ msg }: { msg: CopilotMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "")}>
      {!isUser && (
        <div className="rounded-xl bg-ph-red text-white p-1.5 shrink-0">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-ph-red text-white border-ph-red rounded-br-sm"
            : "bg-ph-surface text-ph-ink border-ph-line rounded-bl-sm",
        )}
      >
        <span
          dangerouslySetInnerHTML={{
            __html: escapeHtml(msg.text).replace(
              /\*\*(.+?)\*\*/g,
              isUser
                ? '<strong class="text-ph-yellow">$1</strong>'
                : '<strong class="text-ph-black">$1</strong>',
            ),
          }}
        />
        {msg.cards && msg.cards.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {msg.cards.map((c, i) => (
              <InlineCard key={i} card={c} />
            ))}
          </div>
        )}
        {!isUser && (msg.citations?.length || msg.confidence != null) && (
          <div className="mt-3 pt-2 border-t border-ph-line/70 flex flex-wrap items-center gap-2 text-[11px]">
            {msg.confidence != null && (
              <span className="ph-chip-muted">
                Confidence {Math.round(msg.confidence * 100)}%
              </span>
            )}
            {msg.citations?.map((c, i) =>
              c.href ? (
                <Link
                  key={i}
                  href={c.href}
                  className="text-ph-red hover:underline font-semibold"
                >
                  {c.label} →
                </Link>
              ) : (
                <span key={i} className="ph-chip-muted">
                  {c.label}
                </span>
              ),
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="rounded-xl bg-ph-black text-white p-1.5 shrink-0">
          <UserIcon className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

function InlineCard({ card }: { card: CopilotCard }) {
  if (card.kind === "recommendation") {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-ph-line">
        <SeverityChip severity={card.severity} />
        <span className="text-xs font-semibold text-ph-ink flex-1">{card.title}</span>
        <Link href="/today" className="text-[11px] font-bold text-ph-red">Open →</Link>
      </div>
    );
  }
  if (card.kind === "stockout") {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-ph-red/5 border border-ph-red/20">
        <span className="ph-chip-red">Risk</span>
        <span className="text-xs font-semibold text-ph-ink flex-1">
          {card.label} · {card.clock}
        </span>
      </div>
    );
  }
  return null;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-ph-red inline-block animate-pulse"
      style={{ animationDelay: delay }}
    />
  );
}
