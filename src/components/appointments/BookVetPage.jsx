import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building2,
  Tractor,
  Stethoscope,
  ChevronRight,
  MapPin,
  Check,
  FileText,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCows } from '../../context/CowsContext';
import CowSelectModal from '../common/CowSelectModal';
import VetAvatar from '../common/VetAvatar';
import CowAvatar from '../common/CowAvatar';
import {
  getApprovedVeterinarians,
  getAvailableSlotsForVet,
  createAppointment,
  VISIT_TYPES,
  DEFAULT_TIME_SLOTS,
} from '../../services/appointmentService';

const COMMON_SYMPTOM_TAGS = [
  'Mastitis / Udder swelling',
  'High fever / Inappetence',
  'Drop in milk yield',
  'Lameness / Gait stiffness',
  'Routine herd wellness check',
  'Vaccination & deworming',
  'Post-calving clinical review',
];

export default function BookVetPage({ onBack, onViewAppointments, preselectedCowId = null }) {
  const { currentUser } = useAuth();
  const { cows } = useCows();

  // Active step: 1 = Select Vet, 2 = Details, 3 = Confirmation / Summary
  const [step, setStep] = useState(1);

  // Selected Vet
  const approvedVets = useMemo(() => getApprovedVeterinarians(), []);
  const [selectedVet, setSelectedVet] = useState(() => approvedVets[0] || null);

  // Selected Cow
  const [selectedCowId, setSelectedCowId] = useState(() => {
    if (preselectedCowId && cows.some((c) => c.id === preselectedCowId)) {
      return preselectedCowId;
    }
    const alertCow = cows.find((c) => c.status === 'alert');
    return alertCow ? alertCow.id : cows[0]?.id || '';
  });
  const [isCowPickerOpen, setIsCowPickerOpen] = useState(false);
  const selectedCow = cows.find((c) => c.id === selectedCowId) || cows[0];

  // Form Fields
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState('');
  const [visitType, setVisitType] = useState(VISIT_TYPES.FARM_VISIT);
  const [symptoms, setSymptoms] = useState('');
  const [selectedSymptomTags, setSelectedSymptomTags] = useState([]);

  // States
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available slots when vet or date changes
  useEffect(() => {
    if (selectedVet && date) {
      setIsLoadingSlots(true);
      const slotsWithStatus = getAvailableSlotsForVet(selectedVet.email, date);
      setAvailableSlots(slotsWithStatus);
      // If current selected slot is not available or empty, pick first available
      const firstAvailable = slotsWithStatus.find((s) => s.isAvailable);
      if (firstAvailable && (!timeSlot || !slotsWithStatus.some((s) => s.slot === timeSlot && s.isAvailable))) {
        setTimeSlot(firstAvailable.slot);
      }
      setIsLoadingSlots(false);
    }
  }, [selectedVet, date]);

  // Toggle quick symptom tag
  const handleToggleSymptomTag = (tag) => {
    if (selectedSymptomTags.includes(tag)) {
      const nextTags = selectedSymptomTags.filter((t) => t !== tag);
      setSelectedSymptomTags(nextTags);
      setSymptoms(nextTags.join(', '));
    } else {
      const nextTags = [...selectedSymptomTags, tag];
      setSelectedSymptomTags(nextTags);
      setSymptoms(nextTags.join(', '));
    }
  };

  // Step 2 Validation
  const handleProceedToSummary = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedVet) {
      setValidationError('Please select an approved veterinarian.');
      setStep(1);
      return;
    }

    if (!selectedCow) {
      setValidationError('Please select a cow from your registered herd.');
      return;
    }

    if (!date) {
      setValidationError('Please choose an appointment date.');
      return;
    }

    if (!timeSlot) {
      setValidationError('Please choose an available consultation time slot.');
      return;
    }

    // Advance to Step 3 Summary
    setStep(3);
  };

  // Final Confirmation & Submission
  const handleConfirmBooking = () => {
    setIsSubmitting(true);
    setValidationError('');

    // Ensure farmer user object
    const farmerUser = {
      id: currentUser?.id || 'farmer-01',
      role: currentUser?.role || 'farmer',
      fullName: currentUser?.fullName || 'Ramesh Patil',
      email: currentUser?.email || 'farmer@bovicare.com',
      phone: currentUser?.phone || '+91 98765 43210',
      farmName: currentUser?.farmName || 'Patil Dairy Farm',
      location: currentUser?.location || 'Nashik, Maharashtra',
    };

    const result = createAppointment({
      farmerUser,
      vet: selectedVet,
      cow: selectedCow,
      date,
      timeSlot,
      visitType,
      symptoms,
    });

    setIsSubmitting(false);

    if (result.success) {
      setBookingSuccessData(result.appointment);
    } else {
      setValidationError(result.error || 'Failed to schedule appointment.');
      // If error is about slot conflict, take user back to step 2 to choose a slot
      setStep(2);
    }
  };

  // -------------------------------------------------------------
  // SUCCESS SCREEN
  // -------------------------------------------------------------
  if (bookingSuccessData) {
    return (
      <div className="appointment-page-wrapper">
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
                <h1 className="nav-page-title">Appointment Scheduled</h1>
                <p className="nav-page-subtitle">Veterinary consultation requested successfully</p>
              </div>
            </div>
            <span className="badge-pill healthy">Status: Pending Confirmation</span>
          </div>
        </header>

        <main className="appointment-container">
          <div className="booking-form-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--color-success-bg)',
                color: 'var(--color-success-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0.5rem auto 1rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ margin: '0 0 0.5rem', color: 'var(--color-text-primary)' }}>
              Consultation Request Submitted!
            </h2>
            <p style={{ margin: '0 0 1.5rem', maxWidth: '480px', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Your appointment request with <strong>{bookingSuccessData.vetName}</strong> has been registered. The veterinarian will review and confirm your visit.
            </p>

            {/* Summary Ticket */}
            <div className="booking-summary-box" style={{ width: '100%', maxWidth: '520px', textAlign: 'left', margin: '0 auto 1.5rem' }}>
              <div className="summary-row">
                <span className="summary-label">Appointment ID:</span>
                <span className="summary-val" style={{ fontFamily: 'monospace' }}>
                  {bookingSuccessData.id}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Veterinarian:</span>
                <span className="summary-val">{bookingSuccessData.vetName}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Cow:</span>
                <span className="summary-val">{bookingSuccessData.cowName} ({bookingSuccessData.cowTag})</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Date & Time:</span>
                <span className="summary-val">
                  {new Date(bookingSuccessData.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at {bookingSuccessData.timeSlot}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Visit Type:</span>
                <span className="summary-val">{bookingSuccessData.visitType}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Status:</span>
                <span className="badge-pill watch">Pending Vet Confirmation</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={onViewAppointments}
              >
                <Calendar size={16} />
                <span>View in My Appointments</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onBack}
              >
                <span>Return to Farmer Dashboard</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN BOOKING WORKFLOW
  // -------------------------------------------------------------
  return (
    <div className="appointment-page-wrapper">
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
              <h1 className="nav-page-title">Book a Veterinarian</h1>
              <p className="nav-page-subtitle">Schedule clinical consultations with KYC-approved doctors</p>
            </div>
          </div>
          <span className="badge-pill healthy">Licensed Clinical Network</span>
        </div>
      </header>

      <main className="appointment-container">
        {/* Step Indicator Bar */}
        <div className="booking-steps-bar" role="navigation" aria-label="Booking Progress">
          <div className={`booking-step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <span className="step-num-badge">{step > 1 ? <Check size={14} /> : '1'}</span>
            <span className="step-title">Select Veterinarian</span>
          </div>

          <div className="step-divider-line" />

          <div className={`booking-step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <span className="step-num-badge">{step > 2 ? <Check size={14} /> : '2'}</span>
            <span className="step-title">Appointment Details</span>
          </div>

          <div className="step-divider-line" />

          <div className={`booking-step-item ${step === 3 ? 'active' : ''}`}>
            <span className="step-num-badge">3</span>
            <span className="step-title">Review & Confirm</span>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="rejection-reason-alert" role="alert">
            <AlertTriangle size={18} />
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1: SELECT APPROVED VETERINARIAN */}
        {step === 1 && (
          <section className="dashboard-section" aria-label="Veterinarians Directory">
            <div className="section-header-row">
              <div>
                <h3 className="section-title">Approved Clinical Veterinarians</h3>
                <p className="section-subtitle">
                  Showing licensed bovine specialists verified by state veterinary councils
                </p>
              </div>
              <span className="badge-pill healthy">
                {approvedVets.length} Approved Vet{approvedVets.length === 1 ? '' : 's'}
              </span>
            </div>

            {approvedVets.length === 0 ? (
              <div className="appointments-empty-state">
                <div className="empty-state-illustration-box">
                  <img
                    src="/images/illustrations/empty_appointments.jpg"
                    alt="No approved veterinarians currently available"
                    className="empty-state-illustration-img"
                    loading="lazy"
                  />
                </div>
                <h3>No Approved Veterinarians Available</h3>
                <p>
                  All registered veterinarians are currently undergoing KYC verification by the platform administrator. Please check back shortly.
                </p>
              </div>
            ) : (
              <div className="vets-selection-grid">
                {approvedVets.map((vet) => {
                  const isSelected = selectedVet?.id === vet.id;
                  return (
                    <div
                      key={vet.id}
                      className={`vet-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="vet-card-header">
                        <div className="vet-header-left">
                          <VetAvatar
                            fullName={vet.fullName}
                            photoUrl={vet.photoUrl || null}
                            size="medium"
                            isApproved={vet.kycStatus === 'approved' || true}
                          />
                          <div className="vet-name-block">
                            <span className="vet-doctor-name">
                              {vet.fullName}
                              <span className="badge-pill healthy" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <ShieldCheck size={12} /> KYC Approved
                              </span>
                            </span>
                            <span className="vet-qual-text">{vet.qualification}</span>
                            <span className="vet-clinic-text">
                              <Building2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                              {vet.clinicName} • {vet.state}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={isSelected ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                          onClick={() => {
                            setSelectedVet(vet);
                            setStep(2);
                          }}
                        >
                          {isSelected ? 'Continue' : 'Select Doctor'}
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      <div className="vet-meta-badges">
                        <span className="vet-meta-pill">
                          <strong>License:</strong> {vet.licenseNumber}
                        </span>
                        <span className="vet-meta-pill">
                          <strong>Council:</strong> {vet.issuingAuthority}
                        </span>
                        <span className="vet-meta-pill">
                          <strong>Experience:</strong> {vet.experienceYears}
                        </span>
                        <span className="vet-meta-pill">
                          <strong>Rating:</strong> {vet.rating}
                        </span>
                      </div>

                      <div className="vet-card-footer">
                        <div className="vet-avail-note">
                          <CheckCircle2 size={14} />
                          <span>Accepting Farm Visits & Clinic Visits</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Available Mon - Sat • Regular Clinical Hours
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* STEP 2: APPOINTMENT DETAILS FORM */}
        {step === 2 && selectedVet && (
          <form className="booking-form-card" onSubmit={handleProceedToSummary}>
            {/* Selected Vet Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.875rem 1rem',
                background: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Stethoscope size={20} className="text-primary" />
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'block' }}>
                    Consulting Veterinarian:
                  </span>
                  <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                    {selectedVet.fullName}
                  </strong>{' '}
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    ({selectedVet.clinicName})
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-change-cow-pill"
                onClick={() => setStep(1)}
              >
                Change Doctor
              </button>
            </div>

            {/* 1. Cow Selection */}
            <div>
              <div className="form-group-title">
                <Tractor size={18} />
                <span>1. Select Cow from Herd</span>
              </div>

              {selectedCow ? (
                <div
                  className="selected-cow-summary-card"
                  style={{ marginTop: '0.5rem' }}
                >
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
                          {selectedCow.status === 'alert'
                            ? 'Needs Attention'
                            : selectedCow.status === 'watch'
                            ? 'Observation'
                            : 'Healthy'}
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
                </div>
              ) : (
                <div className="rejection-reason-alert">
                  <AlertTriangle size={16} />
                  <span>No cows registered in your herd. Please add a cow to proceed.</span>
                </div>
              )}
            </div>

            {/* 2. Visit Type Selection */}
            <div>
              <div className="form-group-title">
                <Building2 size={18} />
                <span>2. Select Consultation Mode</span>
              </div>

              <div className="visit-types-grid">
                <div
                  className={`visit-type-option ${visitType === VISIT_TYPES.FARM_VISIT ? 'selected' : ''}`}
                  onClick={() => setVisitType(VISIT_TYPES.FARM_VISIT)}
                >
                  <div className="visit-icon-circle">
                    <Tractor size={20} />
                  </div>
                  <div className="visit-info">
                    <h4>Farm Visit (On-Site)</h4>
                    <p>The veterinarian visits your dairy farm directly to examine and treat the animal on-site.</p>
                  </div>
                </div>

                <div
                  className={`visit-type-option ${visitType === VISIT_TYPES.CLINIC_VISIT ? 'selected' : ''}`}
                  onClick={() => setVisitType(VISIT_TYPES.CLINIC_VISIT)}
                >
                  <div className="visit-icon-circle">
                    <Building2 size={20} />
                  </div>
                  <div className="visit-info">
                    <h4>Clinic Visit</h4>
                    <p>Bring the cow or biological samples to the doctor's registered clinic center.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Date & Time Slot Picker */}
            <div>
              <div className="form-group-title">
                <Calendar size={18} />
                <span>3. Choose Date & Consultation Time</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Appointment Date (Must be today or future)
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--color-border-subtle)',
                      background: 'var(--color-bg-card)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Available Time Slots for {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </label>

                {isLoadingSlots ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Loading available slots...
                  </div>
                ) : (
                  <div className="time-slots-container">
                    {availableSlots.map(({ slot, isAvailable }) => {
                      const isSelected = timeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={!isAvailable}
                          className={`slot-btn ${isSelected ? 'selected' : ''} ${!isAvailable ? 'booked' : ''}`}
                          onClick={() => setTimeSlot(slot)}
                          title={!isAvailable ? 'This slot has already been reserved' : 'Select this consultation time'}
                        >
                          <Clock size={14} />
                          <span>{slot}</span>
                          <span className="slot-sub-status">
                            {isAvailable ? (isSelected ? 'Selected' : 'Available') : 'Booked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Symptoms / Clinical Reason */}
            <div>
              <div className="form-group-title">
                <FileText size={18} />
                <span>4. Symptoms & Reason for Visit</span>
              </div>

              <div className="quick-symptoms-chips">
                {COMMON_SYMPTOM_TAGS.map((tag) => {
                  const isActive = selectedSymptomTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`symptom-chip ${isActive ? 'active' : ''}`}
                      onClick={() => handleToggleSymptomTag(tag)}
                    >
                      {isActive && <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                      {tag}
                    </button>
                  );
                })}
              </div>

              <textarea
                rows={3}
                className="form-control"
                placeholder="Describe current symptoms, duration, temperature, or specific clinical assistance needed..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border-subtle)',
                  background: 'var(--color-bg-card)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Form Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(1)}
              >
                Back to Veterinarians
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={!timeSlot || !selectedCow}
              >
                <span>Review Booking Summary</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: REVIEW & CONFIRMATION */}
        {step === 3 && (
          <div className="booking-form-card">
            <div className="section-header-row" style={{ marginBottom: '0.5rem' }}>
              <div>
                <h3 className="section-title">Review & Confirm Appointment</h3>
                <p className="section-subtitle">
                  Verify the consultation details before sending your booking request
                </p>
              </div>
              <span className="badge-pill healthy">Ready to Schedule</span>
            </div>

            <div className="booking-summary-box">
              <div className="summary-row">
                <span className="summary-label">Consulting Veterinarian:</span>
                <span className="summary-val">
                  <strong>{selectedVet?.fullName}</strong> ({selectedVet?.qualification})
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">License & Council:</span>
                <span className="summary-val">
                  {selectedVet?.licenseNumber} • {selectedVet?.issuingAuthority}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Animal / Cow:</span>
                <span className="summary-val">
                  <strong>{selectedCow?.name}</strong> (Tag: {selectedCow?.tagId}, {selectedCow?.breed})
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Scheduled Date:</span>
                <span className="summary-val">
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Time Slot:</span>
                <span className="summary-val">
                  <strong>{timeSlot}</strong>
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Visit Type:</span>
                <span className="summary-val">{visitType}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Farm / Contact:</span>
                <span className="summary-val">
                  {currentUser?.farmName || 'Patil Dairy Farm'} ({currentUser?.phone || '+91 98765 43210'})
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Clinical Reason:</span>
                <span className="summary-val" style={{ maxWidth: '340px' }}>
                  {symptoms || 'General clinical review'}
                </span>
              </div>
            </div>

            <div className="prototype-disclaimer-card" role="note">
              <Info size={16} className="disclaimer-icon" />
              <div>
                <strong>Booking Policy:</strong> Submitting will reserve the {timeSlot} slot on {date}. Your request will be queued in the veterinarian's dashboard for acceptance. You can cancel any time prior to completion from "My Appointments".
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
              >
                Modify Details
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Checking Availability & Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm & Book Appointment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Cow Picker Modal */}
      <CowSelectModal
        isOpen={isCowPickerOpen}
        onClose={() => setIsCowPickerOpen(false)}
        selectedCowId={selectedCowId}
        onSelectCow={(id) => {
          setSelectedCowId(id);
          setIsCowPickerOpen(false);
        }}
        title="Select Cow for Veterinary Visit"
        badge="Appointment Target"
      />
    </div>
  );
}
