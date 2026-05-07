import { getLuminance, normalizeHex } from "./styleAnalysisUtils";

export function GoldRule({ className = "" }) {
  return <div className={`gold-rule ${className}`} />;
}

export function SectionEyebrow({ text }) {
  return <p className="font-ui text-xs tracking-[3px] text-gold-dark uppercase mb-3">{text}</p>;
}

export function AnalysisIcon({ type, size = "md", className = "" }) {
  const boxSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6";
  const stroke = "border-gold-dark";

  if (type === "undertone") {
    return (
      <span
        aria-hidden="true"
        className={`${boxSize} inline-block rounded-full border-2 ${stroke} bg-gradient-to-br from-gold-pale via-white to-gold/40 ${className}`}
      />
    );
  }

  if (type === "hairColor") {
    return (
      <span aria-hidden="true" className={`${boxSize} relative inline-block ${className}`}>
        <span className="absolute left-[14%] top-[18%] h-[62%] w-[18%] rounded-full border-2 border-gold-dark bg-gold-pale/40 rotate-[-10deg]" />
        <span className="absolute left-[40%] top-[8%] h-[76%] w-[20%] rounded-full border-2 border-gold-dark bg-gradient-to-b from-gold-pale via-white to-gold/35" />
        <span className="absolute right-[12%] top-[18%] h-[62%] w-[18%] rounded-full border-2 border-gold-dark bg-gold-pale/40 rotate-[10deg]" />
      </span>
    );
  }

  if (type === "outfitColors") {
    return (
      <span aria-hidden="true" className={`${boxSize} grid grid-cols-2 gap-0.5 ${className}`}>
        <span className="rounded-sm bg-gold-dark" />
        <span className="rounded-sm bg-gold" />
        <span className="rounded-sm bg-ink/70" />
        <span className="rounded-sm bg-gold-pale border border-gold/40" />
      </span>
    );
  }

  if (type === "jewelryMetal") {
    return (
      <span aria-hidden="true" className={`${boxSize} relative inline-block ${className}`}>
        <span className="absolute left-[10%] top-[24%] h-[52%] w-[52%] rounded-full border-2 border-gold-dark" />
        <span className="absolute right-[10%] top-[24%] h-[52%] w-[52%] rounded-full border-2 border-gold" />
      </span>
    );
  }

  if (type === "faceShape") {
    return (
      <span
        aria-hidden="true"
        className={`${boxSize} inline-block border-2 ${stroke} bg-gold-pale/50 ${className}`}
        style={{ borderRadius: "50% / 42%" }}
      />
    );
  }

  return null;
}

export function UploadGlyph() {
  return (
    <span aria-hidden="true" className="relative mx-auto mb-4 block h-10 w-10 text-gold">
      <span className="absolute left-1/2 top-2 h-7 w-px -translate-x-1/2 bg-current" />
      <span className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-current" />
      <span className="absolute bottom-0 left-2 h-px w-6 bg-current" />
    </span>
  );
}

export function ColorSwatch({ hex, name, size = "w-12 h-12", subtitle }) {
  const safeHex = normalizeHex(hex);
  const light = getLuminance(safeHex) > 0.5;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`${size} rounded-lg border border-black/10 flex items-end justify-center p-1 transition-transform hover:scale-110 cursor-default`}
        style={{ backgroundColor: safeHex }}
      >
        <span className={`font-body text-[9px] ${light ? "text-ink" : "text-white"} opacity-60`}>{safeHex}</span>
      </div>
      {name && <span className="font-ui text-[11px] text-ink-2 text-center leading-tight max-w-[72px]">{name}</span>}
      {subtitle && <span className="font-body text-[10px] text-muted text-center max-w-[84px] leading-tight">{subtitle}</span>}
    </div>
  );
}

export function ConfidenceBar({ value, label }) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="font-ui text-xs text-muted min-w-[70px]">{label}</span>}
      <div className="flex-1 h-1.5 rounded-full bg-cream-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-1000 ease-out"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="font-body text-xs text-gold-dark font-semibold min-w-[36px] text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export function TextPills({ items, tone = "cream" }) {
  if (!items?.length) return null;

  const toneClasses = tone === "gold"
    ? "bg-gold-pale text-ink-3"
    : tone === "rose"
      ? "bg-rose-50 text-ink-3"
      : "bg-cream text-ink-3";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={`font-body text-xs px-3.5 py-1.5 rounded-full ${toneClasses}`}>
          {item}
        </span>
      ))}
    </div>
  );
}
