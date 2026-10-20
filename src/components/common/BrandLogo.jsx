import React from 'react';

export default function BrandLogo({ size = 'medium', showTagline = true, lightMode = false }) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const iconDimension = isLarge ? 52 : isSmall ? 32 : 42;

  return (
    <div className={`bovicare-brand ${lightMode ? 'brand-light' : ''}`}>
      <div 
        className="brand-icon-wrapper"
        style={{ width: iconDimension, height: iconDimension }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="brand-svg"
          aria-hidden="true"
        >
          {/* Circular soft base */}
          <rect width="48" height="48" rx="14" fill="#1A3D2F" />
          
          {/* Subtle decorative ring */}
          <circle cx="24" cy="24" r="20" stroke="#2D5A46" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />

          {/* Bovine Head Silhouette with Medical Care Emblem */}
          {/* Ears */}
          <path d="M14 19C11 18 8 20 9 23C11 23 13 21 15 21" stroke="#EAF2EC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34 19C37 18 40 20 39 23C37 23 35 21 33 21" stroke="#EAF2EC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Horns */}
          <path d="M15 17C14 13 17 11 19 12" stroke="#B8D8C3" strokeWidth="2" strokeLinecap="round" />
          <path d="M33 17C34 13 31 11 29 12" stroke="#B8D8C3" strokeWidth="2" strokeLinecap="round" />

          {/* Head & Muzzle contour */}
          <path d="M16 19C16 16.5 19 14.5 24 14.5C29 14.5 32 16.5 32 19V25C32 29 29 33 24 33C19 33 16 29 16 25V19Z" fill="#FFFFFF" />

          {/* Snout patch */}
          <path d="M18 26C18 24.5 20.5 24 24 24C27.5 24 30 24.5 30 26C30 29.5 27.5 32.5 24 32.5C20.5 32.5 18 29.5 18 26Z" fill="#EAF2EC" />
          
          {/* Nostrils */}
          <ellipse cx="21.5" cy="28.5" rx="1" ry="1.2" fill="#1A3D2F" />
          <ellipse cx="26.5" cy="28.5" rx="1" ry="1.2" fill="#1A3D2F" />

          {/* Eyes */}
          <circle cx="19.5" cy="20.5" r="1.3" fill="#1A3D2F" />
          <circle cx="28.5" cy="20.5" r="1.3" fill="#1A3D2F" />

          {/* Health Cross / Plus Badge in forest green */}
          <circle cx="34" cy="32" r="7.5" fill="#1E7C48" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M34 28.5V35.5M30.5 32H37.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>

      <div className="brand-text-block">
        <div className="brand-title-row">
          <span className="brand-name">BoviCare</span>
          <span className="brand-badge-pill">Dairy Health</span>
        </div>
        {showTagline && (
          <p className="brand-tagline">Dairy Cattle Health & Herd Intelligence</p>
        )}
      </div>
    </div>
  );
}
