export default function NecklaceGrid({ catalogue, activeId, setActiveId, onDelete }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 overflow-y-auto max-h-[460px] pr-1
      scrollbar-thin scrollbar-thumb-gold-pale">
      {catalogue.map(necklace => {
        const isActive = necklace.id === activeId
        return (
          <div
            key={necklace.id}
            role="button"
            tabIndex={0}
            onClick={() => setActiveId(necklace.id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveId(necklace.id) }}
            className={`group text-left bg-white rounded-lg overflow-hidden border transition-all duration-200 relative cursor-pointer
              ${isActive
                ? 'border-gold shadow-[0_0_0_2px_#f5ebc8,0_6px_20px_rgba(201,168,76,0.16)]'
                : 'border-gold/18 hover:border-gold-light hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(201,168,76,0.12)]'
              }`}
          >
            {/* Active badge */}
            {isActive && (
              <span className="absolute top-1.5 right-1.5 z-10 bg-gold text-white text-[0.5rem] font-medium font-body tracking-[0.12em] uppercase px-2 py-0.5 rounded-full">
                Wearing
              </span>
            )}

            {/* Delete button — custom uploads only, visible on hover */}
            {necklace.isCustom && onDelete && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(necklace.id) }}
                title="Delete necklace"
                className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full
                  flex items-center justify-center
                  bg-white/90 border border-red-200 text-red-400
                  opacity-0 group-hover:opacity-100 transition-opacity
                  hover:bg-red-50 cursor-pointer"
              >
                <svg width="8" height="8" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="1" y1="1" x2="9" y2="9" />
                  <line x1="9" y1="1" x2="1" y2="9" />
                </svg>
              </button>
            )}

            {/* Preview */}
            <div className="aspect-[4/5] bg-gradient-to-br from-cream to-cream-2 flex items-center justify-center p-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,168,76,0.07)_0%,transparent_70%)]" />
              {necklace.src ? (
                <img
                  src={necklace.src}
                  alt={necklace.name}
                  className="w-full h-full object-contain relative z-10"
                  loading="lazy"
                />
              ) : (
                <PlaceholderIcon />
              )}
            </div>

            {/* Info */}
            <div className="px-2.5 py-2 border-t border-gold/10">
              <p className="font-ui text-[0.68rem] tracking-[0.08em] text-ink-2 truncate">{necklace.name}</p>
              <p className="font-body text-[0.58rem] text-muted font-light mt-0.5">{necklace.type}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PlaceholderIcon() {
  return (
    <div className="flex flex-col items-center gap-1.5 opacity-40">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <ellipse cx="18" cy="14" rx="14" ry="6" stroke="#c9a84c" strokeWidth="1.5" />
        <line x1="18" y1="20" x2="18" y2="28" stroke="#c9a84c" strokeWidth="1.5" />
        <circle cx="18" cy="30" r="3" fill="#c9a84c" />
      </svg>
      <span className="font-body text-[0.55rem] tracking-[0.15em] uppercase text-muted-light">
        Add image
      </span>
    </div>
  )
}
