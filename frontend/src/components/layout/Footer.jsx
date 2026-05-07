import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gold/20 mt-24">
      <div className="gold-rule" />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <p className="font-body text-[0.5rem] tracking-[0.35em] uppercase text-gold mb-1">
              Find Your Style
            </p>
            <h2 className="font-display text-3xl text-ink mb-3">Lumière</h2>
            <p className="font-body text-sm text-muted font-light leading-relaxed max-w-xs">
              Where technology meets timeless elegance. Try on fine jewelry from the comfort of anywhere.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-body text-[0.6rem] tracking-[0.25em] uppercase text-gold mb-4">Navigation</p>
            <ul className="flex flex-col gap-2.5">
              {[['/', 'Home'], ['/tryon', 'Virtual Try-On'], ['/products', 'Collection'], ['/about', 'About']].map(([to, label]) => (
               // react requires key prop on every element inside map, using 'to' as key since it's unique for each link
               //without it, react would rerender the entire list on every update, causing performance issues and bugs
               <li key={to}>
                {/*link is from react router
                * react router is a library for handling routing in react applications 
                routing is the process of determining what component to display based on the current URL
                it renders an an <a> tag in html, but intercepts the click event to handle client-side navigation, 
                instead of reloading the page
                example: clicking a link with <a> would cause a full page reload, while using <Link> handles the navigation on the client side
                */}
                  <Link to={to} className="font-body text-sm text-ink-3 hover:text-gold-dark transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gold/12 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-body text-[0.6rem] tracking-[0.15em] uppercase text-muted-light">
            © 2026 Lumière. All rights reserved.
          </p>
          <p className="font-body text-[0.6rem] tracking-[0.15em] uppercase text-muted-light">
            Final Year Project — AI Virtual Try-On
          </p>
        </div>
      </div>
    </footer>
  )
}