import React, { useState } from 'react';
import { Clock, Calendar, Check, X, Plus, AlertCircle } from 'lucide-react';
import {
  getVetAvailability,
  saveVetAvailability,
  DEFAULT_TIME_SLOTS,
} from '../../services/appointmentService';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function VetAvailabilityModal({ isOpen, onClose, vetEmail, onSaved }) {
  if (!isOpen) return null;

  const currentConfig = getVetAvailability(vetEmail);

  const [workingDays, setWorkingDays] = useState(
    currentConfig.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  );
  const [timeSlots, setTimeSlots] = useState(
    currentConfig.timeSlots || DEFAULT_TIME_SLOTS
  );
  const [customSlot, setCustomSlot] = useState('');
  const [feedback, setFeedback] = useState(null);

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      if (workingDays.length === 1) return; // Must have at least 1 day
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const removeSlot = (slotToRemove) => {
    if (timeSlots.length <= 1) return; // Keep at least 1 slot
    setTimeSlots(timeSlots.filter((s) => s !== slotToRemove));
  };

  const addCustomSlot = (e) => {
    e.preventDefault();
    if (!customSlot.trim()) return;
    const clean = customSlot.trim();
    if (!timeSlots.includes(clean)) {
      setTimeSlots([...timeSlots, clean]);
      setCustomSlot('');
    }
  };

  const handleSave = () => {
    const res = saveVetAvailability(vetEmail, {
      workingDays,
      timeSlots,
    });

    if (res.success) {
      if (onSaved) onSaved();
      onClose();
    } else {
      setFeedback(res.error || 'Failed to save availability.');
    }
  };

  const handleResetDefaults = () => {
    setWorkingDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    setTimeSlots(DEFAULT_TIME_SLOTS);
  };

  return (
    <div className="appointment-modal-overlay" role="dialog" aria-modal="true">
      <div className="appointment-modal-box" style={{ maxWidth: '560px' }}>
        <div className="modal-header-row">
          <div>
            <h3>Configure Clinical Availability</h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Set your consulting days and available time slots for dairy farmers
            </span>
          </div>
          <button type="button" className="modal-btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {feedback && (
          <div className="rejection-reason-alert">
            <AlertCircle size={16} />
            <span>{feedback}</span>
          </div>
        )}

        {/* 1. Working Days */}
        <div>
          <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>
            Active Consulting Days
          </label>
          <div className="days-toggle-grid">
            {ALL_DAYS.map((day) => {
              const isActive = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  className={`day-toggle-btn ${isActive ? 'active' : ''}`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Consultation Time Slots */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Standard Consultation Time Slots ({timeSlots.length})
            </label>
            <button
              type="button"
              className="section-link-btn"
              onClick={handleResetDefaults}
              style={{ fontSize: '11px' }}
            >
              Reset to Defaults
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {timeSlots.map((slot) => (
              <span
                key={slot}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--color-surface-mint)',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                }}
              >
                <Clock size={12} />
                {slot}
                <button
                  type="button"
                  onClick={() => removeSlot(slot)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Remove slot"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Add custom slot input */}
          <form onSubmit={addCustomSlot} style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="e.g. 07:00 PM"
              value={customSlot}
              onChange={(e) => setCustomSlot(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: 'var(--font-size-xs)',
              }}
            />
            <button
              type="submit"
              className="btn-secondary btn-sm"
              disabled={!customSlot.trim()}
            >
              <Plus size={14} />
              <span>Add Slot</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem' }}>
          <button type="button" className="btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary btn-sm" onClick={handleSave}>
            Save Availability Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
