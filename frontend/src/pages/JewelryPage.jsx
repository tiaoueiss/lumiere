import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionHeader from '../components/ui/SectionHeader'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/auth/AuthModal'
import { fetchNecklaces, getWishlist, addToWishlist, removeFromWishlist } from '../api'

const FILTERS = [
  { label: 'All',       value: null },
  { label: 'Choker',    value: 'choker' },
  { label: 'Pendant',   value: 'pendant' },
  { label: 'Layered',   value: 'layered' },
  { label: 'Chain',     value: 'chain' },
  { label: 'Statement', value: 'statement' },
  { label: 'Pearl',     value: 'pearl' },
]

function getSlug(imagePath) {
  return imagePath?.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
}

function getTryOnId(necklace) {
  return necklace.isCustom ? necklace._id : getSlug(necklace.tryOnImage || necklace.image)
}

function formatPrice(price) {
  return `$${Number(price).toLocaleString()}`
}

/* ─── Product Card with scroll-reveal ──────────────────── */
function ProductCard({ necklace, index, isWishlisted, onToggleWishlist }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer
        ${hovered ? 'border-gold shadow-[0_12px_40px_rgba(201,168,76,0.14)] -translate-y-1' : 'border-gold/15'}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? (hovered ? 'translateY(-4px)' : 'translateY(0)')
          : 'translateY(40px)',
        transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${index * 0.08}s,
                     transform 0.7s cubic-bezier(.16,1,.3,1) ${index * 0.08}s,
                     border-color 0.3s, box-shadow 0.3s`,
      }}
    >
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-cream to-cream-2 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,168,76,0.08)_0%,transparent_70%)]" />
        {necklace.image ? (
          <img
            src={necklace.image}
            alt={necklace.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-3/4 h-3/4 object-contain relative z-10 transition-opacity duration-500
              ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-25 relative z-10">
            <svg width="56" height="56" viewBox="0 0 36 36" fill="none">
              <ellipse cx="18" cy="14" rx="14" ry="6" stroke="#c9a84c" strokeWidth="1.5" />
              <line x1="18" y1="20" x2="18" y2="28" stroke="#c9a84c" strokeWidth="1.5" />
              <circle cx="18" cy="30" r="3" fill="#c9a84c" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-ui text-base tracking-wide text-ink-2">{necklace.name}</h3>
            <p className="font-body text-xs text-muted font-light mt-0.5 capitalize">{necklace.category}</p>
          </div>
          <span className="font-display text-lg text-gold-dark">{formatPrice(necklace.price)}</span>
        </div>
        <p className="font-body text-xs text-ink-3 font-light leading-relaxed line-clamp-2">
          {necklace.description}
        </p>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => navigate(`/tryon?id=${getTryOnId(necklace)}`)}
            className="flex-1 font-ui text-[0.65rem] tracking-[0.15em] uppercase py-2 rounded-full
              bg-gradient-to-br from-gold to-gold-dark text-white cursor-pointer
              hover:opacity-90 transition-opacity"
          >
            Try On
          </button>
          <button
            onClick={() => onToggleWishlist(necklace._id)}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`flex items-center justify-center gap-1.5 flex-1 font-ui text-[0.65rem] tracking-[0.15em] uppercase py-2 rounded-full
              border cursor-pointer transition-all
              ${isWishlisted
                ? 'bg-gold/10 border-gold text-gold-dark'
                : 'border-gold/40 text-gold-dark hover:bg-gold/5'
              }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {isWishlisted ? 'Saved' : 'Wishlist'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton card ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-gold/15 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-cream-2" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 w-3/5 bg-cream-2 rounded" />
        <div className="h-3 w-2/5 bg-cream-2 rounded" />
        <div className="h-3 w-full bg-cream-2 rounded" />
        <div className="h-3 w-4/5 bg-cream-2 rounded" />
      </div>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function JewelryPage() {
  const { user } = useAuth()
  const [catalogue, setCatalogue] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)
  const [wishlistIds, setWishlistIds] = useState(new Set())
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    fetchNecklaces()
      .then(data => setCatalogue(data.data.necklaces))
      .catch(() => setCatalogue([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getWishlist()
      .then(data => {
        if (!cancelled) setWishlistIds(new Set(data.data.wishlist.map(n => n._id)))
      })
      .catch(() => {
        if (!cancelled) setWishlistIds(new Set())
      })
    return () => { cancelled = true }
  }, [user])

  // When logged out derive an empty set without calling setState
  const activeWishlistIds = user ? wishlistIds : new Set()

  async function toggleWishlist(id) {
    if (!user) { setShowAuth(true); return }

    const isIn = activeWishlistIds.has(id)
    setWishlistIds(prev => {
      const next = new Set(prev)
      isIn ? next.delete(id) : next.add(id)
      return next
    })
    try {
      if (isIn) await removeFromWishlist(id)
      else await addToWishlist(id)
    } catch {
      setWishlistIds(prev => {
        const next = new Set(prev)
        isIn ? next.add(id) : next.delete(id)
        return next
      })
    }
  }

  const filtered = filter
    ? catalogue.filter(n => n.category === filter)
    : catalogue

  return (
    <main className="pt-[72px]">

      {/* Hero */}
      <section className="py-20 px-6 bg-cream-2 text-center border-b border-gold/15">
        <div className="max-w-2xl mx-auto">
          <SectionHeader
            eyebrow="The Collection"
            title={<>Fine Jewelry,<br /><em>Virtually Yours</em></>}
            subtitle="Every piece in the atelier, available to try on live. Select any necklace to see the details or try it on with your camera."
            center
          />
          <div className="mt-6">
            <Button to="/tryon" size="lg">Open Virtual Try-On</Button>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="bg-white border-b border-gold/15 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 font-body text-[0.62rem] tracking-[0.15em] uppercase
                px-4 py-1.5 rounded-full border transition-all cursor-pointer
                ${filter === f.value
                  ? 'bg-gold border-gold text-white'
                  : 'border-gold/20 text-ink-3 hover:border-gold/50 hover:text-gold-dark'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <section className="py-14 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted font-body">
              No pieces match this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((n, i) => (
                <ProductCard
                  key={n._id}
                  necklace={n}
                  index={i}
                  isWishlisted={activeWishlistIds.has(n._id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white text-center border-t border-gold/15">
        <h2 className="font-display italic text-4xl text-ink mb-4">
          Can't decide? Try them all.
        </h2>
        <p className="font-body text-sm text-muted font-light mb-8 max-w-md mx-auto">
          Our virtual try-on lets you see every piece on your own neckline — no commitment, no guesswork.
        </p>
        <Button to="/tryon" size="lg">Open the Atelier</Button>
      </section>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </main>
  )
}
