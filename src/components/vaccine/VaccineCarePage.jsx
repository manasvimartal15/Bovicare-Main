import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Syringe,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Tractor,
  User,
  ShieldCheck
} from 'lucide-react';
import { useCows } from '../../context/CowsContext';
import CowSelectModal from '../common/CowSelectModal';
import CowAvatar from '../common/CowAvatar';

const COMMON_VACCINES = [
  'Foot and Mouth Disease (FMD) Vaccine',
  'Hemorrhagic Septicemia (HS) Vaccine',
  'Black Quarter (BQ) Vaccine',
  'Brucellosis (Strain 19)',
  'Anthrax Spore Vaccine',
  'Theileriosis Vaccine',
  'Deworming (Albendazole / Ivermectin)',
  'Mastitis Teat Sealant & Dry Cow Therapy',
  'Calcium / Mineral Infusion',
  'Custom / Other Treatment...',
];

export default function VaccineCarePage({ initialCowId, onBack, onSaveSuccess }) {
  const { cows, addVaccinationRecord } = useCows();

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
  const [selectedVaccineType, setSelectedVaccineType] = useState(COMMON_VACCINES[0]);
  const [customVaccineName, setCustomVaccineName] = useState('');
  const [dateAdministered, setDateAdministered] = useState(todayStr);
  const [nextDueDate, setNextDueDate] = useState('');
  const [administrator, setAdministrator] = useState('');
  const [notes, setNotes] = useState('');

  // UI feedback state
  const [validationError, setValidationError] = useState('');
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Helper to add interval to date
  const setQuickInterval = (months) => {
    const base = dateAdministered ? new Date(dateAdministered) : new Date();
    base.setMonth(base.getMonth() + months);
    setNextDueDate(base.toISOString().split('T')[0]);
    setValidationError('');
  };

  // Helper to determine vaccination status badge
  const getVaccinationStatusBadge = (vac) => {
    if (!vac.nextDueDate) {
      return {
        type: 'completed',
        label: 'Completed',
        icon: <ShieldCheck size={12} />,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(vac.nextDueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        type: 'overdue',
        label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`,
        icon: <AlertTriangle size={12} />,
      };
    }

    if (diffDays === 0) {
      return {
        type: 'soon',
        label: 'Due Today',
        icon: <Clock size={12} />,
      };
    }

    if (diffDays <= 14) {
      return {
        type: 'soon',
        label: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
        icon: <Clock size={12} />,
      };
    }

    return {
      type: 'scheduled',
      label: `Scheduled for ${vac.nextDueDate}`,
      icon: <Calendar size={12} />,
    };
  };

  // Handle save
  const handleSave = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedCow) {
      setValidationError('Please select a registered cow first.');
      return;
    }

    const finalVaccineName = selectedVaccineType === 'Custom / Other Treatment...'
      ? customVaccineName.trim()
      : selectedVaccineType;

    if (!finalVaccineName) {
      setValidationError('Please select or specify a vaccine or treatment name.');
      return;
    }

    if (!dateAdministered) {
      setValidationError('Administration date is required.');
      return;
    }

    if (nextDueDate && nextDueDate < dateAdministered) {
      setValidationError('Next due date cannot be earlier than the date administered.');
      return;
    }

    const res = addVaccinationRecord(selectedCow.id, {
      vaccineName: finalVaccineName,
      dateAdministered,
      nextDueDate,
      administrator: administrator.trim() || 'Farm Staff',
      notes,
    });

    if (res.success) {
      setFeedbackToast(`Vaccine recorded: "${finalVaccineName}" for ${selectedCow.name}.`);
      setCustomVaccineName('');
      setNotes('');
      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess();
        }, 1200);
      } else {
        setTimeout(() => setFeedbackToast(null), 4000);
      }
    } else {
      setValidationError(res.error || 'Failed to save vaccination record.');
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
              <h1 className="nav-page-title">Vaccination & Care</h1>
              <p className="nav-page-subtitle">Immunization schedules & medical administration</p>
            </div>
          </div>
          <span className="badge-pill healthy">Care Schedule</span>
        </div>
      </header>

      <main className="quick-action-container">
        {/* Prototype Disclaimer Banner */}
        <div className="prototype-disclaimer-card" role="note">
          <Info size={16} className="disclaimer-icon" />
          <div>
            <strong>Local Prototype Storage:</strong> Vaccination records are saved locally in browser session storage for testing. Electronic health record (EHR) databases are not connected.
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
                    {selectedCow.vaccinations?.length || 0} Immunizations
                  </span>
                </div>
                <span className="quick-cow-sub">
                  {selectedCow.breed} • Registered: <strong>{selectedCow.dateOfRegistration || '2024'}</strong>
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

        {/* 2. Vaccine Form Card */}
        <section className="quick-form-card" aria-label="Vaccination Entry Form">
          <div className="form-card-header">
            <h2 className="form-card-title">Log Vaccine or Clinical Treatment</h2>
            <span className="form-card-badge">Immunization Record</span>
          </div>

          {validationError && (
            <div className="validation-error-banner" role="alert">
              <AlertTriangle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            {/* Vaccine or Treatment Selection */}
            <div className="quick-field-group">
              <label className="quick-label" htmlFor="vaccineSelect">
                <span>Vaccine or Treatment Name *</span>
              </label>
              <select
                id="vaccineSelect"
                className="quick-select"
                value={selectedVaccineType}
                onChange={(e) => {
                  setSelectedVaccineType(e.target.value);
                  setValidationError('');
                }}
              >
                {COMMON_VACCINES.map((vac) => (
                  <option key={vac} value={vac}>
                    {vac}
                  </option>
                ))}
              </select>

              {selectedVaccineType === 'Custom / Other Treatment...' && (
                <input
                  type="text"
                  className="quick-input"
                  style={{ marginTop: 8 }}
                  placeholder="Enter custom treatment or medicine name..."
                  value={customVaccineName}
                  onChange={(e) => setCustomVaccineName(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Date Administered & Next Due Date */}
            <div className="quick-field-group horizontal-two-col" style={{ marginTop: 12 }}>
              <div className="quick-field-group">
                <label className="quick-label" htmlFor="vacDate">
                  <span>Date Administered *</span>
                </label>
                <input
                  id="vacDate"
                  type="date"
                  className="quick-input"
                  value={dateAdministered}
                  onChange={(e) => setDateAdministered(e.target.value)}
                  required
                />
              </div>

              <div className="quick-field-group">
                <label className="quick-label" htmlFor="nextDueDate">
                  <span>Next Due Date (Optional)</span>
                </label>
                <input
                  id="nextDueDate"
                  type="date"
                  className="quick-input"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                />

                {/* Quick Interval Presets */}
                <div className="interval-chips-row">
                  <button
                    type="button"
                    className="interval-chip"
                    onClick={() => setQuickInterval(3)}
                  >
                    +3 Months
                  </button>
                  <button
                    type="button"
                    className="interval-chip"
                    onClick={() => setQuickInterval(6)}
                  >
                    +6 Months
                  </button>
                  <button
                    type="button"
                    className="interval-chip"
                    onClick={() => setQuickInterval(12)}
                  >
                    +1 Year
                  </button>
                </div>
              </div>
            </div>

            {/* Administrator / Veterinarian Name */}
            <div className="quick-field-group" style={{ marginTop: 14 }}>
              <label className="quick-label" htmlFor="adminName">
                <span>Veterinarian or Administrator (Optional)</span>
                <span className="text-muted">e.g. Dr. Rajesh Sharma, Farm Staff</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="adminName"
                  type="text"
                  className="quick-input"
                  placeholder="e.g. Dr. Rajesh Sharma (Clinical Visit)"
                  value={administrator}
                  onChange={(e) => setAdministrator(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="quick-field-group" style={{ marginTop: 14 }}>
              <label className="quick-label" htmlFor="vacNotes">
                <span>Clinical Notes & Batch Details (Optional)</span>
              </label>
              <textarea
                id="vacNotes"
                className="quick-textarea"
                placeholder="e.g. Batch #FMD-2024-B, subcutaneous injection left neck, no adverse reactions observed..."
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
                <Syringe size={16} />
                <span>Save Vaccination Record</span>
              </button>
            </div>
          </form>
        </section>

        {/* 3. Vaccination Records & Upcoming Schedule Section */}
        <section className="history-section-card" aria-label="Vaccination Schedule">
          <div className="history-card-header">
            <div className="history-title-wrap">
              <Syringe size={18} className="text-primary" />
              <h3 className="history-title">Vaccination & Care History</h3>
              <span className="history-counter-badge">
                {selectedCow?.vaccinations?.length || 0} Records
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {selectedCow?.name} ({selectedCow?.tagId})
            </span>
          </div>

          <div className="history-items-stack">
            {selectedCow?.vaccinations && selectedCow.vaccinations.length > 0 ? (
              selectedCow.vaccinations.map((vac) => {
                const statusBadge = getVaccinationStatusBadge(vac);

                return (
                  <div key={vac.id} className="history-item-row">
                    <div className="history-row-top">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 14, color: 'var(--color-text-primary)' }}>
                          {vac.title}
                        </span>
                        <div className="history-date-cell">
                          <Calendar size={13} />
                          <span>Administered: {vac.date}</span>
                          {vac.administrator && (
                            <>
                              <span>•</span>
                              <span>By: {vac.administrator}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className={`vaccine-due-badge ${statusBadge.type}`}>
                        {statusBadge.icon}
                        <span>{statusBadge.label}</span>
                      </div>
                    </div>

                    {vac.notes && (
                      <p className="history-notes-text">"{vac.notes}"</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="history-empty-box">
                <div className="empty-icon-wrap">
                  <Syringe size={22} />
                </div>
                <p>No vaccination or clinical treatments recorded yet for this cow.</p>
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
        title="Select Cow for Vaccination"
        badge="Vaccine & Care"
      />
    </div>
  );
}
