import { formatLabel } from "./styleAnalysisUtils";
import {
  AnalysisIcon,
  ColorSwatch,
  ConfidenceBar,
  TextPills,
} from "./StyleAnalysisShared";

export function UndertoneCard({ data }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-cream-3">
      <div className="flex items-center gap-3 mb-5">
        <AnalysisIcon type="undertone" />
        <h3 className="font-display text-xl text-ink">Skin Undertone</h3>
      </div>

      <div className="flex gap-6 flex-wrap mb-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-[3px] border-gold mx-auto mb-2" style={{ backgroundColor: data.hex_sample }} />
          <span className="font-display text-3xl font-bold text-ink">{data.result}</span>
        </div>
        <div className="flex-1 min-w-[200px]">
          <ConfidenceBar value={data.confidence} label="Confidence" />
          <p className="font-body text-sm text-ink-2 leading-relaxed mt-4">{data.details}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {data.season && <span className="font-ui text-[11px] bg-ink text-cream px-3.5 py-1 rounded-full">{data.season}</span>}
            {data.subtype && <span className="font-ui text-[11px] bg-gold-pale text-gold-dark px-3.5 py-1 rounded-full">{data.subtype}</span>}
          </div>
        </div>
      </div>

      <p className="font-ui text-xs tracking-wider text-gold-dark uppercase mb-2">Visual Indicators</p>
      <TextPills items={data.indicators} tone="gold" />

      <div className="mt-5 pt-5 border-t border-cream-3">
        <p className="font-ui text-xs tracking-wider text-gold-dark uppercase mb-2">Profile Cues</p>
        <TextPills
          items={[
            data.skinDepth && `Skin depth: ${data.skinDepth}`,
            data.contrastLevel && `Contrast: ${data.contrastLevel}`,
          ].filter(Boolean)}
        />
      </div>

      {data.makeup && (
        <div className="mt-7 pt-5 border-t border-cream-3">
          <p className="font-ui text-xs tracking-wider text-gold-dark uppercase mb-2">Makeup Direction</p>
          <p className="font-body text-sm text-ink-2 leading-relaxed mb-4">{data.makeup.foundationTips}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="font-ui text-[11px] tracking-wider uppercase text-muted mb-2">Blush</p>
              <TextPills items={data.makeup.blush} tone="gold" />
            </div>
            <div>
              <p className="font-ui text-[11px] tracking-wider uppercase text-muted mb-2">Lips</p>
              <TextPills items={data.makeup.lips} tone="gold" />
            </div>
            <div>
              <p className="font-ui text-[11px] tracking-wider uppercase text-muted mb-2">Eyeshadow</p>
              <TextPills items={data.makeup.eyeshadow} tone="gold" />
            </div>
          </div>
        </div>
      )}

      {data.colorsToAvoid?.length > 0 && (
        <div className="mt-7 pt-5 border-t border-cream-3">
          <p className="font-ui text-xs tracking-wider text-red-700 uppercase mb-3">Colors To Avoid</p>
          <div className="flex flex-wrap gap-3.5">
            {data.colorsToAvoid.map((color) => (
              <ColorSwatch key={color.name} hex={color.hex} name={color.name} size="w-11 h-11" subtitle={color.reason} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HairColorCard({ data }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-cream-3">
      <div className="flex items-center gap-3 mb-5">
        <AnalysisIcon type="hairColor" />
        <h3 className="font-display text-xl text-ink">Hair Color</h3>
      </div>

      <div className="flex items-center gap-3 mb-6 bg-cream rounded-xl p-4">
        <div className="w-10 h-10 rounded-full" style={{ backgroundColor: data.currentHair.hex }} />
        <div>
          <p className="font-ui text-[11px] text-muted uppercase tracking-wider mb-0.5">Current</p>
          <p className="font-body text-sm text-ink">{data.currentHair.color}</p>
        </div>
      </div>

      <p className="font-ui text-xs tracking-wider text-gold-dark uppercase mb-3">Recommended Shades</p>
      <div className="flex flex-wrap gap-3.5 mb-6">
        {data.recommended.map((color, index) => (
          <ColorSwatch key={`${color.name}-${index}`} hex={color.hex} name={color.name} size="w-[52px] h-[52px]" subtitle={color.reason} />
        ))}
      </div>

      <p className="font-ui text-xs tracking-wider text-red-700 uppercase mb-3">Shades To Avoid</p>
      <div className="flex flex-wrap gap-3.5 mb-5">
        {data.avoid.map((color, index) => (
          <ColorSwatch key={`${color.name}-${index}`} hex={color.hex} name={color.name} size="w-11 h-11" subtitle={color.reason} />
        ))}
      </div>

      <div className="bg-gold-pale rounded-xl p-4">
        <p className="font-ui text-[11px] text-gold-dark uppercase tracking-wider mb-1">Seasonal Notes</p>
        <p className="font-body text-[13px] text-ink-2 leading-relaxed">{data.seasonalNotes}</p>
      </div>
    </div>
  );
}

export function OutfitColorsCard({ data }) {
  const categories = [...new Set(data.bestColors.map((color) => color.category))];

  return (
    <div className="bg-white rounded-2xl p-8 border border-cream-3">
      <div className="flex items-center gap-3 mb-2">
        <AnalysisIcon type="outfitColors" />
        <h3 className="font-display text-xl text-ink">Color Palette</h3>
      </div>

      <div className="flex gap-2 mb-5">
        <span className="font-ui text-xs bg-ink text-cream px-3.5 py-1 rounded-full">{data.season}</span>
        <span className="font-ui text-xs bg-gold-pale text-gold-dark px-3.5 py-1 rounded-full">{data.subtype}</span>
      </div>

      <p className="font-body text-sm text-ink-2 leading-relaxed mb-6">{data.summary}</p>

      {categories.map((category) => (
        <div key={category} className="mb-5">
          <p className="font-ui text-[11px] text-muted tracking-wider uppercase mb-2.5">{category}</p>
          <div className="flex flex-wrap gap-3">
            {data.bestColors
              .filter((color) => color.category === category)
              .map((color, index) => (
                <ColorSwatch key={`${color.name}-${index}`} hex={color.hex} name={color.name} size="w-[52px] h-[52px]" />
              ))}
          </div>
        </div>
      ))}

      <div className="flex gap-8 flex-wrap mt-6 pt-5 border-t border-cream-3">
        <div>
          <p className="font-ui text-[11px] text-muted tracking-wider uppercase mb-2.5">Accent Colors</p>
          <div className="flex gap-2.5">
            {data.accentColors.map((color, index) => (
              <ColorSwatch key={`${color.name}-${index}`} hex={color.hex} name={color.name} size="w-11 h-11" />
            ))}
          </div>
        </div>
        <div>
          <p className="font-ui text-[11px] text-muted tracking-wider uppercase mb-2.5">Neutrals</p>
          <div className="flex gap-2.5">
            {data.neutrals.map((color, index) => (
              <ColorSwatch key={`${color.name}-${index}`} hex={color.hex} name={color.name} size="w-11 h-11" />
            ))}
          </div>
        </div>
      </div>

      {data.colorsToAvoid?.length > 0 && (
        <div className="mt-6 pt-5 border-t border-cream-3">
          <p className="font-ui text-[11px] text-red-700 tracking-wider uppercase mb-3">Colors To Avoid</p>
          <div className="flex flex-wrap gap-3">
            {data.colorsToAvoid.map((color) => (
              <ColorSwatch key={color.name} hex={color.hex} name={color.name} size="w-11 h-11" subtitle={color.reason} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function JewelryMetalCard({ data }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-cream-3">
      <div className="flex items-center gap-3 mb-5">
        <AnalysisIcon type="jewelryMetal" />
        <h3 className="font-display text-xl text-ink">Jewelry Metal</h3>
      </div>

      <div className="flex items-center gap-5 mb-6">
        <div
          className="w-20 h-20 rounded-full border-[3px] border-gold"
          style={{
            background: `radial-gradient(circle at 35% 35%, #fff8e0, ${data.bestHex}, #6b5020)`,
            boxShadow: `0 4px 20px ${data.bestHex}44`,
          }}
        />
        <div>
          <p className="font-ui text-[11px] text-gold-dark tracking-wider uppercase mb-1">Best Match</p>
          <p className="font-display text-3xl font-bold text-ink">{data.best}</p>
        </div>
      </div>

      <p className="font-body text-sm text-ink-2 leading-relaxed mb-6">{data.reasoning}</p>

      <p className="font-ui text-xs text-muted tracking-wider uppercase mb-3">Alternatives</p>
      <div className="flex flex-col gap-3">
        {data.alternatives.map((alt, index) => (
          <div key={`${alt.metal}-${index}`} className="flex items-center gap-3.5 bg-cream rounded-xl p-3.5">
            <div className="w-9 h-9 rounded-full border border-black/10 shrink-0" style={{ background: `radial-gradient(circle at 35% 35%, #fff, ${alt.hex})` }} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-ui text-[13px] text-ink">{alt.metal}</span>
                <span className="font-body text-[11px] text-gold-dark">{Math.round(alt.compatibility * 100)}% match</span>
              </div>
              <div className="h-1 rounded-full bg-cream-3">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${alt.compatibility * 100}%`, backgroundColor: alt.hex }} />
              </div>
              <p className="font-body text-[11px] text-muted mt-1 truncate">{alt.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaceShapeCard({ data }) {
  const shapeRadius = {
    Oval: "50% / 40%",
    Round: "50%",
    Square: "15%",
    Heart: "50% 50% 15% 15%",
    Oblong: "40% / 50%",
    Diamond: "50%",
  };

  return (
    <div className="bg-white rounded-2xl p-8 border border-cream-3">
      <div className="flex items-center gap-3 mb-5">
        <AnalysisIcon type="faceShape" />
        <h3 className="font-display text-xl text-ink">Face Shape</h3>
      </div>

      <div className="flex gap-6 flex-wrap mb-6">
        <div className="text-center">
          <div className="w-20 h-24 border-[3px] border-gold bg-gold-pale mx-auto mb-2" style={{ borderRadius: shapeRadius[data.shape] || "50%" }} />
          <span className="font-display text-2xl font-bold text-ink block mb-1">{data.shape}</span>
          <ConfidenceBar value={data.confidence} />
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="font-ui text-[11px] text-gold-dark tracking-wider uppercase mb-2">Feature Breakdown</p>
          {Object.entries(data.features).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1.5 border-b border-cream-3">
              <span className="font-ui text-xs text-muted">{formatLabel(key)}</span>
              <span className="font-body text-xs text-ink-2">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {Object.entries(data.recommendations).map(([category, items]) => (
        <div key={category} className="mb-4">
          <p className="font-ui text-[11px] text-gold-dark tracking-wider uppercase mb-2">{formatLabel(category)}</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, index) => (
              <span key={`${category}-${index}`} className="font-body text-xs text-ink-3 bg-cream px-3.5 py-1.5 rounded-full">
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
