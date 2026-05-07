import { useState } from 'react'

function downloadCanvas(canvasRef) {
  const canvas = canvasRef.current
  if (!canvas) return
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {
      href: url,
      download: 'lumiere-tryon.png',
    }).click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export default function TryOnCanvas({ videoRef, canvasRef, status, cameraOn, showDebug, toggleDebug, startCamera }) {
  const [starting, setStarting] = useState(false)

  const handleStart = async () => {
    setStarting(true)
    await startCamera()
    setStarting(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Camera frame */}
      <div className="relative bg-ink rounded-xl overflow-hidden aspect-[3/4] md:aspect-[16/10] border border-gold/20 shadow-[0_8px_32px_rgba(201,168,76,0.08)]">

        {/* Corner accents */}
        <span className="frame-corner tl" />
        <span className="frame-corner tr" />
        <span className="frame-corner bl" />
        <span className="frame-corner br" />

        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover [transform:scaleX(-1)]"
        />

        {/* Canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Start overlay */}
        {!cameraOn && (
          <div className="absolute inset-0 bg-gradient-to-br from-cream to-cream-3 flex items-center justify-center z-20">
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-18 h-18 rounded-full bg-white border border-gold/30 flex items-center justify-center text-gold p-5">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <p className="font-display text-2xl text-ink">Begin Your Session</p>
              <p className="font-body text-sm text-muted font-light tracking-wide">
                Allow camera access to try on pieces virtually
              </p>
              <button
              // When the user clicks the button to start the camera, set 'starting' to true to indicate that the process is underway. 
              // then call the 'startCamera' function passed in as a prop, which handles the actual camera initialization. 
              onClick={handleStart}
                disabled={starting}// DONT ALLOW CLICKS WHEN STARTING
                className="mt-2 bg-gold text-white font-body text-xs font-medium tracking-[0.22em] uppercase px-8 py-3 rounded-sm shadow-[0_2px_12px_rgba(201,168,76,0.3)] hover:bg-gold-dark transition-colors disabled:opacity-60"
              >
                {starting ? 'Starting…' : 'Enable Camera'}
              </button>
            </div>
          </div>
        )}

        {/* Status bar */}
        {status && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-white/70 text-[0.6rem] tracking-[0.2em] uppercase bg-black/45 px-4 py-1.5 rounded-full border border-gold/20 whitespace-nowrap">
            {status}
          </div>
        )}

        {/* Controls — shown only when camera is active */}
        {cameraOn && (
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            {/* Download snapshot */}
            <button
              onClick={() => downloadCanvas(canvasRef)}
              title="Save photo"
              className="w-8 h-8 flex items-center justify-center rounded border bg-white/10 border-gold/30 text-white/50 hover:bg-gold/20 hover:text-gold-light hover:border-gold/60 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>

            {/* Debug toggle */}
            <button
              onClick={toggleDebug}
              title={showDebug ? 'Hide debug' : 'Show debug'}
              className={`w-8 h-8 flex items-center justify-center rounded border transition-all
                ${showDebug
                  ? 'bg-gold/20 border-gold/60 text-gold-light'
                  : 'bg-white/10 border-gold/30 text-white/50 hover:bg-gold/20 hover:text-gold-light hover:border-gold/60'
                }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}