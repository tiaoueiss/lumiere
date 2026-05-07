export default function SectionHeader({ eyebrow, title, subtitle, center = false, light = false, size = 'default' }) {
  const titleSize = size === 'hero'
    ? 'text-5xl md:text-7xl'
    : 'text-4xl md:text-5xl'

  return (
    <div className={`flex flex-col gap-3 ${center ? 'items-center text-center' : ''}`}>
      {eyebrow && (
        <p className={`font-body text-[0.68rem] font-medium tracking-[0.28em] uppercase ${light ? 'text-gold-light' : 'text-gold'}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`font-display ${titleSize} font-normal leading-tight ${light ? 'text-cream' : 'text-ink'}`}>
        {title}
      </h2>
      {/* Gold rule */}
      <div className={`h-px w-12 bg-gold ${center ? 'mx-auto' : ''} mt-1`} />
      {subtitle && (
        <p className={`font-body font-light text-sm md:text-base leading-relaxed max-w-xl mt-1 ${light ? 'text-cream/70' : 'text-muted'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
