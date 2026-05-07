import SectionHeader from '../components/ui/SectionHeader'
import Button from '../components/ui/Button'

export default function About() {
  return (
    <main className="pt-[72px]">

      {/* Hero */}
      <section className="min-h-[72vh] flex items-center py-32 md:py-40 px-6 bg-cream-2 border-b border-gold/15">
        <div className="max-w-4xl mx-auto text-center">
          <SectionHeader
            eyebrow="Our Story"
            title={<>A style studio<br /><em>for everyone</em></>}
            subtitle="Lumiere is a final year project built around one belief: personal style guidance should feel thoughtful, intelligent, and accessible, not reserved for people who can afford a private stylist."
            center
            size="hero"
          />
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 md:py-28 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-3xl">
            <SectionHeader
              eyebrow="The Mission"
              title={<>Making luxury<br /><em>more accessible</em></>}
            />
            <div className="flex flex-col gap-5 mt-8">
              <p className="font-body text-base text-muted font-light leading-loose">
                Style analysis has always been a luxury. For many people, understanding their undertone,
                best colors, flattering metals, face shape, and ideal hair shades meant booking an
                expensive consultation, relying on trends, or learning through years of trial and error.
              </p>
              <p className="font-body text-base text-muted font-light leading-loose">
                Lumiere was created to make that experience feel closer, kinder, and more available.
                Instead of telling people to change who they are, it helps them see what already works
                beautifully with their natural features. A single photo becomes a starting point for
                confidence, clarity, and self-expression.
              </p>
              <p className="font-body text-base text-muted font-light leading-loose">
                The platform combines AI-powered style analysis with a browser-based jewelry try-on.
                It studies color harmony and facial features, then lets users preview necklaces on
                themselves using MediaPipe Face Mesh, all without needing a studio appointment or a
                downloaded app.
              </p>
            </div>
          </div>
        
        </div>
      </section>

      {/* Platform features */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="The Platform"
            title={<>Guidance first,<br /><em>technology in service</em></>}
            subtitle="Lumiere brings together style analysis, jewelry recommendations, and virtual try-on in one gentle, practical experience."
          />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gold/15 rounded-xl p-8 flex flex-col gap-4 hover:border-gold/35 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold text-sm font-ui">AI</div>
                <h3 className="font-ui text-lg tracking-wide text-ink">Find Your Style</h3>
              </div>
              <p className="font-body text-sm text-muted font-light leading-relaxed">
                Upload a selfie and receive a guided analysis of your undertone, color season, face
                shape, flattering metals, outfit palette, and hair color direction. The goal is not to
                replace human taste, but to give every user a thoughtful starting point that feels
                personal and easy to understand.
              </p>
              <Button to="/style" variant="outline" className="self-start mt-2">Try It</Button>
            </div>
            <div className="bg-white border border-gold/15 rounded-xl p-8 flex flex-col gap-4 hover:border-gold/35 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold text-sm font-ui">AR</div>
                <h3 className="font-ui text-lg tracking-wide text-ink">Virtual Try-On</h3>
              </div>
              <p className="font-body text-sm text-muted font-light leading-relaxed">
                The try-on experience uses MediaPipe Face Mesh in the browser to follow facial landmarks
                around the chin and jawline, then places necklaces with adjustable scale, position, and
                opacity. Users can browse the collection or upload their own transparent PNG or WebP
                pieces to test different looks.
              </p>
              <Button to="/tryon" variant="outline" className="self-start mt-2">Open Atelier</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="The Technology"
            title={<>A modern stack with<br /><em>a human purpose</em></>}
            subtitle="The project blends web development, AI vision, image processing, and real-time computer vision to turn style advice into an interactive product."
          />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'AI Style Analysis',
                body: 'The backend sends the uploaded photo through a two-pass AI vision flow using Groq and a Llama vision model: first observing visual cues, then classifying undertone, face shape, hair color context, and related style recommendations.',
                icon: 'AI',
              },
              {
                title: 'MediaPipe Face Mesh',
                body: 'The virtual try-on runs in the browser with MediaPipe Face Mesh and camera utilities. It uses chin and jaw landmarks to anchor necklace placement in real time.',
                icon: 'MP',
              },
              {
                title: 'React + Vite',
                body: 'The frontend is built with React and Vite for a fast, component-based user experience across the gallery, style dashboard, authentication modal, and try-on studio.',
                icon: 'FE',
              },
              {
                title: 'Node.js + Express',
                body: 'The API handles authentication, OTP signup verification, image preprocessing, necklace data, wishlist features, and communication with the AI analysis service.',
                icon: 'API',
              },
              {
                title: 'MongoDB + Mongoose',
                body: 'MongoDB stores users, necklaces, wishlist references, style profile data, and temporary email verification records for signup OTPs.',
                icon: 'DB',
              },
              {
                title: 'Tailwind CSS',
                body: 'Tailwind powers the visual system with warm neutrals, gold accents, responsive layouts, and reusable styling patterns that support the luxury-inspired identity.',
                icon: 'CSS',
              },
            ].map(({ title, body, icon }) => (
              <div key={title} className="bg-cream border border-gold/15 rounded-xl p-6 flex flex-col gap-3 hover:border-gold/35 transition-colors">
                <span className="font-ui text-xs tracking-[0.3em] text-gold">{icon}</span>
                <h3 className="font-ui text-base tracking-wide text-ink-2">{title}</h3>
                <p className="font-body text-xs text-muted font-light leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-cream-2 text-center">
        <h2 className="font-display italic text-5xl text-ink mb-4">Style should feel personal.</h2>
        <p className="font-body text-sm text-muted font-light mb-8 max-w-md mx-auto">
          Upload a photo, explore your palette, and try on jewelry in a way that feels thoughtful,
          accessible, and made for you.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button to="/style" size="lg">Find Your Style</Button>
          <Button to="/tryon" variant="outline" size="lg">Virtual Try-On</Button>
        </div>
      </section>

    </main>
  )
}
