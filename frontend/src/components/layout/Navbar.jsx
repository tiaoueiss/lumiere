import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../auth/AuthModal'
import { loadUserJson } from '../../utils/userStorage'

function getUserId(user) {
  return user?.id || user?._id || null
}

function useWishlistCount(user) {
  const currentUserId = getUserId(user)
  const [countState, setCountState] = useState(() => ({
    userId: currentUserId,
    count: loadUserJson('wishlist', user, []).length,
  }))

  useEffect(() => {
    const sync = () => setCountState({
      userId: currentUserId,
      count: loadUserJson('wishlist', user, []).length,
    })
    window.addEventListener('storage', sync)
    window.addEventListener('lumiere:user-storage', sync)
    // poll so same-tab changes also reflect
    const id = setInterval(sync, 500)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('lumiere:user-storage', sync)
      clearInterval(id)
    }
  }, [currentUserId, user])

  return countState.userId === currentUserId
    ? countState.count
    : loadUserJson('wishlist', user, []).length
}

/*
defineng the navigation links in an array allows for easier maintenance and scalability.
if we want to add, remove, or modify links in the future, we can simply update this array without having to change the structure of the JSX code that renders the links.
it also keeps the JSX cleaner and more readable by separating data from presentation logic.
*/
const links = [
  { to: '/',        label: 'Home' },
  { to: '/style',   label: 'Find Your Style' },
  { to: '/tryon',   label: 'Try On' },
  {to: '/products', label: 'Collection' },
  { to: '/about',   label: 'About' },
]


export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const wishlistCount = useWishlistCount(user)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  // Effect to add a scroll listener that updates the 'scrolled' state based on the window's scroll position. 
  // This enhances the user experience by making the navbar more visible when scrolling down.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mobile menu closes on link click, no effect needed

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
      ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(201,168,76,0.18)]' : 'bg-white border-b border-gold/20'}`}>

      <div className="h-[2px] gold-rule" />

      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex flex-col items-start leading-none group">
          <span className="font-body text-[0.5rem] tracking-[0.35em] uppercase text-gold">
            AI-Powered Style Studio
          </span>
          <span className="font-display text-2xl text-ink tracking-wider group-hover:text-gold-dark transition-colors">
            Lumière
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              /*
              pathname is our current url path,
              we compare it to the 'to' property of each link to determine if it's the active page.
              if pathname === to, we apply the 'text-gold-dark' class to highlight the active link.
              otherwise, we apply 'text-ink-3' for the default color and 'hover:text-gold-dark' for the hover effect.
              after is a pseudo-element that creates an underline effect on the active link.
             after:absolute --> Positions the underline absolutely
             after:bottom-[-2px]-->Sits 2px below the link text
             after:left-0-->Starts from the left edge
             after:h-px --> Height of 1px — a thin line
             after:transition-allAnimates any changes
             after:duration-300--> Animation takes 300ms */
              className={`font-body text-xs tracking-[0.18em] uppercase transition-colors relative
                ${pathname === to ? 'text-gold-dark' : 'text-ink-3 hover:text-gold-dark'}
                after:absolute after:bottom-[-2px] after:left-0 after:h-px after:bg-gold
                after:transition-all after:duration-300
                ${pathname === to ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
              `}
            >
              {label}
            </Link>
          ))}
          {/* Wishlist icon */}
          <Link
            to="/wishlist"
            title="Your wishlist"
            className="relative w-8 h-8 rounded-full border border-gold/40 flex items-center justify-center
              text-gold-dark hover:bg-gold hover:text-white hover:border-gold transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {user && wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-white
                text-[0.55rem] font-ui flex items-center justify-center leading-none">
                {wishlistCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  title="Admin panel"
                  className="w-8 h-8 rounded-full border border-gold/40 flex items-center justify-center
                    text-gold-dark hover:bg-gold hover:text-white hover:border-gold transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </Link>
              )}
              <Link
                to="/my-style"
                title={`Signed in as ${user.name}`}
                className="w-8 h-8 rounded-full border border-gold/40 flex items-center justify-center
                  text-gold-dark hover:bg-gold hover:text-white hover:border-gold transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                </svg>
              </Link>
              <button
                onClick={logout}
                className="font-body text-xs tracking-[0.18em] uppercase border border-gold/40
                  text-gold-dark px-4 py-2 rounded-sm hover:bg-gold hover:text-white transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="bg-gold text-white font-body text-xs font-medium tracking-[0.18em] uppercase
                px-5 py-2.5 rounded-sm shadow-[0_2px_10px_rgba(201,168,76,0.25)]
                hover:bg-gold-dark transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(o => !o)}
          // md is the breakpoint for medium screens, hidden on md and above, visible on smaller screens
          className="md:hidden text-ink-3 hover:text-gold transition-colors"
          aria-label="Toggle menu"
        >
          {open ? (
            // draw X icon when menu is open
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            // draw hamburger icon when menu is closed
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gold/15 px-6 py-4 flex flex-col gap-4">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`font-body text-xs tracking-[0.2em] uppercase py-1
                ${pathname === to ? 'text-gold-dark' : 'text-ink-3'}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <div className="border-t border-gold/10 pt-3 mt-1 flex flex-col gap-3">
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="font-body text-xs tracking-[0.2em] uppercase text-ink-3 flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Admin
                  </Link>
                )}
              <Link
                  to="/my-style"
                  onClick={() => setOpen(false)}
                  className="font-body text-xs tracking-[0.2em] uppercase text-ink-3 flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                  </svg>
                  My Style
                  <span className="text-muted font-light normal-case tracking-normal">({user.name})</span>
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setOpen(false)}
                  className="font-body text-xs tracking-[0.2em] uppercase text-ink-3 flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-gold text-white text-[0.55rem] font-ui flex items-center justify-center leading-none">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => { logout(); setOpen(false) }}
                  className="font-body text-xs tracking-[0.18em] uppercase border border-gold/40
                    text-gold-dark text-center px-5 py-2.5 rounded-sm cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => { setShowAuth(true); setOpen(false) }}
              className="font-body text-xs tracking-[0.18em] uppercase bg-gold text-white text-center
                px-5 py-2.5 rounded-sm mt-1 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  )
}
