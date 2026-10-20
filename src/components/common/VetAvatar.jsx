import React, { useState } from 'react';
import { Stethoscope, ShieldCheck } from 'lucide-react';

/**
 * Reusable VetAvatar component.
 * Displays a verified clinical veterinary doctor crest or user-uploaded photo.
 * Avoids inventing fake personal faces, adhering strictly to professional healthcare placeholder standards.
 */
export default function VetAvatar({
  fullName = 'Doctor',
  photoUrl = null,
  size = 'medium', // 'small' | 'medium' | 'large'
  isApproved = true,
  className = '',
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    small: { px: 36, iconSize: 16, fontSize: '11px', badgeSize: 12 },
    medium: { px: 48, iconSize: 20, fontSize: '14px', badgeSize: 14 },
    large: { px: 68, iconSize: 28, fontSize: '18px', badgeSize: 18 },
  };

  const { px, iconSize, fontSize, badgeSize } = sizeMap[size] || sizeMap.medium;

  const initials = fullName
    ? fullName
        .replace(/^Dr\.?\s*/i, '')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'VT';

  const showPhoto = Boolean(photoUrl) && !imageError;

  return (
    <div
      className={`bovicare-vet-avatar size-${size} ${className}`}
      style={{
        width: `${px}px`,
        height: `${px}px`,
        minWidth: `${px}px`,
        minHeight: `${px}px`,
        borderRadius: '50%',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(22, 56, 43, 0.12)',
      }}
      aria-label={`Dr. ${fullName}`}
    >
      {showPhoto ? (
        <>
          {!imageLoaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: 'rgba(23, 115, 62, 0.15)',
              }}
              aria-hidden="true"
            />
          )}
          <img
            src={photoUrl}
            alt={`Dr. ${fullName}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 200ms ease-in-out',
            }}
          />
        </>
      ) : (
        /* Clinical Veterinary Badge */
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #16382B 0%, #1F4A39 60%, #2D6A4F 100%)',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          {size === 'large' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <Stethoscope size={iconSize} color="#A7D4B6" />
              <span style={{ fontSize, fontWeight: '700', letterSpacing: '0.05em', lineHeight: 1 }}>
                {initials}
              </span>
            </div>
          ) : (
            <span style={{ fontSize, fontWeight: '700', letterSpacing: '0.03em' }}>
              {initials}
            </span>
          )}

          {/* Subtle medical cross watermark */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0.15,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <path d="M12 4V20M4 12H20" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Verified KYC Indicator Badge */}
      {isApproved && (
        <span
          style={{
            position: 'absolute',
            bottom: '-1px',
            right: '-1px',
            width: `${badgeSize + 4}px`,
            height: `${badgeSize + 4}px`,
            borderRadius: '50%',
            backgroundColor: '#1E7C48',
            border: '2px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}
          title="KYC Verified Veterinarian"
          aria-label="Verified"
        >
          <ShieldCheck size={badgeSize - 2} />
        </span>
      )}
    </div>
  );
}
