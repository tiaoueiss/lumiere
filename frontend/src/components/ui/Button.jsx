import { Link } from 'react-router-dom'

// Base styles for the button, including layout, typography, and transition effects.
const base = `inline-flex items-center justify-center gap-2
  font-body font-medium text-xs tracking-[0.22em] uppercase
  transition-all duration-200 rounded-sm`

// Variants define different visual styles for the button, such as primary, outline, ghost, and dark.
// Each variant applies a different combination of background color, text color, border, shadow, and hover effects.
const variants = {
  primary:   'bg-gold text-white shadow-[0_2px_12px_rgba(201,168,76,0.3)] hover:bg-gold-dark hover:-translate-y-px',
  outline:   'border border-gold text-gold-dark hover:bg-gold-pale hover:border-gold-dark',
  ghost:     'text-ink-3 hover:text-gold-dark',
  dark:      'bg-ink text-cream hover:bg-ink-2',
}

const sizes = {
  sm: 'px-4 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-4 text-[0.75rem]',
}
// The Button component is a versatile UI element that can render as a link, anchor, or button based on the props provided.
// It accepts children (the content inside the button), variant (the visual style), size (the padding and font size), to (for internal links), href (for external links), and additional className for custom styling.
// props are spread onto the rendered element to allow for additional attributes like onClick, type, etc.
export default function Button({ children, variant = 'primary', size = 'md', to, href, className = '', ...props }) {
  // The cls variable is a tailwind string that combines the base styles with the selected variant and size styles, as well as any additional className passed in as a prop.
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`

  // to is a prop for internal navigation using react-router's Link component, while href is for external links using a standard anchor tag. 
  // If neither is provided, it defaults to a button element.
  if (to)   return <Link to={to} className={cls} {...props}>{children}</Link>
  if (href) return <a href={href} className={cls} {...props}>{children}</a>
  return <button className={cls} {...props}>{children}</button>
}