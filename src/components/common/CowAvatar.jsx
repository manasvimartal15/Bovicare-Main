import React, { useState } from 'react';

/**
 * Reusable CowAvatar component.
 * Supports realistic farmer-uploaded photos with smooth loading states & error fallback,
 * or breed-tailored bovine silhouette badges when no photo is provided.
 */
export default function CowAvatar({
  photoUrl,
  name = 'Dairy Cow',
  tagId = '',
  breed = '',
  size = 'medium', // 'small' | 'medium' | 'large' | 'xlarge'
  avatarColor = '#17733E',
  className = '',
  rounded = 'circle', // 'circle' | 'rounded'
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeDimensions = {
    small: 36,
    medium: 48,
    large: 72,
    xlarge: 96,
  };

  const px = sizeDimensions[size] || 48;
  const borderRadius = rounded === 'circle' ? '50%' : '14px';

  const showPhoto = Boolean(photoUrl) && !imageError;

  return (
    <div
      className={`bovicare-cow-avatar size-${size} ${className}`}
      style={{
        width: `${px}px`,
        height: `${px}px`,
        minWidth: `${px}px`,
        minHeight: `${px}px`,
        borderRadius,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: `${avatarColor}15`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-label={`${name} ${tagId ? `(${tagId})` : ''}`}
    >
      {showPhoto ? (
        <>
          {!imageLoaded && (
            <div
              className="cow-avatar-skeleton-shimmer"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(23, 115, 62, 0.12)',
              }}
              aria-hidden="true"
            />
          )}
          <img
            src={photoUrl}
            alt={`${name} portrait`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius,
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 200ms ease-in-out',
            }}
          />
        </>
      ) : (
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: `${Math.round(px * 0.72)}px`, height: `${Math.round(px * 0.72)}px` }}
          aria-hidden="true"
        >
          {/* Circular subtle backdrop */}
          <circle cx="20" cy="20" r="18" fill={avatarColor} fillOpacity="0.12" />
          
          {/* Bovine Head Silhouette & Ears */}
          <path
            d="M11 16C9 15 6 17 7 20C9 20 11 18 12 18"
            stroke={avatarColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M29 16C31 15 34 17 33 20C31 20 29 18 28 18"
            stroke={avatarColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 15C11 11 14 9 16 10"
            stroke={avatarColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M28 15C29 11 26 9 24 10"
            stroke={avatarColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          
          {/* Main Face Contour */}
          <path
            d="M13 16C13 13.5 16 12 20 12C24 12 27 13.5 27 16V22C27 26 24 29 20 29C16 29 13 26 13 22V16Z"
            fill="#FFFFFF"
            stroke={avatarColor}
            strokeWidth="1.4"
          />
          
          {/* Snout */}
          <ellipse cx="20" cy="24" rx="4.5" ry="3.5" fill={avatarColor} fillOpacity="0.18" />
          <circle cx="18" cy="24.5" r="0.8" fill={avatarColor} />
          <circle cx="22" cy="24.5" r="0.8" fill={avatarColor} />
          
          {/* Eyes */}
          <circle cx="17.5" cy="18" r="1.1" fill={avatarColor} />
          <circle cx="22.5" cy="18" r="1.1" fill={avatarColor} />
        </svg>
      )}
    </div>
  );
}
