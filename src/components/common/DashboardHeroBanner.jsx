import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function DashboardHeroBanner({
  title,
  subtitle,
  actionText,
  onActionClick,
  statusItems = [],
  bannerTheme = 'farmer', // farmer | vet | admin
  backgroundImage = '/images/hero/dairy_farm_hero.jpg',
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const showBg = bannerTheme === 'farmer' && Boolean(backgroundImage) && !imageError;

  return (
    <section className={`dashboard-hero-banner theme-${bannerTheme}`} aria-label="Dashboard Overview Banner">
      {/* High-quality realistic dairy farm photography backdrop */}
      {showBg && (
        <div className="hero-photo-backdrop" aria-hidden="true">
          <img
            src={backgroundImage}
            alt="High-yield dairy cows grazing on lush green pasture"
            loading="eager"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`hero-bg-photo ${imageLoaded ? 'loaded' : ''}`}
          />
          <div className="hero-gradient-overlay" />
        </div>
      )}

      <div className="hero-content-col">
        <h2 className="hero-heading">{title}</h2>
        <p className="hero-subheading">{subtitle}</p>

        {actionText && (
          <button
            type="button"
            className="hero-action-btn"
            onClick={onActionClick}
          >
            <span>{actionText}</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Bovine / Health Silhouette Graphic */}
      <div className="hero-graphic-col" aria-hidden="true">
        <div className="hero-art-circle">
          <svg viewBox="0 0 100 100" fill="none" className="hero-cow-svg">
            <circle cx="50" cy="50" r="46" fill="rgba(255, 255, 255, 0.08)" />
            {/* Minimalist cow head silhouette */}
            <path d="M30 40C24 38 18 42 20 48C24 48 28 44 32 44" stroke="#A7D4B6" strokeWidth="3" strokeLinecap="round" />
            <path d="M70 40C76 38 82 42 80 48C76 48 72 44 68 44" stroke="#A7D4B6" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 36C30 28 36 24 40 26" stroke="#D1EADE" strokeWidth="3" strokeLinecap="round" />
            <path d="M68 36C70 28 64 24 60 26" stroke="#D1EADE" strokeWidth="3" strokeLinecap="round" />
            <path d="M34 40C34 35 40 31 50 31C60 31 66 35 66 40V52C66 60 60 68 50 68C40 68 34 60 34 52V40Z" fill="#FFFFFF" opacity="0.95" />
            <path d="M38 54C38 51 43 50 50 50C57 50 62 51 62 54C62 61 57 67 50 67C43 67 38 61 38 54Z" fill="#EAF2EC" />
            <circle cx="45" cy="58" r="2" fill="#16382B" />
            <circle cx="55" cy="58" r="2" fill="#16382B" />
            <circle cx="41" cy="43" r="2.5" fill="#16382B" />
            <circle cx="59" cy="43" r="2.5" fill="#16382B" />
          </svg>
        </div>
      </div>

      {/* Bottom Status Summary Pills */}
      {statusItems.length > 0 && (
        <div className="hero-status-strip">
          {statusItems.map((item, index) => (
            <div key={index} className="hero-status-item">
              <span className={`status-indicator-dot dot-${item.type}`} />
              <span className="status-item-text">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
