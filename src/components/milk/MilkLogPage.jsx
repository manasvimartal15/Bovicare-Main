import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Milk,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  Tractor,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { useCows } from '../../context/CowsContext';
import CowSelectModal from '../common/CowSelectModal';
import CowAvatar from '../common/CowAvatar';

export default function MilkLogPage({ initialCowId, onBack, onSaveSuccess }) {
  const { cows, addMilkLog } = useCows();

  // Find initial cow or default to first cow
  const [selectedCowId, setSelectedCowId] = useState(() => {
    if (initialCowId && cows.some((c) => c.id === initialCowId)) {
      return initialCowId;
    }
    return cows[0]?.id || '';
  });

  const selectedCow = cows.find((c) => c.id === selectedCowId) || cows[0];

  // Cow picker modal state
  const [isCowPickerOpen, setIsCowPickerOpen] = useState(false);

  // Form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);

  // Default morning/evening from selected cow's typical split
  const defaultMorning = selectedCow ? (selectedCow.morningMilk || Math.round((selectedCow.milkYieldPerDay || 14) * 0.55 * 10) / 10).toString() : '8';
  const defaultEvening = selectedCow ? (selectedCow.eveningMilk || Math.round((selectedCow.milkYieldPerDay || 14) * 0.45 * 10) / 10).toString() : '6';

  const [morningMilk, setMorningMilk] = useState(defaultMorning);
  const [eveningMilk, setEveningMilk] = useState(defaultEvening);
  const [notes, setNotes] = useState('');

  // UI state
  const [validationError, setValidationError] = useState('');
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Automatically calculate total daily milk in real-time
  const morningNum = parseFloat(morningMilk) || 0;
  const eveningNum = parseFloat(eveningMilk) || 0;
  const totalDailyMilk = useMemo(() => {
    return Math.round((morningNum + eveningNum) * 10) / 10;
  }, [morningNum, eveningNum]);

  // Baseline comparison
  const baselineYield = selectedCow?.milkYieldPerDay || 14;
  const difference = Math.round((totalDailyMilk - baselineYield) * 10) / 10;

  // Handle save
  const handleSave = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedCow) {
      setValidationError('Please select a registered cow first.');
      return;
    }

    if (morningNum < 0 || eveningNum < 0) {
      setValidationError('Milk yields cannot be negative numbers.');
      return;
    }

    if (morningNum === 0 && eveningNum === 0) {
      setValidationError('Please enter at least one milking quantity (Morning or Evening).');
      return;
    }

    if (totalDailyMilk > 70) {
      setValidationError('Daily milk volume exceeds maximum bovine limit (70 L). Please check your inputs.');
      return;
    }

    if (!date) {
      setValidationError('Recording date is required.');
      return;
    }

    const res = addMilkLog(selectedCow.id, {
      date,
      morningMilk: morningNum,
      eveningMilk: eveningNum,
      notes,
    });

    if (res.success) {
      setFeedbackToast(`Milk log saved: ${totalDailyMilk} L recorded for ${selectedCow.name} on ${date}.`);
      setNotes('');
      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess();
        }, 1200);
      } else {
        setTimeout(() => setFeedbackToast(null), 4000);
      }
    } else {
      setValidationError(res.error || 'Failed to save milk log.');
    }
  };

  return (
    <div className="quick-action-page-wrapper">
      {/* Top Header */}
      <header className="page-nav-header">
        <div className="nav-header-inner">
          <div className="nav-left">
            <button
              type="button"
              className="nav-back-btn"
              onClick={onBack}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="nav-titles">
              <h1 className="nav-page-title">Milk Production Log</h1>
              <p className="nav-page-subtitle">Daily session yields & cow contributions</p>
            </div>
          </div>
          <span className="badge-pill healthy">Yield Tracker</span>
        </div>
      </header>

      <main className="quick-action-container">
        {/* Prototype Disclaimer Banner */}
        <div className="prototype-disclaimer-card" role="note">
          <Info size={16} className="disclaimer-icon" />
          <div>
            <strong>Local Prototype Storage:</strong> Milk log entries are stored in browser session storage for testing. External cloud databases are not connected. Yield benchmarks reflect registered herd data.
          </div>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="floating-feedback-toast" role="status">
            <CheckCircle2 size={16} />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* 1. Selected Cow Card */}
        {selectedCow ? (
          <section className="selected-cow-summary-card" aria-label="Selected Cow">
            <div className="quick-cow-left">
              <CowAvatar
                photoUrl={selectedCow.photoUrl}
                name={selectedCow.name}
                tagId={selectedCow.tagId}
                breed={selectedCow.breed}
                avatarColor={selectedCow.avatarColor || '#17733E'}
                size="medium"
                rounded="circle"
              />
              <div className="quick-cow-details">
                <div className="quick-cow-title-row">
                  <span className="quick-cow-name">{selectedCow.name}</span>
                  <span className="quick-cow-tag">{selectedCow.tagId}</span>
                  <span className="badge-pill healthy">
                    {selectedCow.lactationStatus || 'In Milk'}
                  </span>
                </div>
                <span className="quick-cow-sub">
                  {selectedCow.breed} • Baseline Yield: <strong>{selectedCow.milkYieldPerDay || selectedCow.milkToday} L/day</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-change-cow-pill"
              onClick={() => setIsCowPickerOpen(true)}
            >
              Change Cow
            </button>
          </section>
        ) : (
          <button
            type="button"
            className="btn-select-cow-empty"
            onClick={() => setIsCowPickerOpen(true)}
          >
            Choose a cow from registered herd
          </button>
        )}

        {/* 2. Milk Log Form Card */}
        <section className="quick-form-card" aria-label="Milk Log Entry Form">
          <div className="form-card-header">
            <h2 className="form-card-title">Record Daily Milking Session</h2>
            <span className="form-card-badge">Session Entry</span>
          </div>

          {validationError && (
            <div className="validation-error-banner" role="alert">
              <AlertTriangle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            {/* Date Input */}
            <div className="quick-field-group">
              <label className="quick-label" htmlFor="logDate">
                <span>Date of Recording *</span>
              </label>
              <input
                id="logDate"
                type="date"
                className="quick-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Morning and Evening Milk Quantity Inputs */}
            <div className="quick-field-group horizontal-two-col" style={{ marginTop: 12 }}>
              <div className="quick-field-group">
                <label className="quick-label" htmlFor="morningMilk">
                  <span>Morning Milking (Litres)</span>
                  <span className="text-muted">06:00 AM session</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="morningMilk"
                    type="number"
                    step="0.1"
                    min="0"
                    max="45"
                    className="quick-input"
                    value={morningMilk}
                    onChange={(e) => {
                      setMorningMilk(e.target.value);
                      setValidationError('');
                    }}
                    placeholder="0.0"
                    required
                  />
                  <span className="temp-unit-adornment">L</span>
                </div>
              </div>

              <div className="quick-field-group">
                <label className="quick-label" htmlFor="eveningMilk">
                  <span>Evening Milking (Litres)</span>
                  <span className="text-muted">05:30 PM session</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="eveningMilk"
                    type="number"
                    step="0.1"
                    min="0"
                    max="45"
                    className="quick-input"
                    value={eveningMilk}
                    onChange={(e) => {
                      setEveningMilk(e.target.value);
                      setValidationError('');
                    }}
                    placeholder="0.0"
                    required
                  />
                  <span className="temp-unit-adornment">L</span>
                </div>
              </div>
            </div>

            {/* Automatically Calculated Total Daily Milk Banner */}
            <div className="milk-calculated-total-card" style={{ marginTop: 16 }}>
              <div className="calc-left">
                <span className="calc-label">Calculated Daily Total</span>
                <span className="calc-formula">
                  {morningNum} L (Morning) + {eveningNum} L (Evening)
                </span>
                <span style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                  {difference > 0
                    ? `+${difference} L above baseline average`
                    : difference < 0
                    ? `${difference} L below baseline average`
                    : 'Exact match with baseline average'}
                </span>
              </div>

              <div className="calc-right">
                <span className="calc-total-num">{totalDailyMilk}</span>
                <span className="calc-total-unit">Litres Total</span>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="quick-field-group" style={{ marginTop: 14 }}>
              <label className="quick-label" htmlFor="milkNotes">
                <span>Notes & Observations (Optional)</span>
              </label>
              <textarea
                id="milkNotes"
                className="quick-textarea"
                placeholder="e.g. Somatic cell test clean, high butterfat content, feed supplement consumed..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="form-actions-row">
              <button
                type="button"
                className="btn-form-cancel"
                onClick={onBack}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-form-save"
              >
                <Milk size={16} />
                <span>Save Milk Log</span>
              </button>
            </div>
          </form>
        </section>

        {/* 3. Milk Production History Section */}
        <section className="history-section-card" aria-label="Milk Production History">
          <div className="history-card-header">
            <div className="history-title-wrap">
              <Milk size={18} className="text-primary" />
              <h3 className="history-title">Milk Production History</h3>
              <span className="history-counter-badge">
                {selectedCow?.milkLogs?.length || 0} Entries
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {selectedCow?.name} ({selectedCow?.tagId})
            </span>
          </div>

          <div className="history-items-stack">
            {selectedCow?.milkLogs && selectedCow.milkLogs.length > 0 ? (
              selectedCow.milkLogs.map((log) => (
                <div key={log.id} className="history-item-row">
                  <div className="history-row-top">
                    <div className="history-date-cell">
                      <Calendar size={13} />
                      <span>{log.date}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge-pill healthy">
                        Total {log.totalMilk} L
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    <span>Morning: <strong>{log.morningMilk} L</strong></span>
                    <span>•</span>
                    <span>Evening: <strong>{log.eveningMilk} L</strong></span>
                  </div>

                  {log.notes && (
                    <p className="history-notes-text">"{log.notes}"</p>
                  )}
                </div>
              ))
            ) : (
              <div className="history-empty-box">
                <div className="empty-icon-wrap">
                  <Milk size={22} />
                </div>
                <p>No milk production entries recorded yet for this cow.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Cow Picker Modal */}
      <CowSelectModal
        isOpen={isCowPickerOpen}
        onClose={() => setIsCowPickerOpen(false)}
        selectedCowId={selectedCowId}
        onSelectCow={(cow) => setSelectedCowId(cow.id)}
        title="Select Cow for Milk Log"
        badge="Milk Production"
      />
    </div>
  );
}
