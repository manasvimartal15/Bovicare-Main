import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Server,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordModal({ isOpen, onClose, initialIdentifier = '' }) {
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'submitted' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Prepopulate if valid email was entered on login form
  useEffect(() => {
    if (initialIdentifier && initialIdentifier.includes('@')) {
      setEmail(initialIdentifier.trim());
    }
  }, [initialIdentifier, isOpen]);

  if (!isOpen) return null;

  const validateEmail = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) {
      return 'Please enter your registered email address.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address format (e.g. name@domain.com).';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validationError = validateEmail(email);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setStatus('loading');

    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setSubmittedEmail(res.email);
        setStatus('submitted');
      } else {
        setErrorMsg(res.error || 'Failed to process request.');
        setStatus('idle');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setStatus('idle');
    }
  };

  const handleResetAndClose = () => {
    setStatus('idle');
    setErrorMsg('');
    setEmail('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleResetAndClose} role="dialog" aria-modal="true">
      <div
        className="modal-container"
        style={{ maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-badge">Account Security</span>
            <h3 className="modal-title">Reset Your Password</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleResetAndClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {status === 'submitted' ? (
            /* Secure Confirmation & Transparent Service Status View */
            <div className="modal-success-state" style={{ textAlign: 'left', padding: '4px 0' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--color-surface-mint)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <KeyRound size={26} />
              </div>

              <h4 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-primary)' }}>
                Password Reset Request Recorded
              </h4>

              {/* Security Rule: Generic notice that never leaks account existence */}
              <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
                If an active dairy account exists for <strong>{submittedEmail}</strong>, password reset instructions will be processed securely.
              </p>

              {/* Requirement 7: Transparent explanation of what backend configuration is still required */}
              <div
                style={{
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  borderLeft: '4px solid #B45309',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  fontSize: '12.5px',
                  lineHeight: 1.45,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#B45309', marginBottom: '4px' }}>
                  <Server size={15} />
                  <span>Backend Email Service Status</span>
                </div>
                <p style={{ margin: '0 0 8px', color: 'var(--color-text-secondary)' }}>
                  A production mail delivery service (such as SMTP, Amazon SES, SendGrid, or Supabase/Firebase Auth) is not yet configured for this application. In accordance with BoviCare security guidelines, no simulated emails have been dispatched.
                </p>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                  <strong>Required Setup:</strong> Connect a transactional email gateway and configure verified sender SPF/DKIM DNS records on your backend server.
                </div>
              </div>

              {/* Return to login button */}
              <button
                type="button"
                className="btn-primary w-full"
                onClick={handleResetAndClose}
                style={{ justifyContent: 'center' }}
              >
                <ArrowLeft size={16} />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleSubmit} className="modal-form" noValidate>
              <p className="modal-instruction">
                Enter your registered dairy account email address below. We'll send you a secure link to reset your credentials.
              </p>

              {errorMsg && (
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
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="recovery-email-input" className="form-label">
                  Registered Email Address <span style={{ color: '#C53030' }}>*</span>
                </label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-prefix-icon" />
                  <input
                    id="recovery-email-input"
                    type="email"
                    autoComplete="email"
                    className="form-input has-icon"
                    placeholder="e.g. farmer@bovicare.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    disabled={status === 'loading'}
                    autoFocus
                    required
                  />
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  We will never share your email or disclose account existence.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResetAndClose}
                  disabled={status === 'loading'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
