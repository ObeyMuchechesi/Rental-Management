export default function SectionHeading({ eyebrow, title, subtitle, align = 'center', light = false }) {
  return (
    <div className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : 'text-left'}`}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-600">{eyebrow}</p>
      )}
      <h2 className={`mt-2 font-display text-3xl font-semibold sm:text-4xl ${light ? 'text-white' : 'text-brand-950'}`}>{title}</h2>
      {subtitle && <p className={`mt-3 text-base leading-relaxed ${light ? 'text-brand-300' : 'text-brand-700'}`}>{subtitle}</p>}
    </div>
  );
}