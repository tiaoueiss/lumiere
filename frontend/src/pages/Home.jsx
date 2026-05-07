import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import SectionHeader from '../components/ui/SectionHeader'


// Data for features and steps, could be moved to separate files if needed
const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="12" cy="8" r="5"/><path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2"/>
      </svg>
    ),
    title: 'Skin Undertone',
    body: 'Discover whether your skin runs warm, cool, or neutral — and what that means for everything you wear.',
  },
  {
    icon: (
        // SVG generated from Figma
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Color Palette',
    body: 'Get a personalized wardrobe palette based on seasonal color analysis — the shades that make you glow.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: 'Hair Color Match',
    body: 'AI-recommended hair colors that complement your skin tone, eye color, and natural features.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
      </svg>
    ),
    title: 'Virtual Try-On',
    body: 'See necklaces on your own body in real time using AI pose detection — no app, no upload, fully private.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Wash-Out Warnings',
    body: 'Know which colors drain your complexion so you can avoid them and always look your best.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>
      </svg>
    ),
    title: 'Jewelery Metals',
    body: 'Gold, silver, or rose gold? Your undertone decides. We tell you which metals flatter you most.',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Upload a Photo',
    body: 'Take a selfie or upload one. No data leaves your device — all processing is local.',
   
  },
  {
    step: '02',
    title: 'Choose Your Analysis',
    body: 'Pick from undertone, hair color, outfit palette, face shape — or run them all at once.',
    
  },
  {
    step: '03',
    title: 'Get Your Results',
    body: 'Receive a personalized style dashboard with color swatches, recommendations, and actionable advice.',
  },
]

export default function Home() {
  return (
    <main className="pt-[72px]">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="min-h-[92vh] flex flex-col items-center justify-center text-center px-6 bg-[radial-gradient(ellipse_at_0%_0%,rgba(201,168,76,0.07)_0%,transparent_60%),radial-gradient(ellipse_at_100%_100%,rgba(201,168,76,0.05)_0%,transparent_50%)]">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <p className="font-body text-[0.6rem] tracking-[0.38em] uppercase text-gold mb-4">
            AI-Powered Style Analysis
          </p>
          <h1 className="font-display text-6xl md:text-8xl text-ink leading-[1.05] mb-6">
            Discover the <br />
            <em>Colors</em> You Were<br />
            Made For
          </h1>
          <div className="gold-rule max-w-[160px] mx-auto mb-6" />
          <p className="font-body text-base text-muted font-light leading-relaxed max-w-lg mx-auto mb-10">
            Lumière uses AI to analyze your unique features and reveal your perfect color palette,
            hair shades, jewelry metals, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button to="/style" size="lg">Find Your Style</Button>
            <Button to="/tryon" variant="outline" size="lg">Virtual Try-On</Button>
          </div>
        </div>
      </section>

      {/* ── What it does ─────────────────────────────── */}
      <section className="py-24 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
          // eyebrow is optional small text above title
            eyebrow="What We Do"
            title={<>Your personal<br /><em>style intelligence</em></>}
            subtitle="Upload a single photo and unlock a complete analysis of the colors, shades, and metals that suit you best."
            center
          />
        {/* ──we get features from above and map them to cards with icon, title, body─── */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, body }) => (
              <div
                key={title}
                className="bg-white border border-gold/15 rounded-xl p-6 flex flex-col gap-3
                  hover:border-gold/40 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(201,168,76,0.1)]
                  transition-all duration-300"
              >
                <div className="text-gold">{icon}</div>
                <h3 className="font-ui text-base tracking-wide text-ink-2">{title}</h3>
                <p className="font-body text-xs text-muted font-light leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="The Process"
            title={<>Three steps.<br /><em>One complete picture.</em></>}
            center
          />
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <span className="font-display text-5xl text-gold/20 leading-none select-none">{step}</span>
                </div>
                <h3 className="font-ui text-lg tracking-wide text-ink">{title}</h3>
                <p className="font-body text-sm text-muted font-light leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section> 
     

      {/* ── Virtual Try-On teaser ────────────────────────── */}
      <section className="py-24 px-6 bg-cream-2">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <div className="bg-white border border-gold/15 rounded-2xl aspect-[4/3] flex items-center justify-center">
              <div className="text-center opacity-40">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <p className="font-body text-xs text-muted mt-3">Live camera preview</p>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <SectionHeader
              eyebrow="Virtual Try-On"
              title={<>See jewelry<br /><em>on you — live</em></>}
              subtitle="Our pose-detection engine tracks 33 body landmarks at 30fps to place necklaces on your body with anatomical precision. No upload needed — it all runs in your browser."
            />
            <div className="mt-6 flex gap-4">
              <Button to="/tryon" size="lg">Open Try-On</Button>
              <Button to="/about" variant="outline" size="lg">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-28 px-6 text-center bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="font-body text-[0.6rem] tracking-[0.35em] uppercase text-gold mb-4">
            Ready?
          </p>
          <h2 className="font-display italic text-5xl md:text-6xl text-ink mb-6">
            Your best colors are waiting.
          </h2>
          <div className="gold-rule max-w-[120px] mx-auto mb-8" />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button to="/style" size="lg">Find Your Style</Button>
            <Button to="/tryon" variant="outline" size="lg">Virtual Try-On</Button>
          </div>
        </div>
      </section>

    </main>
  )
}