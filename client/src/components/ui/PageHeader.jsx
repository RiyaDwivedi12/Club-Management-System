// Standard page heading used across the app, modelled on the landing page
// section headings: small blue eyebrow pill, navy extrabold title, slate copy.
// `variant="hero"` renders the navy → blue gradient band for top-level pages.
const PageHeader = ({ eyebrow, eyebrowIcon: EyebrowIcon, title, description, actions, icon: Icon, variant = 'plain', children }) => {
  if (variant === 'hero') {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-brand-gradient text-white px-5 py-7 sm:px-8 sm:py-9 shadow-xl shadow-blue-900/15">
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
        {Icon && (
          <Icon size={220} strokeWidth={1} className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-white/[0.07] pointer-events-none" />
        )}
        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="max-w-2xl min-w-0">
            {eyebrow && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-100 text-xs font-semibold mb-3">
                {EyebrowIcon ? <EyebrowIcon size={13} /> : <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />}
                {eyebrow}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight break-words">{title}</h1>
            {description && <p className="mt-2 text-sm sm:text-base text-blue-100/85 leading-relaxed">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
        {children && <div className="relative mt-6">{children}</div>}
      </section>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0 flex items-start gap-3.5">
        {Icon && (
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-blue-600 text-white items-center justify-center shrink-0 shadow-md shadow-blue-600/25">
            <Icon size={22} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-semibold text-blue-600 mb-1">{eyebrow}</p>}
          <h1 className="page-title break-words">{title}</h1>
          {description && <p className="page-subtitle mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
