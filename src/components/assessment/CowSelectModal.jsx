import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useCows } from '../../context/CowsContext';
import CowAvatar from '../common/CowAvatar';

export default function CowSelectModal({
  isOpen,
  onClose,
  selectedCowId,
  onSelectCow,
  title = 'Select Cow for Health Check',
  badge = 'Step 1: Cow Selection',
}) {
  const { cows } = useCows();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredCows = cows.filter((cow) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      (cow.name || '').toLowerCase().includes(q) ||
      (cow.tagId || '').toLowerCase().includes(q) ||
      (cow.breed || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container cow-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            {badge && <span className="modal-badge">{badge}</span>}
            <h3 className="modal-title">{title}</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="picker-search-wrap">
          <Search size={16} className="picker-search-icon" />
          <input
            type="text"
            className="picker-search-input"
            placeholder="Search cow by name or tag ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* List */}
        <div className="picker-cows-list">
          {filteredCows.map((cow) => {
            const isSelected = selectedCowId === cow.id;
            return (
              <div
                key={cow.id}
                className={`picker-cow-row ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectCow(cow);
                  onClose();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectCow(cow);
                    onClose();
                  }
                }}
              >
                <CowAvatar
                  photoUrl={cow.photoUrl}
                  name={cow.name}
                  tagId={cow.tagId}
                  breed={cow.breed}
                  avatarColor={cow.avatarColor || '#17733E'}
                  size="small"
                  rounded="circle"
                />

                <div className="picker-cow-info">
                  <div className="picker-name-row">
                    <span className="picker-name">{cow.name}</span>
                    <span className="picker-tag">{cow.tagId}</span>
                  </div>
                  <div className="picker-subline">
                    <span>{cow.breed}</span>
                    <span>•</span>
                    <span>{cow.lactationStatus || `${cow.milkYieldPerDay || cow.milkToday} L/day`}</span>
                  </div>
                </div>

                <div className="picker-check-cell">
                  {isSelected ? (
                    <div className="picker-selected-icon">
                      <Check size={16} />
                    </div>
                  ) : (
                    <span className={`badge-pill ${cow.status}`}>
                      {cow.status === 'alert' ? 'Alert' : cow.status === 'watch' ? 'Watch' : 'Healthy'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
