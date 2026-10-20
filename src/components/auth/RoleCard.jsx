import React from 'react';
import { CheckCircle2, Tractor, Stethoscope, ShieldCheck } from 'lucide-react';

const ROLE_ICONS = {
  farmer: Tractor,
  vet: Stethoscope,
  admin: ShieldCheck,
};

export default function RoleCard({ role, isSelected, onSelect }) {
  const IconComponent = ROLE_ICONS[role.id] || ShieldCheck;

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => onSelect(role.id)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onSelect(role.id);
        }
      }}
      className={`role-card ${isSelected ? 'is-selected' : ''}`}
      id={`role-option-${role.id}`}
    >
      <div className="role-card-indicator" aria-hidden="true">
        {isSelected ? (
          <CheckCircle2 size={18} className="role-check-icon active" />
        ) : (
          <div className="role-radio-hollow" />
        )}
      </div>

      <div className="role-card-content">
        <div className="role-header-line">
          <div className="role-icon-box">
            <IconComponent size={20} className="role-icon" />
          </div>
          <div className="role-titles">
            <span className="role-title">{role.title}</span>
            <span className="role-tagline">{role.tagline}</span>
          </div>
        </div>

        <p className="role-desc">{role.description}</p>

        <div className="role-destination-badge">
          <span className="role-dest-label">Destination:</span>
          <span className="role-dest-name">{role.destinationName}</span>
        </div>
      </div>
    </div>
  );
}
