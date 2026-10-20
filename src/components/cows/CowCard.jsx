import React from 'react';
import { ChevronRight, Milk, Thermometer, Calendar } from 'lucide-react';
import CowAvatar from '../common/CowAvatar';

export default function CowCard({ cow, onClick }) {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'alert':
        return 'alert';
      case 'watch':
        return 'watch';
      default:
        return 'healthy';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'alert':
        return 'Needs Attention';
      case 'watch':
        return 'Under Observation';
      default:
        return 'Healthy';
    }
  };

  return (
    <article
      className="cow-card-item"
      onClick={() => onClick(cow.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(cow.id);
        }
      }}
      aria-label={`View profile for ${cow.name}, ${cow.tagId}`}
    >
      {/* Cow Image / Stylized Silhouette */}
      <div className="cow-card-media">
        <CowAvatar
          photoUrl={cow.photoUrl}
          name={cow.name}
          tagId={cow.tagId}
          breed={cow.breed}
          avatarColor={cow.avatarColor || '#17733E'}
          size="medium"
          rounded="circle"
        />
      </div>

      {/* Main Details */}
      <div className="cow-card-content">
        <div className="cow-card-header-row">
          <h4 className="cow-title-text">{cow.name}</h4>
          <span className={`badge-pill ${getBadgeClass(cow.status)}`}>
            {getStatusText(cow.status)}
          </span>
        </div>

        <div className="cow-card-subline">
          <span className="cow-tag-label">{cow.tagId}</span>
          <span className="cow-divider">•</span>
          <span className="cow-breed-label">{cow.breed}</span>
        </div>

        <div className="cow-card-stats-row">
          <span className="cow-stat-chip milk">
            <Milk size={13} />
            <strong>{cow.milkYieldPerDay || cow.milkToday || '—'}</strong> L/day
          </span>
          <span className="cow-stat-chip age">
            <Calendar size={13} />
            {cow.ageYears} yrs
          </span>
          {cow.temperature && (
            <span className={`cow-stat-chip temp ${cow.status === 'alert' ? 'temp-alert' : ''}`}>
              <Thermometer size={13} />
              {cow.temperature}
            </span>
          )}
        </div>
      </div>

      {/* Action Affordance */}
      <div className="cow-card-arrow" aria-hidden="true">
        <ChevronRight size={18} />
      </div>
    </article>
  );
}
