import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Tractor,
  Stethoscope,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  getAllAppointments,
  APPOINTMENT_STATUS,
} from '../../services/appointmentService';

export default function AdminAppointmentsSection() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAptDetails, setSelectedAptDetails] = useState(null);

  const refreshAppointments = () => {
    setAppointments(getAllAppointments());
  };

  useEffect(() => {
    refreshAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      // Status filter
      if (filter !== 'all' && a.status !== filter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchFarmer = (a.farmerName || '').toLowerCase().includes(q);
        const matchVet = (a.vetName || '').toLowerCase().includes(q);
        const matchCow = (a.cowName || '').toLowerCase().includes(q) || (a.cowTag || '').toLowerCase().includes(q);
        const matchFarm = (a.farmName || '').toLowerCase().includes(q);
        return matchFarmer || matchVet || matchCow || matchFarm;
      }
      return true;
    });
  }, [appointments, filter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      pending: appointments.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length,
      accepted: appointments.filter((a) => a.status === APPOINTMENT_STATUS.ACCEPTED).length,
      completed: appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
      cancelled: appointments.filter((a) =>
        [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.REJECTED].includes(a.status)
      ).length,
    };
  }, [appointments]);

  const getStatusBadge = (status) => {
    switch (status) {
      case APPOINTMENT_STATUS.PENDING:
        return <span className="badge-pill watch">Pending Vet</span>;
      case APPOINTMENT_STATUS.ACCEPTED:
        return <span className="badge-pill healthy">Confirmed</span>;
      case APPOINTMENT_STATUS.COMPLETED:
        return <span className="badge-pill healthy">Completed</span>;
      case APPOINTMENT_STATUS.REJECTED:
        return <span className="badge-pill alert">Declined</span>;
      case APPOINTMENT_STATUS.CANCELLED:
        return <span className="badge-pill alert">Cancelled</span>;
      default:
        return <span className="badge-pill">{status}</span>;
    }
  };

  return (
    <section
      className="dashboard-section"
      id="admin-appointments-section"
      aria-label="Platform Veterinary Consultations Directory"
    >
      {/* Section Header */}
      <div className="section-header-row">
        <div>
          <h3 className="section-title">Platform Consultations Overview</h3>
          <p className="section-subtitle">
            Audit district-wide farmer-to-veterinarian bookings, slot allocations, and visit statuses
          </p>
        </div>
        <span className="badge-pill healthy">
          {counts.all} Total Scheduled
        </span>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-metrics-grid four-col" style={{ marginBottom: '1rem' }}>
        <div className="stat-metric-card">
          <span className="stat-card-title">Pending Confirmation</span>
          <span className="stat-card-value" style={{ color: '#B45309' }}>
            {counts.pending}
          </span>
          <span className="stat-trend neutral">Awaiting vet review</span>
        </div>
        <div className="stat-metric-card">
          <span className="stat-card-title">Confirmed Visits</span>
          <span className="stat-card-value" style={{ color: 'var(--color-primary)' }}>
            {counts.accepted}
          </span>
          <span className="stat-trend up">Scheduled on calendar</span>
        </div>
        <div className="stat-metric-card">
          <span className="stat-card-title">Completed Visits</span>
          <span className="stat-card-value" style={{ color: 'var(--color-success-text)' }}>
            {counts.completed}
          </span>
          <span className="stat-trend up">Consulted & logged</span>
        </div>
        <div className="stat-metric-card">
          <span className="stat-card-title">Cancelled / Declined</span>
          <span className="stat-card-value" style={{ color: 'var(--color-danger-text)' }}>
            {counts.cancelled}
          </span>
          <span className="stat-trend neutral">Released slots</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="cows-filter-pills" role="tablist" style={{ margin: 0, flex: 1 }}>
          <button
            type="button"
            className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === APPOINTMENT_STATUS.PENDING ? 'active' : ''}`}
            onClick={() => setFilter(APPOINTMENT_STATUS.PENDING)}
          >
            Pending ({counts.pending})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === APPOINTMENT_STATUS.ACCEPTED ? 'active' : ''}`}
            onClick={() => setFilter(APPOINTMENT_STATUS.ACCEPTED)}
          >
            Confirmed ({counts.accepted})
          </button>
          <button
            type="button"
            className={`filter-pill ${filter === APPOINTMENT_STATUS.COMPLETED ? 'active' : ''}`}
            onClick={() => setFilter(APPOINTMENT_STATUS.COMPLETED)}
          >
            Completed ({counts.completed})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search farm, vet, cow..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 10px 6px 30px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: 'var(--font-size-xs)',
              width: '100%',
              background: '#FFF',
            }}
          />
        </div>
      </div>

      {/* Consultations Table */}
      {filteredAppointments.length === 0 ? (
        <div className="appointments-empty-state">
          <div className="empty-state-icon">
            <Calendar size={28} />
          </div>
          <h3>No Consultations Found</h3>
          <p>
            {appointments.length === 0
              ? 'No appointments have been booked across the platform yet. Bookings made by farmers will appear here in real-time.'
              : 'No appointments match the selected search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="admin-table-card">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Date & Slot</th>
                <th>Dairy Farm & Farmer</th>
                <th>Cow Tag & Name</th>
                <th>Assigned Veterinarian</th>
                <th>Visit Mode</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((apt) => (
                <tr key={apt.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {apt.date}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {apt.timeSlot}
                    </div>
                  </td>
                  <td>
                    <div className="table-user-cell">
                      <span className="table-user-name">{apt.farmName}</span>
                      <span className="table-user-email">{apt.farmerName} • {apt.farmerPhone}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{apt.cowName}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Tag: {apt.cowTag} ({apt.cowBreed})
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{apt.vetName}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {apt.vetClinic}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px' }}>
                      {apt.visitType.includes('Farm') ? '🚜 Farm Visit' : '🏥 Clinic Visit'}
                    </span>
                  </td>
                  <td>{getStatusBadge(apt.status)}</td>
                  <td>
                    <button
                      type="button"
                      className="table-action-link"
                      onClick={() => setSelectedAptDetails(apt)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedAptDetails && (
        <div className="appointment-modal-overlay" role="dialog" aria-modal="true">
          <div className="appointment-modal-box">
            <div className="modal-header-row">
              <h3>Consultation Audit Record</h3>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setSelectedAptDetails(null)}
              >
                ✕
              </button>
            </div>

            <div className="booking-summary-box">
              <div className="summary-row">
                <span className="summary-label">Appointment ID:</span>
                <span className="summary-val" style={{ fontFamily: 'monospace' }}>
                  {selectedAptDetails.id}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Farmer & Farm:</span>
                <span className="summary-val">
                  {selectedAptDetails.farmerName} ({selectedAptDetails.farmName})
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Farmer Contact:</span>
                <span className="summary-val">
                  {selectedAptDetails.farmerPhone} • {selectedAptDetails.farmerEmail}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Veterinarian:</span>
                <span className="summary-val">
                  {selectedAptDetails.vetName} ({selectedAptDetails.vetLicense})
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Cow:</span>
                <span className="summary-val">
                  {selectedAptDetails.cowName} (Tag: {selectedAptDetails.cowTag}, {selectedAptDetails.cowBreed})
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Date & Slot:</span>
                <span className="summary-val">
                  {selectedAptDetails.date} at {selectedAptDetails.timeSlot}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Visit Type:</span>
                <span className="summary-val">{selectedAptDetails.visitType}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Stated Symptoms:</span>
                <span className="summary-val" style={{ maxWidth: '300px' }}>
                  {selectedAptDetails.symptoms || 'General clinical review'}
                </span>
              </div>
              {selectedAptDetails.rejectionReason && (
                <div className="summary-row" style={{ color: 'var(--color-danger-text)' }}>
                  <span className="summary-label" style={{ color: 'var(--color-danger-text)' }}>Rejection Reason:</span>
                  <span className="summary-val">{selectedAptDetails.rejectionReason}</span>
                </div>
              )}
              {selectedAptDetails.completionNotes && (
                <div className="summary-row" style={{ color: 'var(--color-success-text)' }}>
                  <span className="summary-label" style={{ color: 'var(--color-success-text)' }}>Clinical Notes:</span>
                  <span className="summary-val">{selectedAptDetails.completionNotes}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => setSelectedAptDetails(null)}
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
