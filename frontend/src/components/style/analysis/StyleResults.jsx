import { useState } from "react";
import StyleFollowUpChat from "../StyleFollowUpChat";
import { ANALYSIS_TYPES } from "../../../data/analysisTypes";
import { AnalysisIcon, GoldRule, SectionEyebrow } from "./StyleAnalysisShared";
import {
  FaceShapeCard,
  HairColorCard,
  JewelryMetalCard,
  OutfitColorsCard,
  UndertoneCard,
} from "./StyleResultCards";

export default function StyleResults({ results, selected, onReset, onSave, saved, user, saveMessage }) {
  const [activeTab, setActiveTab] = useState(selected[0]);
  const tabs = selected.filter((id) => results[id]);
  const currentTab = tabs.includes(activeTab) ? activeTab : tabs[0];

  const renderCard = (id) => {
    switch (id) {
      case "undertone":
        return <UndertoneCard data={results.undertone} />;
      case "hairColor":
        return <HairColorCard data={results.hairColor} />;
      case "outfitColors":
        return <OutfitColorsCard data={results.outfitColors} />;
      case "jewelryMetal":
        return <JewelryMetalCard data={results.jewelryMetal} />;
      case "faceShape":
        return <FaceShapeCard data={results.faceShape} />;
      default:
        return null;
    }
  };

  return (
    <section className="pt-28 pb-16 px-6 bg-cream">
      <div className="text-center mb-10">
        <SectionEyebrow text="Your Results" />
        <h2 className="font-display text-3xl text-ink mb-2">
          Style <em className="italic text-gold-dark">Analysis</em>
        </h2>
        <GoldRule className="w-16 mx-auto" />
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {tabs.map((id) => {
          const type = ANALYSIS_TYPES.find((item) => item.id === id);
          const active = currentTab === id;

          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`font-ui text-xs tracking-wider px-5 py-2.5 rounded-full cursor-pointer transition-all duration-300 border ${
                active ? "bg-ink text-cream border-ink" : "bg-white text-ink-2 border-cream-3 hover:border-muted"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <AnalysisIcon type={type.id} size="sm" />
                {type.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto">{renderCard(currentTab)}</div>

      <StyleFollowUpChat analysis={results} />

      <div className="text-center mt-10">
        <div className="inline-flex gap-3 flex-wrap justify-center">
          <button
            onClick={onSave}
            className={`font-ui text-[13px] tracking-wider px-8 py-3 rounded-full cursor-pointer border transition-all ${
              saved
                ? "bg-gold/10 text-gold-dark border-gold"
                : "bg-transparent text-gold-dark border-gold hover:bg-gold-pale"
            }`}
          >
            {saved ? "Saved" : user ? "Save to My Profile" : "Sign in to Save"}
          </button>
          <a
            href="/tryon"
            className="font-ui text-[13px] tracking-wider px-8 py-3 rounded-full cursor-pointer bg-gradient-to-br from-gold to-gold-dark text-white border-none transition-opacity hover:opacity-90"
          >
            Try On Jewelry
            <svg viewBox="0 0 16 16" fill="none" className="inline-block w-4 h-4 ml-2 align-middle" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="8" x2="13" y2="8" />
              <polyline points="9,4 13,8 9,12" />
            </svg>
          </a>
        </div>
        {saveMessage && <p className="font-body text-xs text-gold-dark mt-3">{saveMessage}</p>}
        <button
          onClick={onReset}
          className="block mx-auto mt-5 font-body text-xs text-muted underline underline-offset-2 cursor-pointer bg-transparent border-none hover:text-ink transition-colors"
        >
          Analyze a different photo
        </button>
      </div>
    </section>
  );
}
