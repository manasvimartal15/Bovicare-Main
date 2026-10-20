import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Thermometer,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Tractor,
  Activity,
  Plus,
  Minus,
  Check
} from 'lucide-react';
import { useCows } from '../../context/CowsContext';
import CowSelectModal from '../common/CowSelectModal';
import CowAvatar from '../common/CowAvatar';

// Configured normal bovine body temperature reference range (°C)
const BOVINE_TEMP_NORMAL_MIN = 38.0;
const BOVINE_TEMP_NORMAL_MAX = 39.3;

const COMMON_SYMPTOMS = [
  'Normal Behavior / Alert',
  'Loss of Appetite / Low Feed',
  'Drop in Milk Yield',
  'Warm or Swollen Udder',
  'Lethargy / Dullness',
  'Heavy / Rapid Breathing',
  'Shivering / Chills',
  'Nasal / Ocular Discharge',
  'Stiff Gait / Reluctant to Rise',
];

export default function FeverMonitoringPage({ initialCowId, onBack, onSaveSuccess }) {
  const { cows, addFeverLog } = useCows();

  // Find initial cow or default to first cow
  const [selectedCowId, setSelectedCowId] = useState(() => {
    if (initialCowId && cows.some((c) => c.id === initialCowId)) {
      return initialCowId;
    }
    // Prefer alert cow or first cow
    const alertCow = cows.find((c) => c.status === 'alert');
    return alertCow ? alertCow.id : cows[0]?.id || '';
  });

  const selectedCow = cows.find((c) => c.id === selectedCowId) || cows[0];

  // Modal selector state
  const [isCowPickerOpen, setIsCowPickerOpen] = useState(false);

  // Form states
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(timeStr);
  const [temperature, setTemperature] = useState('38.5');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['Normal Behavior / Alert']);
  const [notes, setNotes] = useState('');

  // UI state
  const [validationError, setValidationError] = useState('');
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Parse temp for live evaluation
  const parsedTemp = parseFloat(temperature);

  // Evaluate temperature range
  const tempStatus = useMemo(() => {
    if (isNaN(parsedTemp)) return null;
    if (parsedTemp < BOVINE_TEMP_NORMAL_MIN) {
      return {
        type: 'low',
        badge: 'Low Body Temperature',
        title: `Low Temperature (${parsedTemp.toFixed(1)} °C)`,
        desc: `Temperature is below standard bovine range (${BOVINE_TEMP_NORMAL_MIN}–${BOVINE_TEMP_NORMAL_MAX} °C). Indicates possible hypothermia, metabolic collapse, or shock. Keep animal warm and observe.`,
      };
    }
    if (parsedTemp <= BOVINE_TEMP_NORMAL_MAX) {
      return {
        type: 'normal',
        badge: 'Within Normal Range',
        title: `Normal Baseline (${parsedTemp.toFixed(1)} °C)`,
        desc: `Body temperature is within the standard healthy physiological range (${BOVINE_TEMP_NORMAL_MIN}–${BOVINE_TEMP_NORMAL_MAX} °C) for adult cattle.`,
      };
    }
    if (parsedTemp <= 39.5) {
      return {
        type: 'warm',
        badge: 'Mildly Elevated',
        title: `Mildly Elevated (${parsedTemp.toFixed(1)} °C)`,
        desc: `Temperature is slightly above baseline. Could reflect ambient heat stress, agitation, or early immune activity. Re-check in 2 hours.`,
      };
    }
    return {
      type: 'fever',
      badge: 'High Fever Alert',
      title: `High Temperature Alert (${parsedTemp.toFixed(1)} °C)`,
      desc: `Significantly above normal range (${BOVINE_TEMP_NORMAL_MIN}–${BOVINE_TEMP_NORMAL_MAX} °C). Physiological signs point to systemic inflammation or infection. Note: Temperature alone does NOT diagnose mastitis or any specific condition; veterinary clinical review is recommended.`,
    };
  }, [parsedTemp]);

  // Adjust temperature helper
  const adjustTemp = (delta) => {
    const cur = parseFloat(temperature) || 38.5;
    const next = Math.max(32, Math.min(44, Math.round((cur + delta) * 10) / 10));
    setTemperature(next.toFixed(1));
    setValidationError('');
  };

  // Toggle symptom chip
  const toggleSymptom = (sym) => {
    setSelectedSymptoms((prev) => {
      if (sym === 'Normal Behavior / Alert') {
        return ['Normal Behavior / Alert'];
      }
      const filtered = prev.filter((s) => s !== 'Normal Behavior / Alert');
      if (filtered.includes(sym)) {
        const next = filtered.filter((s) => s !== sym);
        return next.length > 0 ? next : ['Normal Behavior / Alert'];
      } else {
        return [...filtered, sym];
      }
    });
  };

  // Handle save
  const handleSave = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedCow) {
      setValidationError('Please select a cow first.');
      return;
    }

    if (isNaN(parsedTemp) || parsedTemp < 32.0 || parsedTemp > 44.0) {
      setValidationError('Please enter a realistic bovine body temperature between 32.0 °C and 44.0 °C.');
      return;
    }

    if (!date) {
      setValidationError('Measurement date is required.');
      return;
    }

    const res = addFeverLog(selectedCow.id, {
      temperature: parsedTemp.toFixed(1),
      date,
      time,
      symptoms: selectedSymptoms,
      notes,
    });

    if (res.success) {
      setFeedbackToast(`Temperature ${parsedTemp.toFixed(1)} °C recorded for ${selectedCow.name} (Tag ${selectedCow.tagId}).`);
      setNotes('');
      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess();
        }, 1200);
      } else {
        setTimeout(() => setFeedbackToast(null), 4000);
      }
    } else {
      setValidationError(res.error || 'Failed to save temperature measurement.');
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
              <h1 className="nav-page-title">Fever Monitoring</h1>
              <p className="nav-page-subtitle">Temperature tracking & clinical observation</p>
            </div>
          </div>
          <span className="badge-pill healthy">Fever Tracker</span>
        </div>
      </header>

      <main className="quick-action-container">
        {/* Prototype Disclaimer Banner */}
        <div className="prototype-disclaimer-card" role="note">
          <Info size={16} className="disclaimer-icon" />
          <div>
            <strong>Local Prototype Storage:</strong> Temperature records are stored in browser local storage for testing. Cloud database and automated diagnostic systems are not connected. Temperature alone is a physiological metric and does not constitute a disease diagnosis.
          </div>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="floating-feedback-toast" role="status">
            <CheckCircle2 size={16} />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* 1. Selected Cow Header Card */}
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
                  <span className={`badge-pill ${selectedCow.status}`}>
                    {selectedCow.status === 'alert' ? 'Needs Attention' : selectedCow.status === 'watch' ? 'Observation' : 'Healthy'}
                  </span>
                </div>
                <span className="quick-cow-sub">
                  {selectedCow.breed} • Current Temp: <strong>{selectedCow.temperature || '38.5 °C'}</strong>
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

        {/* 2. Temperature Entry Form Card */}
        <section className="quick-form-card" aria-label="Temperature Entry Form">
          <div className="form-card-header">
            <h2 className="form-card-title">Record New Measurement</h2>
            <span className="form-card-badge">Cattle Telemetry</span>
          </div>

          {validationError && (
            <div className="validation-error-banner" role="alert">
              <AlertTriangle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            {/* Body Temperature Input */}
            <div className="quick-field-group">
              <label className="quick-label" htmlFor="tempInput">
                <span>Body Temperature (°C) *</span>
                <span className="text-muted">Normal: {BOVINE_TEMP_NORMAL_MIN} – {BOVINE_TEMP_NORMAL_MAX} °C</span>
              </label>

              <div className="temp-input-wrap">
                <button
                  type="button"
                  className="temp-adjust-btn"
                  onClick={() => adjustTemp(-0.1)}
                  title="Decrease 0.1 °C"
                  aria-label="Decrease temperature"
                >
                  <Minus size={18} />
                </button>

                <div className="temp-input-box">
                  <input
                    id="tempInput"
                    type="number"
                    step="0.1"
                    min="32.0"
                    max="44.0"
                    className="quick-input"
                    value={temperature}
                    onChange={(e) => {
                      setTemperature(e.target.value);
                      setValidationError('');
                    }}
                    required
                  />
                  <span className="temp-unit-adornment">°C</span>
                </div>

                <button
                  type="button"
                  className="temp-adjust-btn"
                  onClick={() => adjustTemp(0.1)}
                  title="Increase 0.1 °C"
                  aria-label="Increase temperature"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="temp-presets-row">
                <button
                  type="button"
                  className={`preset-chip ${temperature === '38.4' ? 'active' : ''}`}
                  onClick={() => setTemperature('38.4')}
                >
                  38.4 °C (Resting)
                </button>
                <button
                  type="button"
                  className={`preset-chip ${temperature === '38.6' ? 'active' : ''}`}
                  onClick={() => setTemperature('38.6')}
                >
                  38.6 °C (Baseline)
                </button>
                <button
                  type="button"
                  className={`preset-chip ${temperature === '39.0' ? 'active' : ''}`}
                  onClick={() => setTemperature('39.0')}
                >
                  39.0 °C (Warm)
                </button>
                <button
                  type="button"
                  className={`preset-chip ${temperature === '39.8' ? 'active' : ''}`}
                  onClick={() => setTemperature('39.8')}
                >
                  39.8 °C (Fever Spike)
                </button>
              </div>
            </div>

            {/* Dynamic Physiological Range Warning Card */}
            {tempStatus && (
              <div className={`temp-range-card ${tempStatus.type}`} style={{ marginTop: 8 }}>
                {tempStatus.type === 'fever' && <AlertTriangle size={18} className="temp-range-icon" />}
                {tempStatus.type === 'warm' && <Activity size={18} className="temp-range-icon" />}
                {tempStatus.type === 'normal' && <CheckCircle2 size={18} className="temp-range-icon" />}
                {tempStatus.type === 'low' && <AlertTriangle size={18} className="temp-range-icon" />}
                <div className="temp-range-body">
                  <span className="temp-range-title">{tempStatus.title}</span>
                  <span className="temp-range-desc">{tempStatus.desc}</span>
                </div>
              </div>
            )}

            {/* Date and Time Row */}
            <div className="quick-field-group horizontal-two-col" style={{ marginTop: 14 }}>
              <div className="quick-field-group">
                <label className="quick-label" htmlFor="feverDate">
                  <span>Date *</span>
                </label>
                <input
                  id="feverDate"
                  type="date"
                  className="quick-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="quick-field-group">
                <label className="quick-label" htmlFor="feverTime">
                  <span>Time *</span>
                </label>
                <input
                  id="feverTime"
                  type="time"
                  className="quick-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Symptoms Selector */}
            <div className="quick-field-group" style={{ marginTop: 14 }}>
              <label className="quick-label">
                <span>Symptoms & Observations</span>
                <span className="text-muted">Select all observed signs</span>
              </label>

              <div className="symptoms-selector-grid">
                {COMMON_SYMPTOMS.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      className={`symptom-toggle-chip ${isChecked ? 'active' : ''}`}
                      onClick={() => toggleSymptom(sym)}
                    >
                      {isChecked && <Check size={13} />}
                      <span>{sym}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observation Notes */}
            <div className="quick-field-group" style={{ marginTop: 14 }}>
              <label className="quick-label" htmlFor="feverNotes">
                <span>Observation Notes (Optional)</span>
              </label>
              <textarea
                id="feverNotes"
                className="quick-textarea"
                placeholder="e.g. Right rear udder quadrant warm, cow isolated in pen, drinking water normally..."
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
                <Thermometer size={16} />
                <span>Save Measurement</span>
              </button>
            </div>
          </form>
        </section>

        {/* 3. Measurement History Section */}
        <section className="history-section-card" aria-label="Temperature History">
          <div className="history-card-header">
            <div className="history-title-wrap">
              <Thermometer size={18} className="text-primary" />
              <h3 className="history-title">Temperature History</h3>
              <span className="history-counter-badge">
                {selectedCow?.feverLogs?.length || 0} Records
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {selectedCow?.name} ({selectedCow?.tagId})
            </span>
          </div>

          <div className="history-items-stack">
            {selectedCow?.feverLogs && selectedCow.feverLogs.length > 0 ? (
              selectedCow.feverLogs.map((log) => {
                const tempVal = parseFloat(log.temperature);
                const isHigh = tempVal > 39.3;
                const isLow = tempVal < 38.0;

                return (
                  <div key={log.id} className="history-item-row">
                    <div className="history-row-top">
                      <div className="history-date-cell">
                        <Calendar size={13} />
                        <span>{log.date}</span>
                        <span>•</span>
                        <Clock size={13} />
                        <span>{log.time}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`badge-pill ${isHigh ? 'alert' : isLow ? 'watch' : 'healthy'}`}>
                          {isHigh ? 'Elevated' : isLow ? 'Low' : 'Normal'}
                        </span>
                        <span className="history-metric-val">{log.temperature} °C</span>
                      </div>
                    </div>

                    {log.symptoms && log.symptoms.length > 0 && (
                      <div className="history-symptoms-list">
                        {log.symptoms.map((s, idx) => (
                          <span key={idx} className="symptom-tag-pill">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {log.notes && (
                      <p className="history-notes-text">"{log.notes}"</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="history-empty-box">
                <div className="empty-icon-wrap">
                  <Thermometer size={22} />
                </div>
                <p>No temperature measurements recorded yet for this cow.</p>
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
        title="Select Cow for Fever Check"
        badge="Fever Monitoring"
      />
    </div>
  );
}
