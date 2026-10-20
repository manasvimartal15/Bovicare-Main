import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Milk,
  Calendar,
  Syringe,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  Thermometer,
  Plus,
  FileText,
  Stethoscope,
} from 'lucide-react';
import { useCows } from '../../context/CowsContext';
import CowAvatar from '../common/CowAvatar';

export default function CowProfilePage({
  cowId,
  onBack,
  onEditCow,
  onStartAssessment,
  onLogFever,
  onLogMilk,
  onAddVaccine,
  onOpenRecords,
  onBookVet,
  roleContext = 'farmer',
}) {
  const { getCowById, deleteCow } = useCows();
  const cow = getCowById(cowId);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  if (!cow) {
    return (
      <div className="cow-profile-page-wrapper">
        <header className="page-nav-header">
          <div className="nav-header-inner">
            <button type="button" className="nav-back-btn" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
            <div className="nav-titles">
              <h1 className="nav-page-title">Cow Profile</h1>
            </div>
          </div>
        </header>
        <main className="cow-profile-container">
          <div className="cow-not-found-card">
            <h3>Cow Record Not Found</h3>
            <p>The requested cow record may have been removed or does not exist.</p>
            <button type="button" className="btn-primary" onClick={onBack}>
              Back to My Cows
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleDelete = () => {
    deleteCow(cow.id);
    onBack();
  };

  const showSubFeatureNotice = (featureName) => {
    setFeedbackToast(`${featureName} will be available in subsequent steps upon approval.`);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  return (
    <div className="cow-profile-page-wrapper">
      {/* Top Header */}
      <header className="page-nav-header">
        <div className="nav-header-inner">
          <div className="nav-left">
            <button
              type="button"
              className="nav-back-btn"
              onClick={onBack}
              aria-label="Back to previous list"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="nav-titles">
              <h1 className="nav-page-title">{cow.name}</h1>
              <p className="nav-page-subtitle">{cow.tagId} · {cow.breed}</p>
            </div>
          </div>

          <div className="nav-right">
            {roleContext === 'farmer' && (
              <div className="profile-action-btns">
                <button
                  type="button"
                  className="btn-icon-action edit"
                  onClick={() => onEditCow(cow)}
                  title="Edit Cow Details"
                  aria-label="Edit cow"
                >
                  <Edit3 size={17} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn-icon-action delete"
                  onClick={() => setConfirmDelete(true)}
                  title="Remove Cow from Herd"
                  aria-label="Delete cow"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Profile Content */}
      <main className="cow-profile-container">
        {feedbackToast && (
          <div className="floating-feedback-toast" role="status">
            <Info size={16} />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-badge alert">Confirm Removal</span>
                <h3 className="modal-title">Remove {cow.name} ({cow.tagId})?</h3>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to remove this cow from your dairy herd roster? This action will remove its profile and local history.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Keep Record
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={handleDelete}
                  >
                    Delete Cow Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. Cow Details Hero Card */}
        <section className="profile-hero-card" aria-label="Cow Identification">
          <div className="profile-hero-top">
            <div className="profile-photo-wrapper">
              <CowAvatar
                photoUrl={cow.photoUrl}
                name={cow.name}
                tagId={cow.tagId}
                breed={cow.breed}
                avatarColor={cow.avatarColor || '#17733E'}
                size="large"
                rounded="circle"
              />
            </div>

            <div className="profile-hero-info">
              <div className="profile-name-row">
                <h2 className="profile-cow-name">{cow.name}</h2>
                <span className={`badge-pill ${cow.status}`}>
                  {cow.status === 'alert' ? 'Needs Attention' : cow.status === 'watch' ? 'Under Observation' : 'Healthy'}
                </span>
              </div>

              <div className="profile-meta-chips">
                <span className="profile-meta-chip tag">{cow.tagId}</span>
                <span className="profile-meta-chip breed">{cow.breed}</span>
                <span className="profile-meta-chip gender">{cow.gender}</span>
              </div>

              {cow.issue && (
                <div className="profile-issue-callout">
                  <AlertTriangle size={15} />
                  <span>{cow.issue}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="profile-quick-stats-strip">
            <div className="stat-cell">
              <span className="stat-label">Daily Milk</span>
              <span className="stat-value">{cow.milkYieldPerDay || cow.milkToday || '—'} L</span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">Age</span>
              <span className="stat-value">{cow.ageYears} yrs</span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">Body Weight</span>
              <span className="stat-value">{cow.weightKg ? `${cow.weightKg} kg` : '—'}</span>
            </div>
            <div className="stat-cell">
              <span className="stat-label">Temperature</span>
              <span className={`stat-value ${cow.status === 'alert' ? 'text-danger' : ''}`}>
                {cow.temperature || '38.5 °C'}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Health Status & Clinical Score */}
        <section className="profile-section-card" aria-label="Health Status">
          <div className="card-section-header">
            <div>
              <h3 className="card-section-title">Health Status & Diagnostics</h3>
              <p className="card-section-sub">Latest subclinical screening and temperature telemetry</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {roleContext === 'farmer' && onBookVet && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => onBookVet(cow.id)}
                  title="Schedule a Vet Consultation for this cow"
                  style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                >
                  <Stethoscope size={14} />
                  <span>Book Vet</span>
                </button>
              )}
              {roleContext === 'farmer' && onLogFever && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => onLogFever(cow.id)}
                  title="Record Temperature"
                >
                  <Thermometer size={14} />
                  <span>Log Temp</span>
                </button>
              )}
              <span className={`badge-pill ${cow.status}`}>
                {cow.status === 'alert' ? 'Mastitis Alert' : cow.status === 'watch' ? 'Monitoring' : 'Low Risk'}
              </span>
            </div>
          </div>

          <div className="health-status-body">
            <div className="health-indicator-box">
              <div className="health-score-dial">
                {cow.status === 'healthy' && <CheckCircle2 size={38} className="text-success" />}
                {cow.status === 'watch' && <Clock size={38} className="text-warning" />}
                {cow.status === 'alert' && <AlertTriangle size={38} className="text-danger" />}
              </div>
              <div className="health-score-copy">
                <h4>{cow.lastAssessment}</h4>
                <p>
                  {cow.status === 'alert'
                    ? 'Elevated udder quadrant temperature detected. Veterinary attention requested for clinical confirmation.'
                    : cow.status === 'watch'
                    ? 'Subclinical variance observed in milk conductivity. Recommended twice-daily monitoring.'
                    : 'Teat tissue integrity healthy. Zero signs of inflammation or bacterial mastitis.'}
                </p>
              </div>
            </div>

            {cow.notes && (
              <div className="cow-notes-box">
                <span className="notes-heading">Recorded Herd Notes:</span>
                <p>{cow.notes}</p>
              </div>
            )}
          </div>
        </section>

        {/* 3. Milk Production Summary */}
        <section className="profile-section-card" aria-label="Milk Production Summary">
          <div className="card-section-header">
            <div>
              <h3 className="card-section-title">Milk Production Summary</h3>
              <p className="card-section-sub">Daily yield benchmarks and session breakdowns</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {roleContext === 'farmer' && onLogMilk && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => onLogMilk(cow.id)}
                  title="Log Milk Production"
                >
                  <Plus size={14} />
                  <span>Log Milk</span>
                </button>
              )}
              <span className="milk-production-tag">
                <Milk size={14} /> {cow.milkYieldPerDay || cow.milkToday || '—'} L/day
              </span>
            </div>
          </div>

          <div className="milk-summary-grid">
            <div className="milk-session-box morning">
              <span className="session-title">Morning Milking (06:00 AM)</span>
              <span className="session-val">{cow.morningMilk || Math.round((cow.milkYieldPerDay || 14) * 0.55)} L</span>
              <span className="session-pct">~55% of daily yield</span>
            </div>

            <div className="milk-session-box evening">
              <span className="session-title">Evening Milking (05:30 PM)</span>
              <span className="session-val">{cow.eveningMilk || Math.round((cow.milkYieldPerDay || 14) * 0.45)} L</span>
              <span className="session-pct">~45% of daily yield</span>
            </div>

            <div className="milk-session-box weekly">
              <span className="session-title">7-Day Estimated Total</span>
              <span className="session-val">{Math.round((cow.milkYieldPerDay || 14) * 7)} L</span>
              <span className="session-pct">Steady lactation curve</span>
            </div>
          </div>
        </section>

        {/* 4. Recent Assessments History */}
        <section className="profile-section-card" aria-label="Recent Assessments">
          <div className="card-section-header">
            <div>
              <h3 className="card-section-title">Recent Assessments</h3>
              <p className="card-section-sub">Screening history, clinical notes & AI confidence scores</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onOpenRecords && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => onOpenRecords(cow.id)}
                  title="View All Health Records"
                >
                  <FileText size={14} />
                  <span>All Records</span>
                </button>
              )}
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => {
                  if (onStartAssessment) {
                    onStartAssessment(cow.id);
                  } else {
                    setFeedbackToast('AI Udder Scanner is accessible directly via Farmer Dashboard or Navigation Menu.');
                    setTimeout(() => setFeedbackToast(null), 3500);
                  }
                }}
              >
                <Camera size={14} />
                <span>New Assessment</span>
              </button>
            </div>
          </div>

          <div className="assessments-history-stack">
            {cow.assessments && cow.assessments.length > 0 ? (
              cow.assessments.map((asm) => (
                <div key={asm.id} className="history-assessment-row">
                  <div className={`history-dot ${asm.status}`} />
                  <div className="history-details">
                    <div className="history-head">
                      <span className="history-date"><Clock size={12} /> {asm.date}</span>
                      <span className={`badge-pill ${asm.status}`}>{asm.result} ({asm.confidence})</span>
                    </div>
                    <p className="history-cond">{asm.condition}</p>
                    <span className="history-assessor">Conducted by: {asm.assessedBy}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-subtext">No historical assessments recorded for this cow yet.</p>
            )}
          </div>
        </section>

        {/* 5. Vaccination and Treatment History */}
        <section className="profile-section-card" aria-label="Vaccination History">
          <div className="card-section-header">
            <div>
              <h3 className="card-section-title">Vaccination & Treatment History</h3>
              <p className="card-section-sub">Immunization schedules and medical administration records</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {roleContext === 'farmer' && onAddVaccine && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => onAddVaccine(cow.id)}
                  title="Log Vaccine"
                >
                  <Syringe size={14} />
                  <span>Add Vaccine</span>
                </button>
              )}
              <span className="badge-pill healthy">Compliant</span>
            </div>
          </div>

          <div className="vaccine-history-stack">
            {cow.vaccinations && cow.vaccinations.length > 0 ? (
              cow.vaccinations.map((vac) => (
                <div key={vac.id} className="vaccine-history-row">
                  <div className="vac-icon-wrap">
                    <Syringe size={16} />
                  </div>
                  <div className="vac-details">
                    <div className="vac-title-row">
                      <span className="vac-name">{vac.title}</span>
                      <span className={`badge-pill ${vac.status === 'Due Today' ? 'alert' : 'healthy'}`}>
                        {vac.status}
                      </span>
                    </div>
                    <span className="vac-meta">
                      <Calendar size={12} /> {vac.date} · Administered by: {vac.administrator}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-subtext">No vaccination entries recorded yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
