import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  Tractor,
  Stethoscope,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Plus,
  ShieldCheck,
  Phone,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VetAvatar from '../common/VetAvatar';
import CowAvatar from '../common/CowAvatar';
import {
  getAppointmentsForFarmer,
  cancelAppointmentByFarmer,
  APPOINTMENT_STATUS,
} from '../../services/appointmentService';

export default function MyAppointmentsPage({ onBack, onBookNewAppointment }) {
  const { currentUser } = useAuth();
  const farmerEmail = currentUser?.email || 'farmer@bovicare.com';

  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Cancellation Modal State
  const [cancellingApt, setCancellingApt] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Load farmer appointments
  const refreshAppointments = () => {
    const list = getAppointmentsForFarmer(farmerEmail);
    setAppointments(list);
  };

  useEffect(() => {
    refreshAppointments();
  }, [farmerEmail]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    if (filter === 'all') return appointments;
    if (filter === 'active') {
      return appointments.filter((a) =>
        [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED].includes(a.status)
      );
    }
    if (filter === 'completed') {
      return appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED);
    }
    if (filter === 'cancelled') {
      return appointments.filter((a) =>
        [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.REJECTED].includes(a.status)
      );
    }
    return appointments;
  }, [appointments, filter]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      active: appointments.filter((a) =>
        [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED].includes(a.status)
      ).length,
      completed: appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
      cancelled: appointments.filter((a) =>
        [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.REJECTED].includes(a.status)
      ).length,
    };
  }, [appointments]);

  // Trigger Cancel
  const handleConfirmCancel = () => {
    if (!cancellingApt) return;
    setIsCancelling(true);
    setCancelError('');

    const res = cancelAppointmentByFarmer(cancellingApt.id, farmerEmail);
    setIsCancelling(false);

    if (res.success) {
      setFeedbackToast(
        `Appointment on ${cancellingApt.date} at ${cancellingApt.timeSlot} was cancelled.`
      );
      setCancellingApt(null);
      refreshAppointments();
      setTimeout(() => setFeedbackToast(null), 4000);
    } else {
      setCancelError(res.error || 'Failed to cancel appointment.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return <span className="badge-pill watch">Pending Vet Confirmation</span>;
      case APPOINTMENT_STATUS.ACCEPTED:
        return <span className="badge-pill healthy">Confirmed / Scheduled</span>;
      case APPOINTMENT_STATUS.COMPLETED:
        return <span className="badge-pill healthy">Completed</span>;
      case APPOINTMENT_STATUS.REJECTED:
        return <span className="badge-pill alert">Declined by Vet</span>;
      case APPOINTMENT_STATUS.CANCELLED:
        return <span className="badge-pill alert">Cancelled</span>;
      default:
        return <span className="badge-pill">{status}</span>;
    }
  };

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
              <h1 className="nav-page-title">My Appointments</h1>
              <p className="nav-page-subtitle">Veterinary consultations, farm visits & health logs</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={onBookNewAppointment}
          >
            <Plus size={16} />
            <span>Book a Vet</span>
          </button>
        </div>
      </header>

      <main className="appointment-container">
        {/* Toast Feedback */}
        {feedbackToast && (
          <div className="floating-feedback-toast" role="status">
            <CheckCircle2 size={16} />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="cows-filter-pills" role="tablist">
          <button
            type="button"
            className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Appointments ({counts.all})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Upcoming / Active ({counts.active})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({counts.completed})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled / Declined ({counts.cancelled})
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
            <h3>No Appointments Found</h3>
            <p>
              {filter === 'all'
                ? "You haven't scheduled any veterinary consultations yet. Click below to book an on-site visit or clinic checkup."
                : `No appointments match the "${filter}" filter criteria.`}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={onBookNewAppointment}
              style={{ marginTop: '0.5rem' }}
            >
              <Plus size={16} />
              <span>Book a Vet Now</span>
            </button>
          </div>
        ) : (
          <div className="appointments-feed">
            {filteredAppointments.map((apt) => {
              const aptDate = new Date(apt.date);
              const dayNum = aptDate.getDate();
              const monthStr = aptDate.toLocaleString(undefined, { month: 'short' });

              const canCancel = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED].includes(apt.status);

              return (
                <div key={apt.id} className="appointment-item-card">
                  <div className="appointment-card-top">
                    <div className="appointment-header-details">
                      <div className="appointment-date-badge">
                        <span className="date-day-large">{dayNum}</span>
                        <span className="date-month-small">{monthStr}</span>
                      </div>

                      <VetAvatar
                        fullName={apt.vetName}
                        photoUrl={apt.vetPhotoUrl || null}
                        size="medium"
                        isApproved={true}
                      />

                      <div className="appointment-header-copy">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h3>{apt.vetName}</h3>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            ({apt.vetClinic || 'Veterinary Clinic'})
                          </span>
                        </div>
                        <span className="appointment-time-tag">
                          <Clock size={13} />
                          <strong>{apt.timeSlot}</strong> • {apt.visitType}
                        </span>
                      </div>
                    </div>

                    <div>{getStatusBadge(apt.status)}</div>
                  </div>

                  {/* Body Details */}
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
                        <span className="detail-label">Animal Target</span>
                        <span className="detail-value">
                          {apt.cowName} (Tag: {apt.cowTag})
                        </span>
                      </div>
                    </div>

                    <div className="detail-col">
                      <span className="detail-label">Breed</span>
                      <span className="detail-value">{apt.cowBreed || 'Dairy Cattle'}</span>
                    </div>

                    <div className="detail-col">
                      <span className="detail-label">Doctor License</span>
                      <span className="detail-value">{apt.vetLicense || 'Verified VCI'}</span>
                    </div>

                    <div className="detail-col">
                      <span className="detail-label">Contact / Helpline</span>
                      <span className="detail-value">
                        {apt.vetPhone ? (
                          <a href={`tel:${apt.vetPhone}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                            {apt.vetPhone}
                          </a>
                        ) : (
                          '+91 98123 45678'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Symptoms & Notes */}
                  {apt.symptoms && (
                    <div className="appointment-symptoms-box">
                      <strong>Symptoms / Reason:</strong> {apt.symptoms}
                    </div>
                  )}

                  {/* Rejection Alert */}
                  {apt.status === APPOINTMENT_STATUS.REJECTED && apt.rejectionReason && (
                    <div className="rejection-reason-alert">
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Reason for Declining:</strong> {apt.rejectionReason}
                      </div>
                    </div>
                  )}

                  {/* Completion Notes */}
                  {apt.status === APPOINTMENT_STATUS.COMPLETED && apt.completionNotes && (
                    <div className="completion-notes-box">
                      <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Veterinary Clinical Advice:</strong> {apt.completionNotes}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  {canCancel && (
                    <div className="appointment-actions-footer">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger-text)', borderColor: 'var(--color-danger-border)' }}
                        onClick={() => {
                          setCancellingApt(apt);
                          setCancelError('');
                        }}
                      >
                        <XCircle size={14} />
                        <span>Cancel Appointment</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CANCELLATION CONFIRMATION DIALOG */}
      {cancellingApt && (
        <div className="appointment-modal-overlay" role="dialog" aria-modal="true">
          <div className="appointment-modal-box">
            <div className="modal-header-row">
              <h3>Confirm Cancellation</h3>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setCancellingApt(null)}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
              Are you sure you want to cancel your scheduled consultation with <strong>{cancellingApt.vetName}</strong> for <strong>{cancellingApt.cowName} (Tag {cancellingApt.cowTag})</strong> on <strong>{cancellingApt.date} at {cancellingApt.timeSlot}</strong>?
            </p>

            <div className="rejection-reason-alert" style={{ background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning-border)', color: 'var(--color-warning-text)' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                Cancelling will immediately release the <strong>{cancellingApt.timeSlot}</strong> slot so that other dairy farms in the district can book it.
              </span>
            </div>

            {cancelError && (
              <div className="rejection-reason-alert">
                <AlertTriangle size={16} />
                <span>{cancelError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setCancellingApt(null)}
                disabled={isCancelling}
              >
                Keep Appointment
              </button>

              <button
                type="button"
                className="btn-primary btn-sm"
                style={{ background: 'var(--color-danger-text)', borderColor: 'var(--color-danger-text)' }}
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
