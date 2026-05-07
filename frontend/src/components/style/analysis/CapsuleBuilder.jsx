import { useEffect, useState } from "react";
import { TextPills } from "./StyleAnalysisShared";
import { formatLabel } from "./styleAnalysisUtils";

export default function CapsuleBuilder({ capsule }) {
  const seasonOptions = Object.keys(capsule?.seasons || {});
  const defaultSeason = seasonOptions.includes(capsule?.defaultSeason)
    ? capsule.defaultSeason
    : seasonOptions[0];
  const [activeSeason, setActiveSeason] = useState(defaultSeason);
  const [activeOccasion, setActiveOccasion] = useState("work");

  useEffect(() => {
    setActiveSeason(defaultSeason);
  }, [defaultSeason]);

  const seasonData = capsule?.seasons?.[activeSeason];

  useEffect(() => {
    const nextOccasion = ["work", "casual", "evening"].find((occasion) => seasonData?.shoppingFilters?.[occasion]);
    if (nextOccasion) {
      setActiveOccasion(nextOccasion);
    }
  }, [seasonData]);

  if (!seasonData) return null;

  const occasionOptions = ["work", "casual", "evening"].filter((occasion) => seasonData.shoppingFilters?.[occasion]);

  return (
    <div className="mt-8 rounded-2xl border border-cream-3 bg-cream p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="font-ui text-[11px] tracking-wider uppercase text-gold-dark mb-1">Seasonal Capsule Builder</p>
          <p className="font-body text-xs text-muted">Switch seasons and occasion filters to see your capsule wardrobe options.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {seasonOptions.map((season) => (
            <button
              key={season}
              type="button"
              onClick={() => setActiveSeason(season)}
              className={`font-ui text-[11px] tracking-wider px-3.5 py-2 rounded-full border transition-colors ${
                activeSeason === season
                  ? "bg-ink text-cream border-ink"
                  : "bg-white text-ink-2 border-cream-3 hover:border-gold"
              }`}
            >
              {season}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <p className="font-ui text-[11px] text-gold-dark tracking-wider uppercase mb-3">Core Pieces</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {seasonData.corePieces?.map((piece) => (
              <div key={piece.item} className="rounded-xl border border-cream-3 bg-white p-3">
                <p className="font-body text-sm text-ink mb-1">{piece.item}</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-ui text-[10px] tracking-wider uppercase text-muted">{piece.category}</span>
                  <span className="font-body text-[11px] text-gold-dark">{piece.color}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="font-ui text-[11px] text-gold-dark tracking-wider uppercase mb-3">Outfit Combos</p>
            <div className="space-y-3">
              {seasonData.outfitCombos?.map((combo) => (
                <div key={combo.name} className="rounded-xl border border-cream-3 bg-white p-3">
                  <p className="font-ui text-[11px] tracking-wider uppercase text-ink mb-1">{combo.name}</p>
                  <p className="font-body text-xs text-ink-3 leading-relaxed">{combo.pieces.join(" + ")}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-ui text-[11px] text-gold-dark tracking-wider uppercase mb-3">Likely Gaps</p>
            <TextPills items={seasonData.gaps} tone="gold" />
          </div>
        </div>
      </div>

      {!!occasionOptions.length && (
        <div className="mt-6 pt-5 border-t border-cream-3">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <p className="font-ui text-[11px] tracking-wider uppercase text-gold-dark mr-2">Shopping Filter</p>
            {occasionOptions.map((occasion) => (
              <button
                key={occasion}
                type="button"
                onClick={() => setActiveOccasion(occasion)}
                className={`font-ui text-[11px] tracking-wider px-3.5 py-2 rounded-full border transition-colors ${
                  activeOccasion === occasion
                    ? "bg-gold-pale text-gold-dark border-gold"
                    : "bg-white text-ink-2 border-cream-3 hover:border-gold"
                }`}
              >
                {formatLabel(occasion)}
              </button>
            ))}
          </div>
          <TextPills items={seasonData.shoppingFilters?.[activeOccasion]} />
        </div>
      )}
    </div>
  );
}
