import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AnalysisIcon } from "../components/style/analysis/StyleAnalysisShared";
import { normalizeHex } from "../components/style/analysis/styleAnalysisUtils";
import { loadUserJson, removeUserJson } from "../utils/userStorage";
import { deleteSavedAiAnalysis, getSavedAiAnalysis, saveAiAnalysis } from "../api";

function GoldRule({ className = "" }) {
  return <div className={`gold-rule ${className}`} />;
}

function SectionEyebrow({ text }) {
  return <p className="font-ui text-xs tracking-[3px] text-gold-dark uppercase mb-3">{text}</p>;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Unknown date";
  }
}

function formatLabel(value) {
  return String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function Badge({ label, value, iconType, colorHex }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-9 w-9 items-center justify-center">
        <AnalysisIcon type={iconType} />
        {colorHex && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: colorHex }}
          />
        )}
      </div>
      <span className="font-ui text-[10px] tracking-widest uppercase text-muted">{label}</span>
      <span className="font-body text-sm text-ink font-medium">{value}</span>
    </div>
  );
}

function CardHeader({ iconType, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <AnalysisIcon type={iconType} />
      <p className="font-ui text-xs tracking-widest uppercase text-gold-dark">{title}</p>
    </div>
  );
}

function TextPills({ items, tone = "cream" }) {
  if (!items?.length) return null;

  const toneClasses = tone === "gold"
    ? "bg-gold-pale text-ink-3"
    : "bg-cream text-ink-3";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={`font-body text-xs px-3 py-1 rounded-full ${toneClasses}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function ColorDots({ colors, subtitle = false }) {
  if (!colors?.length) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => {
        const safeHex = normalizeHex(color.hex);
        return (
        <div key={color.name} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full border border-black/10" style={{ backgroundColor: safeHex }} />
          <span className="font-body text-[10px] text-muted text-center max-w-[76px] leading-tight">{color.name}</span>
          {subtitle && <span className="font-body text-[9px] text-muted text-center max-w-[96px] leading-tight">{color.reason}</span>}
        </div>
        );
      })}
    </div>
  );
}

function DeleteAccountPanel({ onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = password.trim() && confirmText === "DELETE" && !isDeleting;

  const closePanel = () => {
    if (isDeleting) return;
    setIsOpen(false);
    setPassword("");
    setConfirmText("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canDelete) return;

    setError("");
    setIsDeleting(true);

    try {
      await onDelete(password);
    } catch (err) {
      setError(err.message || "Could not delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-8 font-body text-xs text-muted underline underline-offset-4 cursor-pointer bg-transparent border-none hover:text-red-500 transition-colors"
      >
        Delete account
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[80] bg-ink/35 backdrop-blur-sm flex items-center justify-center px-5">
          <section className="relative w-full max-w-[430px] min-h-[430px] bg-white border border-red-200 shadow-[0_24px_80px_rgba(31,26,23,0.18)] p-8 text-left flex flex-col justify-center">
            <button
              type="button"
              onClick={closePanel}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-cream-3 text-muted hover:border-red-200 hover:text-red-500 transition-colors"
              aria-label="Close delete account form"
            >
              x
            </button>

            <p className="font-ui text-[11px] tracking-[2px] uppercase text-red-500 mb-3">Account Settings</p>
            <h2 className="font-display text-3xl text-ink mb-3">Delete account</h2>
            <p className="font-body text-sm text-muted leading-relaxed mb-6">
              This permanently removes your Lumiere account, wishlist, saved style profile, and custom uploads.
              Enter your password and type DELETE to confirm.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-full border border-cream-3 bg-cream px-5 py-3 font-body text-sm text-ink outline-none focus:border-gold"
              />
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded-full border border-cream-3 bg-cream px-5 py-3 font-body text-sm text-ink outline-none focus:border-gold"
              />
              {error && <p className="font-body text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!canDelete}
                className="mt-2 font-ui text-xs tracking-[2px] uppercase rounded-full px-8 py-3 transition-colors bg-red-500 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-200"
              >
                {isDeleting ? "Deleting..." : "Delete account"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

export default function MyStyle() {
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();
  const firstName = user?.name?.split(" ")[0] || null;
  const [saved, setSaved] = useState(null);
  const [isLoadingSaved, setIsLoadingSaved] = useState(Boolean(user));
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadSaved() {
      if (!user) {
        setSaved(null);
        setIsLoadingSaved(false);
        return;
      }

      setIsLoadingSaved(true);
      setLoadError("");

      try {
        const mongoSaved = await getSavedAiAnalysis();
        if (!ignore) setSaved(mongoSaved);
        removeUserJson("lumiere_style_results", user);
      } catch (error) {
        const legacySaved = loadUserJson("lumiere_style_results", user, null);

        if (legacySaved?.results) {
          try {
            await saveAiAnalysis(legacySaved.results);
            removeUserJson("lumiere_style_results", user);
          } catch {
            if (!ignore) {
              setLoadError("Showing your locally saved analysis. It could not sync to your account yet.");
            }
          }

          if (!ignore) {
            setSaved({
              results: legacySaved.results,
              savedAt: legacySaved.savedAt || new Date().toISOString(),
            });
          }
        } else if (!ignore) {
          setSaved(null);
          if (error.message !== "No saved analysis found.") {
            setLoadError(error.message || "Could not load your saved analysis.");
          }
        }
      } finally {
        if (!ignore) setIsLoadingSaved(false);
      }
    }

    loadSaved();

    return () => {
      ignore = true;
    };
  }, [user]);

  const clearSaved = async () => {
    setLoadError("");
    try {
      await deleteSavedAiAnalysis();
    } catch (error) {
      setLoadError(error.message || "Could not clear your saved analysis.");
      return;
    }
    removeUserJson("lumiere_style_results", user);
    setSaved(null);
  };

  const handleDeleteAccount = async (password) => {
    await deleteAccount(password);
    navigate("/", { replace: true });
  };

  if (isLoadingSaved) {
    return (
      <main className="pt-[72px] min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-white">
          <AnalysisIcon type="undertone" size="lg" className="opacity-70" />
        </div>
        <SectionEyebrow text="My Style" />
        <p className="font-display text-2xl text-ink">Loading your saved analysis...</p>
      </main>
    );
  }

  if (!saved) {
    return (
      <main className="pt-[72px] min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-white">
          <AnalysisIcon type="undertone" size="lg" className="opacity-70" />
        </div>
        <SectionEyebrow text="My Style" />
        <h1 className="font-display text-4xl text-ink mb-3">
          {firstName ? <>Welcome, <em className="italic text-gold-dark">{firstName}</em></> : "Welcome to your style profile"}
        </h1>
        <GoldRule className="w-16 mx-auto" />
        <p className="font-display text-2xl text-ink mt-5 mb-3">No saved analysis yet</p>
        <p className="font-body text-sm text-muted mb-8 max-w-sm">
          Run the style analyzer and click <em>Save to My Profile</em> to keep your results here.
        </p>
        {loadError && <p className="font-body text-xs text-red-500 mb-5 max-w-sm">{loadError}</p>}
        <Link
          to="/style"
          className="font-ui text-xs tracking-[2px] uppercase bg-gradient-to-br from-gold to-gold-dark text-white px-10 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Analyze My Style
        </Link>
        {user && <DeleteAccountPanel onDelete={handleDeleteAccount} />}
      </main>
    );
  }

  const { results, savedAt } = saved;
  const undertone = results?.undertone;
  const faceShape = results?.faceShape;
  const metal = results?.jewelryMetal;
  const outfit = results?.outfitColors;
  const hair = results?.hairColor;

  return (
    <main className="pt-[72px] min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <SectionEyebrow text="My Style Profile" />
          <h1 className="font-display text-4xl text-ink mb-2">
            {firstName ? <>Welcome back, <em className="italic text-gold-dark">{firstName}</em></> : <>Your <em className="italic text-gold-dark">Style Results</em></>}
          </h1>
          <GoldRule className="w-20 mx-auto" />
          <p className="font-body text-xs text-muted mt-3">Saved on {formatDate(savedAt)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-3 p-6 mb-6 flex flex-wrap justify-around gap-6">
          {undertone && <Badge label="Undertone" value={undertone.result} iconType="undertone" colorHex={undertone.hex_sample} />}
          {faceShape && <Badge label="Face Shape" value={faceShape.shape} iconType="faceShape" />}
          {metal && <Badge label="Best Metal" value={metal.best} iconType="jewelryMetal" colorHex={metal.bestHex} />}
          {outfit && <Badge label="Season" value={outfit.subtype} iconType="outfitColors" />}
        </div>

        <div className="grid gap-5">
          {undertone && (
            <div className="bg-white rounded-2xl p-6 border border-cream-3">
              <CardHeader iconType="undertone" title="Skin Undertone" />
              <div className="flex gap-4 items-center mb-3 flex-wrap">
                <div className="w-12 h-12 rounded-full border-2 border-gold shrink-0" style={{ backgroundColor: undertone.hex_sample }} />
                <div className="min-w-[180px]">
                  <p className="font-display text-xl text-ink">{undertone.result}</p>
                  <p className="font-body text-xs text-muted">{Math.round(undertone.confidence * 100)}% confidence</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {undertone.season && <span className="font-ui text-[11px] bg-ink text-cream px-3 py-1 rounded-full">{undertone.season}</span>}
                  {undertone.subtype && <span className="font-ui text-[11px] bg-gold-pale text-gold-dark px-3 py-1 rounded-full">{undertone.subtype}</span>}
                </div>
              </div>
              <p className="font-body text-xs text-ink-3 leading-relaxed mb-3">{undertone.details}</p>
              <TextPills items={undertone.indicators} tone="gold" />

              {(undertone.skinDepth || undertone.contrastLevel) && (
                <div className="mt-5 pt-5 border-t border-cream-3">
                  <p className="font-ui text-[11px] tracking-wider uppercase text-gold-dark mb-2">Profile Cues</p>
                  <TextPills
                    items={[
                      undertone.skinDepth && `Skin depth: ${undertone.skinDepth}`,
                      undertone.contrastLevel && `Contrast: ${undertone.contrastLevel}`,
                    ].filter(Boolean)}
                  />
                </div>
              )}

              {undertone.makeup && (
                <div className="mt-5 pt-5 border-t border-cream-3">
                  <p className="font-ui text-[11px] tracking-wider uppercase text-gold-dark mb-2">Makeup Direction</p>
                  <p className="font-body text-xs text-ink-3 leading-relaxed mb-3">{undertone.makeup.foundationTips}</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="font-ui text-[10px] tracking-wider uppercase text-muted mb-2">Blush</p>
                      <TextPills items={undertone.makeup.blush} />
                    </div>
                    <div>
                      <p className="font-ui text-[10px] tracking-wider uppercase text-muted mb-2">Lips</p>
                      <TextPills items={undertone.makeup.lips} />
                    </div>
                    <div>
                      <p className="font-ui text-[10px] tracking-wider uppercase text-muted mb-2">Eyeshadow</p>
                      <TextPills items={undertone.makeup.eyeshadow} />
                    </div>
                  </div>
                </div>
              )}

              {undertone.colorsToAvoid?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-cream-3">
                  <p className="font-ui text-[11px] tracking-wider uppercase text-red-700 mb-3">Colors To Avoid</p>
                  <ColorDots colors={undertone.colorsToAvoid} subtitle />
                </div>
              )}
            </div>
          )}

          {faceShape && (
            <div className="bg-white rounded-2xl p-6 border border-cream-3">
              <CardHeader iconType="faceShape" title="Face Shape" />
              <p className="font-display text-xl text-ink mb-1">{faceShape.shape}</p>
              <p className="font-body text-xs text-muted mb-4">{Math.round(faceShape.confidence * 100)}% confidence</p>

              {faceShape.features && (
                <div className="grid gap-2 sm:grid-cols-2 mb-5">
                  {Object.entries(faceShape.features).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2">
                      <span className="font-ui text-[10px] tracking-wider uppercase text-muted">{formatLabel(key)}</span>
                      <span className="font-body text-xs text-ink-3">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {faceShape.recommendations && Object.entries(faceShape.recommendations).map(([category, items]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <p className="font-ui text-[11px] tracking-wider uppercase text-gold-dark mb-2">{formatLabel(category)}</p>
                  <TextPills items={items} />
                </div>
              ))}
            </div>
          )}

          {outfit && (
            <div className="bg-white rounded-2xl p-6 border border-cream-3">
              <CardHeader iconType="outfitColors" title="Color Palette" />
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="font-ui text-[11px] bg-ink text-cream px-3 py-1 rounded-full">{outfit.season}</span>
                <span className="font-ui text-[11px] bg-gold-pale text-gold-dark px-3 py-1 rounded-full">{outfit.subtype}</span>
              </div>
              <p className="font-body text-xs text-ink-3 leading-relaxed mb-4">{outfit.summary}</p>

              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <p className="font-ui text-[11px] tracking-wider uppercase text-gold-dark mb-3">Best Colors</p>
                  <ColorDots colors={outfit.bestColors?.slice(0, 10)} />
                </div>
                <div>
                  <p className="font-ui text-[11px] tracking-wider uppercase text-gold-dark mb-3">Neutrals</p>
                  <ColorDots colors={outfit.neutrals} />
                </div>
              </div>

              {outfit.colorsToAvoid?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-cream-3">
                  <p className="font-ui text-[11px] tracking-wider uppercase text-red-700 mb-3">Colors To Avoid</p>
                  <ColorDots colors={outfit.colorsToAvoid} subtitle />
                </div>
              )}
            </div>
          )}

          {metal && (
            <div className="bg-white rounded-2xl p-6 border border-cream-3">
              <CardHeader iconType="jewelryMetal" title="Best Jewelry Metal" />
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full border-2 border-gold shrink-0" style={{ background: `radial-gradient(circle at 35% 35%, #fff8e0, ${metal.bestHex}, #6b5020)` }} />
                <p className="font-display text-xl text-ink">{metal.best}</p>
              </div>
              <p className="font-body text-xs text-ink-3 leading-relaxed mb-4">{metal.reasoning}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {metal.alternatives?.map((alt) => (
                  <div key={alt.metal} className="rounded-xl bg-cream p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-ui text-[11px] tracking-wider uppercase text-ink">{alt.metal}</span>
                      <span className="font-body text-[10px] text-gold-dark">{Math.round(alt.compatibility * 100)}%</span>
                    </div>
                    <p className="font-body text-[11px] text-ink-3 leading-relaxed">{alt.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hair && (
            <div className="bg-white rounded-2xl p-6 border border-cream-3">
              <CardHeader iconType="hairColor" title="Hair Color Recommendations" />
              <div className="rounded-xl bg-cream px-4 py-3 mb-4 inline-flex items-center gap-3">
                <div className="w-9 h-9 rounded-full border border-black/10" style={{ backgroundColor: hair.currentHair?.hex }} />
                <div>
                  <p className="font-ui text-[10px] tracking-wider uppercase text-muted">Current</p>
                  <p className="font-body text-sm text-ink">{hair.currentHair?.color}</p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="font-ui text-[11px] tracking-wider uppercase text-gold-dark mb-3">Recommended</p>
                  <ColorDots colors={hair.recommended} subtitle />
                </div>
                <div>
                  <p className="font-ui text-[11px] tracking-wider uppercase text-red-700 mb-3">Avoid</p>
                  <ColorDots colors={hair.avoid} subtitle />
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-gold-pale px-4 py-3">
                <p className="font-ui text-[11px] tracking-wider uppercase text-gold-dark mb-1">Seasonal Notes</p>
                <p className="font-body text-xs text-ink-3 leading-relaxed">{hair.seasonalNotes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-10 flex flex-wrap gap-3 justify-center no-print">
          <Link
            to="/style"
            className="font-ui text-xs tracking-[2px] uppercase bg-gradient-to-br from-gold to-gold-dark text-white px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Re-analyze
          </Link>
          <Link
            to="/tryon"
            className="font-ui text-xs tracking-[2px] uppercase border border-gold/50 text-gold-dark px-8 py-3 rounded-full hover:bg-gold-pale transition-colors"
          >
            Try On Jewelry
            <svg viewBox="0 0 16 16" fill="none" className="inline-block w-4 h-4 ml-2 align-middle" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="8" x2="13" y2="8" />
              <polyline points="9,4 13,8 9,12" />
            </svg>
          </Link>
          <button
            onClick={clearSaved}
            className="font-body text-xs text-muted underline underline-offset-2 cursor-pointer bg-transparent border-none hover:text-red-500 transition-colors"
          >
            Clear saved results
          </button>
        </div>

        <div className="no-print">
          {user && <DeleteAccountPanel onDelete={handleDeleteAccount} />}
        </div>
      </div>
    </main>
  );
}
