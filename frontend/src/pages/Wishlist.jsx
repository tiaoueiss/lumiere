import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import SectionHeader from '../components/ui/SectionHeader'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/auth/AuthModal'
import { getWishlist, removeFromWishlist } from '../api'

function getSlug(imagePath) {
  return imagePath?.split('/').pop()?.replace('.png', '') ?? ''
}

function formatPrice(price) {
  return `$${Number(price).toLocaleString()}`
}

function WishlistCard({ necklace, onRemove, onTryOn }) {
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <div className="bg-white border border-gold/15 rounded-xl overflow-hidden hover:border-gold hover:shadow-[0_12px_40px_rgba(201,168,76,0.14)] transition-all duration-300">
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-cream to-cream-2 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(201,168,76,0.08)_0%,transparent_70%)]" />
        {necklace.image && (
          <img
            src={necklace.image}
            alt={necklace.name}
            onLoad={() => setImgLoaded(true)}
            className={`w-3/4 h-3/4 object-contain relative z-10 transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        <button
          onClick={onRemove}
          title="Remove from wishlist"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 border border-gold/20
            flex items-center justify-center text-gold-dark hover:bg-red-50 hover:border-red-200
            hover:text-red-400 transition-all cursor-pointer z-20"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
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
        {necklace.description && (
          <p className="font-body text-xs text-ink-3 font-light leading-relaxed line-clamp-2">
            {necklace.description}
          </p>
        )}
        <button
          onClick={onTryOn}
          className="w-full font-ui text-[0.65rem] tracking-[0.15em] uppercase py-2.5 rounded-full
            bg-gradient-to-br from-gold to-gold-dark text-white cursor-pointer
            hover:opacity-90 transition-opacity"
        >
          Try On
        </button>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gold/15 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-cream-2" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 w-3/5 bg-cream-2 rounded" />
        <div className="h-3 w-2/5 bg-cream-2 rounded" />
        <div className="h-3 w-full bg-cream-2 rounded" />
        <div className="h-8 w-full bg-cream-2 rounded-full mt-1" />
      </div>
    </div>
  )
}

export default function Wishlist() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    getWishlist()
      .then(data => setItems(data.data.wishlist))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [user])

  async function remove(id) {
    setItems(prev => prev.filter(n => n._id !== id))
    try {
      await removeFromWishlist(id)
    } catch {
      // revert on error
      getWishlist()
        .then(data => setItems(data.data.wishlist))
        .catch(() => {})
    }
  }

  const heartIcon = (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.2" opacity="0.4">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )

  return (
    <main className="pt-[72px] min-h-screen bg-cream">

      <section className="py-16 px-6 bg-cream-2 text-center border-b border-gold/15">
        <SectionHeader
          eyebrow="Your Favorites"
          title={<>Saved <em>Pieces</em></>}
          subtitle="Pieces you've saved from the collection. Try them on or come back to them later."
          center
        />
      </section>

      <section className="py-14 px-6 max-w-6xl mx-auto">
        {!user ? (
          <div className="text-center py-24 flex flex-col items-center gap-6">
            {heartIcon}
            <div>
              <p className="font-display italic text-2xl text-ink mb-2">Sign in to view your wishlist</p>
              <p className="font-body text-sm text-muted font-light">Save pieces you love and come back to them anytime.</p>
            </div>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-gold text-white font-body text-xs tracking-[0.18em] uppercase px-6 py-3 rounded-sm hover:bg-gold-dark transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center gap-6">
            {heartIcon}
            <div>
              <p className="font-display italic text-2xl text-ink mb-2">Your wishlist is empty</p>
              <p className="font-body text-sm text-muted font-light">Browse the collection and save pieces you love.</p>
            </div>
            <Button to="/products">Browse Collection</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(necklace => (
              <WishlistCard
                key={necklace._id}
                necklace={necklace}
                onRemove={() => remove(necklace._id)}
                onTryOn={() => navigate(`/tryon?id=${getSlug(necklace.image)}`)}
              />
            ))}
          </div>
        )}
      </section>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </main>
  )
}
