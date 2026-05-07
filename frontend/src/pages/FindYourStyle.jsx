import { useCallback, useRef, useState } from "react";
import { analyzePhoto } from "../utils/styleAnalysis";
import AuthModal from "../components/auth/AuthModal";
import {
  AnalysisProgress,
  AnalysisSelector,
  PhotoUpload,
  StyleHero,
} from "../components/style/analysis/StyleAnalysisIntro";
import StyleResults from "../components/style/analysis/StyleResults";
import { useAuth } from "../context/AuthContext";
import { ANALYSIS_TYPES } from "../data/analysisTypes";
import { saveAiAnalysis } from "../api";

export default function FindYourStyle() {
  const { user } = useAuth();
  const [phase, setPhase] = useState("hero");
  const [image, setImage] = useState(null);
  const [selected, setSelected] = useState(ANALYSIS_TYPES.map((type) => type.id));
  const [results, setResults] = useState(null);
  const [saved, setSaved] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const uploadRef = useRef(null);
  const analysisPromiseRef = useRef(null);

  const handleStart = () => {
    setPhase("upload");
    setTimeout(() => uploadRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleAnalyze = () => {
    setPhase("loading");
    setAnalysisError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    analysisPromiseRef.current = analyzePhoto(image);
  };

  const handleComplete = useCallback(async () => {
    try {
      const response = await (analysisPromiseRef.current ?? Promise.reject(new Error("No analysis started")));
      setResults(response);
      setSaved(false);
      setPhase("results");
    } catch (error) {
      setAnalysisError(error.message || "Analysis failed. Please try again.");
      setPhase("upload");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReset = () => {
    setPhase("upload");
    setImage(null);
    setResults(null);
    setSaved(false);
    setSaveMessage("");
    analysisPromiseRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!results) return;

    if (!user) {
      setSaveMessage("Please sign in before saving your style profile.");
      setShowAuth(true);
      return;
    }

    try {
      await saveAiAnalysis(results);
      setSaved(true);
      setSaveMessage("Saved to your profile.");
    } catch (error) {
      setSaveMessage(error.message || "Could not save your profile. Please try again.");
    }
  };

  return (
    <div className="bg-cream min-h-screen">
      {phase === "loading" && <AnalysisProgress selected={selected} onComplete={handleComplete} />}

      {phase === "results" && results && (
        <StyleResults
          results={results}
          selected={selected}
          onReset={handleReset}
          onSave={handleSave}
          saved={Boolean(user && saved)}
          user={user}
          saveMessage={saveMessage}
        />
      )}

      {(phase === "hero" || phase === "upload") && (
        <>
          <StyleHero onStart={handleStart} />
          <div ref={uploadRef}>
            {analysisError && (
              <div className="max-w-xl mx-auto px-6 mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-body">
                  {analysisError}
                </div>
              </div>
            )}
            <PhotoUpload image={image} onImageSelect={setImage} />
            <AnalysisSelector selected={selected} setSelected={setSelected} onAnalyze={handleAnalyze} image={image} />
          </div>
        </>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
