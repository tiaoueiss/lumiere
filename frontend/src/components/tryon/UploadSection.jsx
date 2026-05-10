import { useRef, useState } from 'react'

export default function UploadSection({ addCustomNecklace, onAdded }) {
  const fileRef  = useRef(null)
  const [warned, setWarned] = useState(false)


  // runs when file is selected
  const handleFile = async (e) => {
    // only allow one file
    const file = e.target.files[0]
    if (!file) return
    try {
      setWarned(true)
      // addCustomNecklace returns the new necklace entry after processing and uploading the image, which is then added to the sidebar catalogue through the onAdded callback.
      const entry = await addCustomNecklace(file)
      onAdded?.(entry)
    } catch (err) {
      console.error('Necklace upload failed:', err)
    }
    // reset input so the same file can be uploaded again if desired
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Divider */}
      <div className="flex items-center gap-3 text-muted-light text-[0.65rem] tracking-[0.1em]">
        <span className="flex-1 h-px bg-gold/15" />
        <span>or</span>
        <span className="flex-1 h-px bg-gold/15" />
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-gold/35
          text-muted font-body text-[0.65rem] tracking-[0.15em] uppercase py-3 rounded-lg
          hover:border-gold hover:text-gold-dark hover:bg-gold-pale/50 transition-all"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Upload your necklace PNG
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />

      {warned && (
        <div className="flex items-start gap-2.5 bg-[#fffbf0] border border-gold/30 border-l-[3px] border-l-gold rounded-sm px-3 py-2.5">
          <svg className="flex-shrink-0 mt-0.5 text-gold" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="font-body text-[0.63rem] leading-relaxed text-ink-3 font-light">
            Positioning may vary. Use the <strong className="font-medium text-gold-dark">Vertical</strong> and{' '}
            <strong className="font-medium text-gold-dark">Scale</strong> sliders to adjust fit.
            Best results with a transparent-background, front-facing PNG.
          </p>
        </div>
      )}
    </div>
  )
}