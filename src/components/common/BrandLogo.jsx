import React from 'react';

/**
 * Official BoviCare Brand Logo Component
 * Uses the supplied official logo artwork (/images/bovicare-logo.png)
 * Compatible with GitHub Pages deployment base path (/Bovicare-Main/)
 */
export default function BrandLogo({
  size = 'medium',
  className = '',
  alt = 'BoviCare — Smarter Monitoring, Better Veterinary Support, Healthier Herds.',
  onClick,
}) {
  // Prepend Vite's BASE_URL (e.g. '/Bovicare-Main/' on GitHub Pages or '/' in local dev)
  const baseUrl = import.meta.env.BASE_URL || '/';
  const logoSrc = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}images/bovicare-logo.png`;

  return (
    <div
      className={`bovicare-official-brand bovicare-brand-${size} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <img
        src={logoSrc}
        alt={alt}
        className="bovicare-official-logo-img"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
