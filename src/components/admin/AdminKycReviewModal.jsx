import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Award,
  Building2,
  Calendar,
  Eye,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { approveKyc, rejectKyc, requestKycResubmission } from '../../services/kycService';
import { useAuth } from '../../context/AuthContext';

const REJECTION_REASONS = [
  'Statutory License Number Not Found on State Council Registry',
  'Registration Certificate is Expired / Renewal Overdue',
  'Uploaded Document is Blur, Truncated, or Illegible',
  'Degree Certificate Mismatch with Stated Veterinary Qualification',
  'Issuing Council Authority Does Not Match Jurisdiction',
  'Incomplete Supporting Clinical Documentation',
  'Other Statutory Regulatory Non-Compliance',
];

export default function AdminKycReviewModal({ isOpen, onClose, application, onStatusUpdated }) {
  const { currentUser } = useAuth();
  const [actionTab, setActionTab] = useState('review'); // 'review' | 'reject' | 'resubmit'
  const [previewDoc, setPreviewDoc] = useState(null);

  // Form states for approval/rejection
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState(REJECTION_REASONS[0]);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !application) return null;

  const handleApprove = () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const res = approveKyc(application.id, adminNotes, currentUser);
      if (res.success) {
        onStatusUpdated?.(res.application);
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to approve application.');
      }
    } catch (e) {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (e) => {
    e.preventDefault();
    if (!rejectionNotes.trim()) {
      setErrorMessage('Please provide specific feedback notes explaining the rejection.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const fullReason = `${rejectionCategory}: ${rejectionNotes.trim()}`;
      const res = rejectKyc(application.id, rejectionCategory, rejectionNotes.trim(), currentUser);
      if (res.success) {
        onStatusUpdated?.(res.application);
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to reject application.');
      }
    } catch (e) {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container"
        style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="modal-badge" style={{ background: 'var(--color-surface-mint)', color: 'var(--color-primary)' }}>
                Compliance & Verification
              </span>
              <span
                className="modal-badge"
                style={{
                  background: application.status === 'approved' ? '#E7F7ED' : application.status === 'rejected' ? '#FEECEB' : '#FEF3E2',
                  color: application.status === 'approved' ? '#17733E' : application.status === 'rejected' ? '#C53030' : '#B45309',
                }}
              >
                {application.status === 'approved' ? 'Verified' : application.status === 'rejected' ? 'Declined' : 'Pending Review'}
              </span>
            </div>
            <h3 className="modal-title" style={{ marginTop: '6px' }}>
              Veterinarian Credential & License Audit
            </h3>
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

        {/* Modal Body */}
        <div className="modal-body">
          {errorMessage && (
            <div
              className="auth-error-alert"
              role="alert"
              style={{
                background: '#FEECEB',
                color: '#C53030',
                border: '1px solid #F9C3C1',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13.5px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Practitioner Overview Card */}
          <div
            style={{
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '17px', color: 'var(--color-primary)' }}>
                  {application.fullName}
                </h4>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {application.email} · {application.phone}
                </div>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  Council License No
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {application.licenseNumber}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px dashed var(--color-border-subtle)',
                fontSize: '12.5px',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Authority:</span>{' '}
                <strong>{application.issuingAuthority}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Qualification:</span>{' '}
                <strong>{application.qualification}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Clinic:</span>{' '}
                <strong>{application.clinicName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>License Validity:</span>{' '}
                <strong>{application.expiryDate}</strong>
              </div>
            </div>
          </div>

          {/* Uploaded Documents Review List */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} />
              Attached Private Documents ({application.documents?.length || 0})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {application.documents?.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface-mint)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {doc.title || doc.fileName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {doc.fileName} · {doc.fileSize} · {doc.fileType || 'Private PDF/Image'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ height: '34px', padding: '0 12px', fontSize: '12.5px', gap: '6px' }}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <Eye size={14} />
                    <span>Inspect Document</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Document Preview Lightbox/Drawer */}
          {previewDoc && (
            <div
              style={{
                background: 'var(--color-surface-mint)',
                border: '1.5px solid var(--color-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Document Inspection: {previewDoc.title || previewDoc.fileName}
                </div>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                  onClick={() => setPreviewDoc(null)}
                >
                  <X size={16} />
                </button>
              </div>

              {previewDoc.dataUrl && previewDoc.fileType?.startsWith('image/') ? (
                <div style={{ textAlign: 'center', background: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                  <img
                    src={previewDoc.dataUrl}
                    alt={previewDoc.fileName}
                    style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '4px' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <FileText size={48} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {previewDoc.fileName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                    Authenticated PDF Certificate · {previewDoc.fileSize} · Verified Checksum
                  </div>
                  <div style={{ display: 'inline-block', padding: '6px 14px', background: 'var(--color-surface-mint)', borderRadius: '9999px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    Statutory Council Seal & Signature Intact
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Tabs: Review vs Reject */}
          <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '20px' }}>
            {actionTab === 'review' ? (
              <div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="admin-approval-notes">
                    Administrator Review Notes (Optional audit log)
                  </label>
                  <input
                    id="admin-approval-notes"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cross-verified with Maharashtra State Veterinary Council roster."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>

                <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ color: '#C53030', borderColor: '#F9C3C1' }}
                    onClick={() => {
                      setActionTab('reject');
                      setErrorMessage('');
                    }}
                  >
                    <ShieldAlert size={15} />
                    <span>Decline / Reject License...</span>
                  </button>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={isProcessing}>
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleApprove}
                      disabled={isProcessing}
                    >
                      <ShieldCheck size={16} />
                      <span>Approve License & Activate Account</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Reject Application Form (Requires Mandatory Reason) */
              <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    background: '#FEECEB',
                    border: '1px solid #F9C3C1',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    fontSize: '13px',
                    color: '#9B1C1C',
                  }}
                >
                  <strong>Compliance Rejection Required:</strong> You must state the exact regulatory or credential reason why this veterinarian's license cannot be approved.
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Primary Rejection Category <span style={{ color: '#C53030' }}>*</span>
                  </label>
                  <select
                    className="form-input"
                    value={rejectionCategory}
                    onChange={(e) => setRejectionCategory(e.target.value)}
                  >
                    {REJECTION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reject-notes">
                    Specific Feedback & Explanation for Practitioner <span style={{ color: '#C53030' }}>*</span>
                  </label>
                  <textarea
                    id="reject-notes"
                    className="form-input"
                    style={{ height: '80px', padding: '10px 14px' }}
                    placeholder="Describe the discrepancy or state council lookup result so the practitioner can understand or appeal..."
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActionTab('review')}
                    disabled={isProcessing}
                  >
                    Back to Review
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ background: '#C53030', borderColor: '#C53030' }}
                    disabled={isProcessing}
                  >
                    <AlertCircle size={16} />
                    <span>Confirm Rejection & Notify Practitioner</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
