import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Tractor,
  Phone,
  Mail,
  MapPin,
  Settings,
  Info,
  Check,
  X,
  FileText,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAppointmentsForVet,
  updateAppointmentStatus,
  APPOINTMENT_STATUS,
} from '../../services/appointmentService';
import CowAvatar from '../common/CowAvatar';
import VetAvailabilityModal from './VetAvailabilityModal';

export default function VetAppointmentsSection({ onOpenCowProfile, onAppointmentsUpdated, isKycApproved = true }) {
  const { currentUser } = useAuth();
  const vetEmail = currentUser?.email || 'vet@bovicare.com';

  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'accepted' | 'completed' | 'declined' | 'all'
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Availability Modal
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  // Reject Modal State
  const [rejectingApt, setRejectingApt] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');

  // Complete Modal State
  const [completingApt, setCompletingApt] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Load appointments for this veterinarian
  const refreshAppointments = () => {
    const list = getAppointmentsForVet(vetEmail, currentUser?.id);
    setAppointments(list);
  };

  useEffect(() => {
    refreshAppointments();
  }, [vetEmail]);

  // Tab Filtering
  const filteredAppointments = useMemo(() => {
    if (activeTab === 'all') return appointments;
    if (activeTab === 'pending') {
      return appointments.filter((a) => a.status === APPOINTMENT_STATUS.PENDING);
    }
    if (activeTab === 'accepted') {
      return appointments.filter((a) => a.status === APPOINTMENT_STATUS.ACCEPTED);
    }
    if (activeTab === 'completed') {
      return appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED);
    }
    if (activeTab === 'declined') {
      return appointments.filter((a) =>
        [APPOINTMENT_STATUS.REJECTED, APPOINTMENT_STATUS.CANCELLED].includes(a.status)
      );
    }
    return appointments;
  }, [appointments, activeTab]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      pending: appointments.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length,
      accepted: appointments.filter((a) => a.status === APPOINTMENT_STATUS.ACCEPTED).length,
      completed: appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
      declined: appointments.filter((a) =>
        [APPOINTMENT_STATUS.REJECTED, APPOINTMENT_STATUS.CANCELLED].includes(a.status)
      ).length,
    };
  }, [appointments]);

  // 1. Accept appointment
  const handleAcceptAppointment = (apt) => {
    setActionError(null);
    if (!isKycApproved) {
      setActionError('Action Restricted: Your veterinarian KYC status must be Approved by an Administrator before accepting consultations.');
      setTimeout(() => setActionError(null), 6000);
      return;
    }

    const res = updateAppointmentStatus({
      appointmentId: apt.id,
      vetUser: currentUser,
      newStatus: APPOINTMENT_STATUS.ACCEPTED,
    });

    if (res.success) {
      setFeedbackToast(`Appointment on ${apt.date} at ${apt.timeSlot} accepted.`);
      refreshAppointments();
      if (onAppointmentsUpdated) onAppointmentsUpdated();
      setTimeout(() => setFeedbackToast(null), 4000);
    } else {
      setActionError(res.error || 'Failed to accept appointment.');
      setTimeout(() => setActionError(null), 6000);
    }
  };

  // 2. Reject appointment (Requires reason)
  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectReasonError('Please provide a specific reason for declining this appointment.');
      return;
    }

    const res = updateAppointmentStatus({
      appointmentId: rejectingApt.id,
      vetUser: currentUser,
      newStatus: APPOINTMENT_STATUS.REJECTED,
      reason: rejectReason.trim(),
    });

    if (res.success) {
      setFeedbackToast(`Appointment declined with explanation delivered to farmer.`);
      setRejectingApt(null);
      setRejectReason('');
      setRejectReasonError('');
      refreshAppointments();
      if (onAppointmentsUpdated) onAppointmentsUpdated();
      setTimeout(() => setFeedbackToast(null), 4000);
    } else {
      setRejectReasonError(res.error || 'Failed to decline appointment.');
    }
  };

  // 3. Complete appointment
  const handleConfirmComplete = () => {
    if (!isKycApproved) {
      setActionError('Action Restricted: Your veterinarian KYC status must be Approved by an Administrator before completing consultations.');
      setTimeout(() => setActionError(null), 6000);
      return;
    }

    const res = updateAppointmentStatus({
      appointmentId: completingApt.id,
      vetUser: currentUser,
      newStatus: APPOINTMENT_STATUS.COMPLETED,
      notes: completionNotes.trim(),
    });

    if (res.success) {
      setFeedbackToast(`Consultation marked as completed.`);
      setCompletingApt(null);
      setCompletionNotes('');
      refreshAppointments();
      if (onAppointmentsUpdated) onAppointmentsUpdated();
      setTimeout(() => setFeedbackToast(null), 4000);
    } else {
      setActionError(res.error || 'Failed to mark appointment completed.');
    }
  };

  return (
    <section
      className="dashboard-section"
      id="vet-appointments-section"
      aria-label="Veterinary Appointments & Consultations"
    >
      {/* Section Header */}
      <div className="section-header-row">
        <div>
          <h3 className="section-title">Clinical Consultations & Appointments</h3>
          <p className="section-subtitle">
            Manage incoming farmer consultation requests, farm visits, and clinical schedules
          </p>
        </div>

        <div className="section-header-actions">
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setIsAvailabilityModalOpen(true)}
          >
            <Settings size={14} />
            <span>Configure Availability</span>
          </button>
        </div>
      </div>

      {/* Floating Alerts */}
      {feedbackToast && (
        <div className="floating-feedback-toast" role="status">
          <CheckCircle2 size={16} />
          <span>{feedbackToast}</span>
        </div>
      )}

      {actionError && (
        <div className="rejection-reason-alert" style={{ marginBottom: '1rem' }} role="alert">
          <AlertTriangle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="cows-filter-pills" role="tablist">
        <button
          type="button"
          className={`filter-pill ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Requests ({counts.pending})
          {counts.pending > 0 && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#B45309',
                display: 'inline-block',
                marginLeft: '4px',
              }}
            />
          )}
        </button>
        <button
          type="button"
          className={`filter-pill ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          Confirmed / Scheduled ({counts.accepted})
        </button>
        <button
          type="button"
          className={`filter-pill ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Visits ({counts.completed})
        </button>
        <button
          type="button"
          className={`filter-pill ${activeTab === 'declined' ? 'active' : ''}`}
          onClick={() => setActiveTab('declined')}
        >
          Declined / Cancelled ({counts.declined})
        </button>
        <button
          type="button"
          className={`filter-pill ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({counts.all})
        </button>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="appointments-empty-state">
          <div className="empty-state-illustration-box">
            <img
              src="/images/illustrations/empty_appointments.jpg"
              alt="No appointments scheduled"
              className="empty-state-illustration-img"
              loading="lazy"
            />
          </div>
          <h3>No {activeTab !== 'all' ? activeTab : ''} Appointments</h3>
          <p>
            {activeTab === 'pending'
              ? 'There are no pending consultation requests waiting for clinical review.'
              : `No appointments currently found in the "${activeTab}" category.`}
          </p>
        </div>
      ) : (
        <div className="appointments-feed">
          {filteredAppointments.map((apt) => {
            const aptDate = new Date(apt.date);
            const dayNum = aptDate.getDate();
            const monthStr = aptDate.toLocaleString(undefined, { month: 'short' });

            const isPending = apt.status === APPOINTMENT_STATUS.PENDING;
            const isAccepted = apt.status === APPOINTMENT_STATUS.ACCEPTED;

            return (
              <div key={apt.id} className="appointment-item-card">
                {/* Header */}
                <div className="appointment-card-top">
                  <div className="appointment-header-details">
                    <div className="appointment-date-badge">
                      <span className="date-day-large">{dayNum}</span>
                      <span className="date-month-small">{monthStr}</span>
                    </div>

                    <div className="appointment-header-copy">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3>{apt.farmName || 'Dairy Farm'}</h3>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Farmer: <strong>{apt.farmerName}</strong>
                        </span>
                      </div>
                      <span className="appointment-time-tag">
                        <Clock size={13} />
                        <strong>{apt.timeSlot}</strong> • {apt.visitType}
                      </span>
                    </div>
                  </div>

                  <div>
                    {apt.status === APPOINTMENT_STATUS.PENDING && (
                      <span className="badge-pill watch">Action Required: Pending</span>
                    )}
                    {apt.status === APPOINTMENT_STATUS.ACCEPTED && (
                      <span className="badge-pill healthy">Confirmed / Scheduled</span>
                    )}
                    {apt.status === APPOINTMENT_STATUS.COMPLETED && (
                      <span className="badge-pill healthy">Completed</span>
                    )}
                    {apt.status === APPOINTMENT_STATUS.REJECTED && (
                      <span className="badge-pill alert">Declined</span>
                    )}
                    {apt.status === APPOINTMENT_STATUS.CANCELLED && (
                      <span className="badge-pill alert">Cancelled by Farmer</span>
                    )}
                  </div>
                </div>

                {/* Details Body */}
                <div className="appointment-details-body">
                  <div className="detail-col" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CowAvatar
                      photoUrl={apt.cowPhotoUrl || null}
                      name={apt.cowName}
                      tagId={apt.cowTag}
                      breed={apt.cowBreed}
                      size="small"
                      rounded="circle"
                    />
                    <div>
                      <span className="detail-label">Cow / Animal</span>
                      <span className="detail-value">
                        {apt.cowName} (Tag: {apt.cowTag})
                      </span>
                    </div>
                  </div>

                  <div className="detail-col">
                    <span className="detail-label">Breed & Status</span>
                    <span className="detail-value">
                      {apt.cowBreed} • {apt.cowStatus || 'Healthy'}
                    </span>
                  </div>

                  <div className="detail-col">
                    <span className="detail-label">Location / Pen</span>
                    <span className="detail-value">{apt.farmLocation || 'Maharashtra'}</span>
                  </div>

                  <div className="detail-col">
                    <span className="detail-label">Farmer Contact</span>
                    <span className="detail-value">
                      {apt.farmerPhone ? (
                        <a
                          href={`tel:${apt.farmerPhone}`}
                          style={{
                            color: 'var(--color-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                          }}
                        >
                          <Phone size={12} />
                          {apt.farmerPhone}
                        </a>
                      ) : (
                        'Contact on file'
                      )}
                    </span>
                  </div>
                </div>

                {/* Symptoms / Notes */}
                {apt.symptoms && (
                  <div className="appointment-symptoms-box">
                    <strong>Reported Symptoms / Reason:</strong> {apt.symptoms}
                  </div>
                )}

                {/* Rejection notice */}
                {apt.status === APPOINTMENT_STATUS.REJECTED && apt.rejectionReason && (
                  <div className="rejection-reason-alert">
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Decline Reason Provided:</strong> {apt.rejectionReason}
                    </div>
                  </div>
                )}

                {/* Completion notes */}
                {apt.status === APPOINTMENT_STATUS.COMPLETED && apt.completionNotes && (
                  <div className="completion-notes-box">
                    <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Clinical Notes / Prescription:</strong> {apt.completionNotes}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                {(isPending || isAccepted) && (
                  <div className="appointment-actions-footer">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger-text)', borderColor: 'var(--color-danger-border)' }}
                          onClick={() => {
                            setRejectingApt(apt);
                            setRejectReason('');
                            setRejectReasonError('');
                          }}
                        >
                          <X size={14} />
                          <span>Decline Request</span>
                        </button>

                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={() => handleAcceptAppointment(apt)}
                        >
                          <Check size={14} />
                          <span>Accept Appointment</span>
                        </button>
                      </>
                    )}

                    {isAccepted && (
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => {
                          setCompletingApt(apt);
                          setCompletionNotes('');
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Mark as Completed</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AVAILABILITY MODAL */}
      <VetAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        vetEmail={vetEmail}
        onSaved={() => {
          setFeedbackToast('Consulting availability and slots updated successfully.');
          setTimeout(() => setFeedbackToast(null), 3500);
        }}
      />

      {/* REJECT MODAL (MANDATORY REASON) */}
      {rejectingApt && (
        <div className="appointment-modal-overlay" role="dialog" aria-modal="true">
          <div className="appointment-modal-box">
            <div className="modal-header-row">
              <h3>Decline Appointment Request</h3>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setRejectingApt(null)}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Declining request from <strong>{rejectingApt.farmerName}</strong> for <strong>{rejectingApt.cowName}</strong> on <strong>{rejectingApt.date} at {rejectingApt.timeSlot}</strong>.
            </p>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Reason for Declining (Mandatory for farmer communication) *
              </label>
              <textarea
                rows={3}
                className="form-control"
                placeholder="e.g. Schedule conflict with an emergency calving surgery, farm location outside today's radius, please book tomorrow morning..."
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectReasonError) setRejectReasonError('');
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border-subtle)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'inherit',
                }}
              />
              {rejectReasonError && (
                <span style={{ fontSize: '11px', color: 'var(--color-danger-text)', display: 'block', marginTop: '4px' }}>
                  {rejectReasonError}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setRejectingApt(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                style={{ background: 'var(--color-danger-text)', borderColor: 'var(--color-danger-text)' }}
                onClick={handleConfirmReject}
              >
                Decline Consultation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE MODAL (OPTIONAL NOTES) */}
      {completingApt && (
        <div className="appointment-modal-overlay" role="dialog" aria-modal="true">
          <div className="appointment-modal-box">
            <div className="modal-header-row">
              <h3>Mark Consultation Completed</h3>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setCompletingApt(null)}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Record completion for <strong>{completingApt.farmerName}</strong>'s cow <strong>{completingApt.cowName} (Tag {completingApt.cowTag})</strong>.
            </p>

            <div>
              <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                Clinical Advice / Treatment Notes (Shared with Farmer)
              </label>
              <textarea
                rows={3}
                className="form-control"
                placeholder="e.g. Administered antibiotic infusion for subclinical mastitis in left rear quarter. Advised 48h milk withholding period and re-check on Friday."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-border-subtle)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setCompletingApt(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={handleConfirmComplete}
              >
                Complete Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
