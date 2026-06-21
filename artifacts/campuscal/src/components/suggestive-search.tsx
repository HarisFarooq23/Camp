import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface EffectRendererProps {
  text: string;
  isActive: boolean;
  allowDelete?: boolean;
  typeDurationMs: number;
  deleteDurationMs: number;
  pauseAfterTypeMs: number;
  prefersReducedMotion?: boolean;
  onDeleteComplete?: () => void;
  containerRef?: RefObject<HTMLElement | null>;
}

export type BuiltinEffect = "typewriter" | "slide" | "fade" | "none";

export interface SuggestiveSearchProps {
  onChange?: (val: string) => void;
  suggestions?: string[];
  className?: string;
  Leading?: () => JSX.Element;
  showLeading?: boolean;
  Trailing?: () => JSX.Element;
  showTrailing?: boolean;
  effect?: BuiltinEffect;
  EffectComponent?: React.ComponentType<EffectRendererProps>;
  typeDurationMs?: number;
  deleteDurationMs?: number;
  pauseAfterTypeMs?: number;
  animateMode?: "infinite" | "once";
}

export const TypewriterEffect: React.FC<EffectRendererProps> = ({
  text,
  isActive,
  allowDelete = true,
  typeDurationMs,
  deleteDurationMs,
  pauseAfterTypeMs,
  prefersReducedMotion,
  onDeleteComplete,
  containerRef,
}) => {
  const [phase, setPhase] = useState<"typing" | "paused" | "deleting">("typing");
  const timers = useRef<ReturnType<typeof window.setTimeout>[]>([]);

  useEffect(() => {
    setPhase("typing");
    timers.current.forEach(clearTimeout);
    timers.current = [];
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, [text, isActive, allowDelete]);

  useEffect(() => {
    if (!isActive) {
      setPhase("typing");
      timers.current.forEach(clearTimeout);
      timers.current = [];
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef as RefObject<HTMLDivElement> | undefined}
      style={{ display: "inline-block", overflow: "hidden", whiteSpace: "nowrap", alignItems: "center" }}
    >
      {prefersReducedMotion ? (
        <span className="text-sm text-muted-foreground select-none">{text}</span>
      ) : (
        <motion.div
          key={text}
          initial={{ width: "0%" }}
          animate={
            phase === "typing" ? { width: "100%" } :
            phase === "deleting" ? { width: "0%" } :
            { width: "100%" }
          }
          transition={
            phase === "typing" ? { duration: typeDurationMs / 1000, ease: "linear" } :
            phase === "deleting" ? { duration: deleteDurationMs / 1000, ease: "linear" } : {}
          }
          onAnimationComplete={() => {
            if (phase === "typing") {
              setPhase("paused");
              if (allowDelete) {
                const t = window.setTimeout(() => setPhase("deleting"), pauseAfterTypeMs);
                timers.current.push(t);
              }
            } else if (phase === "deleting") {
              onDeleteComplete?.();
            }
          }}
          style={{ display: "inline-flex", alignItems: "center", overflow: "hidden", whiteSpace: "nowrap" }}
        >
          <span className="text-sm text-muted-foreground select-none">{text}</span>
          <motion.span
            aria-hidden
            style={{ display: "inline-block", width: 1, marginLeft: 4, height: "1.1em", verticalAlign: "middle" }}
            className="bg-muted-foreground"
            animate={phase === "typing" || phase === "paused" ? { opacity: [0, 1, 0] } : { opacity: 0 }}
            transition={phase === "typing" || phase === "paused" ? { repeat: Infinity, duration: 0.9, ease: "linear" } : { duration: 0.1 }}
          />
        </motion.div>
      )}
    </div>
  );
};

export const SuggestiveSearch: React.FC<SuggestiveSearchProps> = ({
  onChange,
  suggestions = ["Search your campus...", "Find upcoming events..."],
  className,
  Leading = () => <Search className="size-4 text-muted-foreground" />,
  showLeading = true,
  Trailing,
  showTrailing = false,
  effect = "typewriter",
  EffectComponent,
  typeDurationMs = 500,
  deleteDurationMs = 300,
  pauseAfterTypeMs = 1500,
  animateMode = "infinite",
}) => {
  const [search, setSearch] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const [index, setIndex] = useState<number>(0);
  const current = useMemo(() => suggestions[index] ?? "", [suggestions, index]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const leadingRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const trailingRef = useRef<HTMLDivElement | null>(null);

  const [leftOffsetPx, setLeftOffsetPx] = useState<number | null>(null);
  const [rightOffsetPx, setRightOffsetPx] = useState<number | null>(null);
  const [measuredLongestTextPx, setMeasuredLongestTextPx] = useState<number | null>(null);
  const [availableTextAreaPx, setAvailableTextAreaPx] = useState<number | null>(null);

  const longestSuggestion = useMemo(
    () => suggestions.reduce((a, b) => (a.length > b.length ? a : b), ""),
    [suggestions]
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const lead = leadingRef.current;
    const trail = trailingRef.current;
    if (!wrapper) return;

    const update = () => {
      const cs = getComputedStyle(wrapper);
      const padLeft = parseFloat(cs.paddingLeft || "0");
      const padRight = parseFloat(cs.paddingRight || "0");
      const leadW = showLeading ? lead?.getBoundingClientRect().width ?? 0 : 0;
      const trailW = showTrailing ? trail?.getBoundingClientRect().width ?? 0 : 0;
      const left = padLeft + leadW + 8;
      setLeftOffsetPx(left);
      const right = padRight + trailW;
      setRightOffsetPx(right);
      const wrapperW = wrapper.getBoundingClientRect().width;
      const avail = Math.max(0, wrapperW - left - right);
      setAvailableTextAreaPx(avail);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapper);
    if (lead) ro.observe(lead);
    if (trail) ro.observe(trail);
    return () => ro.disconnect();
  }, [showLeading, showTrailing]);

  useEffect(() => {
    const input = inputRef.current;
    if (!longestSuggestion) { setMeasuredLongestTextPx(null); return; }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) { setMeasuredLongestTextPx(null); return; }
    const elForFont = input ?? wrapperRef.current;
    if (!elForFont) {
      ctx.font = "14px system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
    } else {
      const cs = getComputedStyle(elForFont);
      ctx.font = `${cs.fontStyle} ${cs.fontVariant} ${cs.fontWeight} ${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily}`;
    }
    const metrics = ctx.measureText(longestSuggestion);
    setMeasuredLongestTextPx(Math.ceil(metrics.width) + 8);
  }, [longestSuggestion]);

  const ChosenEffect = EffectComponent ?? TypewriterEffect;

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function handleEffectDeleteComplete() {
    setIndex((i) => (i + 1) % suggestions.length);
  }

  const handleInputChange = (val: string) => {
    setSearch(val);
    onChange?.(val);
  };

  const minWidthPx =
    measuredLongestTextPx != null && availableTextAreaPx != null
      ? Math.min(measuredLongestTextPx, availableTextAreaPx)
      : measuredLongestTextPx != null
      ? measuredLongestTextPx
      : undefined;

  const overlayActive = !search && !isFocused;
  const isLast = index === suggestions.length - 1;
  const allowDelete = animateMode === "infinite" ? true : !isLast;

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative flex items-center gap-x-2 py-2 px-4 border border-border rounded-full bg-white/10 backdrop-blur-sm",
        className
      )}
      style={{ maxWidth: "100%" }}
    >
      <div ref={leadingRef} className="flex-shrink-0">
        {showLeading && <Leading />}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={search}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => handleInputChange(e.target.value)}
        className="bg-transparent outline-none text-sm text-foreground placeholder:text-transparent w-full"
        placeholder=""
        aria-label="search"
        style={minWidthPx != null ? { minWidth: `${minWidthPx}px` } : { minWidth: undefined }}
      />

      <div ref={trailingRef} className="flex-shrink-0">
        {showTrailing && Trailing && <Trailing />}
      </div>

      {overlayActive && (
        <div
          ref={overlayRef}
          aria-hidden
          style={{
            position: "absolute",
            left: leftOffsetPx != null ? `${leftOffsetPx}px` : "calc(0.5rem + 1.5rem + 8px)",
            right: rightOffsetPx != null ? `${rightOffsetPx}px` : "0.5rem",
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <ChosenEffect
            text={current}
            isActive={overlayActive}
            allowDelete={allowDelete}
            typeDurationMs={typeDurationMs ?? 500}
            deleteDurationMs={deleteDurationMs ?? 300}
            pauseAfterTypeMs={pauseAfterTypeMs ?? 1500}
            prefersReducedMotion={prefersReduced}
            onDeleteComplete={handleEffectDeleteComplete}
            containerRef={overlayRef}
          />
        </div>
      )}
    </div>
  );
};

export default SuggestiveSearch;
