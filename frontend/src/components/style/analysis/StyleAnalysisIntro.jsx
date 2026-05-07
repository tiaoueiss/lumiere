import { useEffect, useRef, useState } from "react";
import SectionHeader from "../../ui/SectionHeader";
import { ANALYSIS_TYPES } from "../../../data/analysisTypes";
import { AnalysisIcon, GoldRule, SectionEyebrow, UploadGlyph } from "./StyleAnalysisShared";

export function StyleHero({ onStart }) {
  return (
    <section className="text-center pt-32 pb-16 px-6 bg-cream-2 border-b border-gold/15">
      <div className="max-w-3xl mx-auto">
        <SectionHeader
          eyebrow="Discover Your Colors"
          title={<>Find Your <em>Style</em></>}
          subtitle="Upload a photo and let our AI analyze your unique features: skin undertone, ideal hair colors, wardrobe palette, jewelry metals, and more."
          center
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto mt-10 mb-10">
        {ANALYSIS_TYPES.map((type) => (
          <div
            key={type.id}
            className="bg-white rounded-xl px-4 py-5 w-[120px] text-center border border-cream-3 transition-all duration-300 hover:border-gold hover:-translate-y-1"
          >
            <div className="mb-4 flex justify-center">
              <AnalysisIcon type={type.id} size="lg" />
            </div>
            <p className="font-ui text-xs text-ink font-medium mb-1">{type.label}</p>
            <p className="font-body text-[10px] text-muted leading-snug">{type.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="font-ui text-sm tracking-[2px] uppercase bg-gradient-to-br from-gold to-gold-dark text-white border-none px-12 py-4 rounded-full cursor-pointer transition-opacity hover:opacity-90"
      >
        Begin Your Analysis
      </button>
    </section>
  );
}

export function PhotoUpload({ onImageSelect, image }) {
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [streamRef, setStreamRef] = useState(null);

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      onImageSelect(URL.createObjectURL(file));
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStreamRef(stream);
      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch {
      alert("Camera access was denied. Please allow camera permissions and try again.");
    }
  };

  const closeCamera = () => {
    streamRef?.getTracks().forEach((track) => track.stop());
    setStreamRef(null);
    setCameraOpen(false);
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    closeCamera();
    onImageSelect(canvas.toDataURL("image/jpeg", 0.92));
  };

  useEffect(() => () => streamRef?.getTracks().forEach((track) => track.stop()), [streamRef]);

  return (
    <section className="py-16 px-6 text-center bg-white">
      <SectionEyebrow text="Step One" />
      <h2 className="font-display text-2xl text-ink mb-2">Upload Your Photo</h2>
      <GoldRule className="w-12 mx-auto" />
      <p className="font-body text-sm text-muted mt-3 mb-8">
        A clear, well-lit selfie works best: natural lighting, face visible, minimal makeup.
      </p>

      {cameraOpen && (
        <div className="max-w-md mx-auto mb-6">
          <div className="relative rounded-2xl overflow-hidden border-2 border-gold bg-ink">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full"
              style={{ transform: "scaleX(-1)" }}
            />
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
              <button
                onClick={capture}
                className="font-ui text-xs tracking-[2px] uppercase bg-gradient-to-br from-gold to-gold-dark text-white px-8 py-3 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
              >
                Capture
              </button>
              <button
                onClick={closeCamera}
                className="font-ui text-xs tracking-[2px] uppercase bg-ink/70 text-cream px-5 py-3 rounded-full cursor-pointer hover:bg-ink transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!image && !cameraOpen && (
        <>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              handleFile(event.dataTransfer.files[0]);
            }}
            onClick={() => fileRef.current?.click()}
            className={`max-w-md mx-auto py-14 px-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
              dragOver ? "border-gold bg-gold-pale" : "border-cream-3 bg-cream hover:border-gold-light"
            }`}
          >
            <UploadGlyph />
            <p className="font-ui text-sm text-ink-2 mb-2">Drag and drop your photo here</p>
            <p className="font-body text-xs text-muted">or click to browse. JPG, PNG, WebP. max 10MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-cream-3" />
            <span className="font-body text-xs text-muted">or</span>
            <div className="h-px w-16 bg-cream-3" />
          </div>
          <button
            onClick={openCamera}
            className="mt-4 font-ui text-xs tracking-[2px] uppercase border border-gold/50 text-gold-dark px-8 py-3 rounded-full cursor-pointer hover:bg-gold-pale transition-colors"
          >
            Take Photo
          </button>
        </>
      )}

      {image && (
        <div className="max-w-sm mx-auto relative">
          <img src={image} alt="Your photo" className="w-full rounded-2xl border-2 border-cream-3" />
          <button
            onClick={() => onImageSelect(null)}
            className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-ink text-white border-none text-base cursor-pointer flex items-center justify-center hover:bg-ink-2 transition-colors"
          >
            x
          </button>
        </div>
      )}
    </section>
  );
}

export function AnalysisSelector({ selected, setSelected, onAnalyze, image }) {
  const allSelected = selected.length === ANALYSIS_TYPES.length;
  const canAnalyze = image && selected.length > 0;

  const toggleAll = () => {
    setSelected(allSelected ? [] : ANALYSIS_TYPES.map((type) => type.id));
  };

  return (
    <section className="py-10 pb-16 px-6 bg-cream text-center">
      <SectionEyebrow text="Step Two" />
      <h2 className="font-display text-2xl text-ink mb-2">Choose Your Analyses</h2>
      <GoldRule className="w-12 mx-auto" />
      <p className="font-body text-sm text-muted mt-3 mb-6">
        Select the analyses you would like to run, or choose all for a complete style profile.
      </p>

      <div className="flex flex-wrap justify-center gap-3 max-w-xl mx-auto mb-6">
        <button
          onClick={toggleAll}
          className={`font-ui text-xs tracking-wider px-5 py-2.5 rounded-full cursor-pointer transition-all duration-300 border ${
            allSelected ? "bg-ink text-cream border-ink" : "bg-transparent text-ink-2 border-cream-3 hover:border-muted"
          }`}
        >
          * Select All
        </button>

        {ANALYSIS_TYPES.map((type) => {
          const active = selected.includes(type.id);
          return (
            <button
              key={type.id}
              onClick={() => setSelected((current) => (active ? current.filter((item) => item !== type.id) : [...current, type.id]))}
              className={`font-ui text-xs tracking-wider px-5 py-2.5 rounded-full cursor-pointer transition-all duration-300 border ${
                active
                  ? "bg-gradient-to-br from-gold to-gold-dark text-white border-gold"
                  : "bg-white text-ink-2 border-cream-3 hover:border-gold-light"
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

      <button
        onClick={onAnalyze}
        disabled={!canAnalyze}
        className={`font-ui text-sm tracking-[2px] uppercase border-none px-12 py-4 rounded-full transition-all duration-300 ${
          canAnalyze
            ? "bg-gradient-to-br from-gold to-gold-dark text-white cursor-pointer hover:opacity-90"
            : "bg-cream-3 text-muted cursor-not-allowed"
        }`}
      >
        {!image ? "Upload a Photo First" : selected.length === 0 ? "Select at Least One" : `Analyze (${selected.length})`}
      </button>
    </section>
  );
}

export function AnalysisProgress({ selected, onComplete }) {
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const dotInterval = setInterval(() => setDots((current) => (current.length >= 3 ? "" : `${current}.`)), 400);
    const stepInterval = setInterval(() => {
      setStep((current) => {
        if (current >= selected.length - 1) {
          clearInterval(stepInterval);
          setTimeout(onComplete, 800);
          return current;
        }
        return current + 1;
      });
    }, 1200);

    return () => {
      clearInterval(dotInterval);
      clearInterval(stepInterval);
    };
  }, [selected.length, onComplete]);

  return (
    <section className="py-20 px-6 text-center bg-white min-h-[400px] flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full border-[3px] border-cream-3 border-t-gold animate-spin mb-8" />
      <h2 className="font-display text-2xl text-ink mb-6">Analyzing Your Style{dots}</h2>

      <div className="flex flex-col gap-3 max-w-xs w-full">
        {selected.map((id, index) => {
          const type = ANALYSIS_TYPES.find((item) => item.id === id);
          const done = index < step;
          const current = index === step;

          return (
            <div key={id} className={`flex items-center gap-3 transition-opacity duration-500 ${index > step ? "opacity-30" : "opacity-100"}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-ui transition-all duration-500 ${
                  done ? "bg-gold text-white" : current ? "bg-gold-pale text-gold-dark" : "bg-cream-3 text-muted"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 12 12" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                ) : (
                  <AnalysisIcon type={type.id} size="sm" />
                )}
              </div>
              <span className={`font-ui text-sm transition-all duration-500 ${done ? "text-gold-dark" : current ? "text-ink font-semibold" : "text-muted"}`}>
                {type.label}
              </span>
              {current && <span className="font-body text-[11px] text-muted ml-auto">Processing</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
