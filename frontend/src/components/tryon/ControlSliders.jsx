export default function ControlSliders({ yOffset, scale, opacity, setYOffset, setScale, setOpacity }) {
  const sliders = [
    { label: 'Vertical',  value: yOffset,  setter: setYOffset,  min: -0.15, max: 0.25, step: 0.01 },
    { label: 'Scale',     value: scale,    setter: setScale,    min: 0.5,   max: 1.5,  step: 0.05 },
    { label: 'Opacity',   value: opacity,  setter: setOpacity,  min: 0.3,   max: 1.0,  step: 0.05 },
  ]

  return (
    <div className="bg-white border border-gold/18 rounded-xl px-5 py-4">
      <p className="font-body text-[0.6rem] tracking-[0.28em] uppercase text-gold mb-4">
        Fine-tune Position
      </p>
      <div className="grid grid-cols-3 gap-5">
        {sliders.map(({ label, value, setter, min, max, step }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="font-body text-[0.6rem] tracking-[0.15em] uppercase text-ink-3">
                {label}
              </label>
              <span className="font-ui text-[0.65rem] text-gold-dark">
                {value.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={e => setter(e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}