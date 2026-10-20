import React, { useState, useEffect } from 'react';
import { X, UserPlus, CheckCircle2, ArrowRight } from 'lucide-react';
import { ROLE_DEFINITIONS } from '../../data/roles';
import VetKycRegisterModal from './VetKycRegisterModal';

export default function RegisterModal({ isOpen, onClose, selectedRole, onRegisteredLogin }) {
  const [activeRole, setActiveRole] = useState(
    selectedRole === 'admin' ? 'farmer' : (selectedRole || 'farmer')
  );
  const [formData, setFormData] = useState({
    fullName: '',
    emailOrPhone: '',
    farmOrOrg: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Keep activeRole in sync with selectedRole prop when modal opens (Admin self-registration strictly disallowed)
  useEffect(() => {
    if (selectedRole) {
      setActiveRole(selectedRole === 'admin' ? 'farmer' : selectedRole);
    }
  }, [selectedRole, isOpen]);

  if (!isOpen) return null;

  // If registering as Veterinarian, open the mandatory Vet KYC & document upload form
  if (activeRole === 'vet') {
    return (
      <VetKycRegisterModal
        isOpen={isOpen}
        onClose={onClose}
        onRegisteredLogin={onRegisteredLogin}
      />
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeRole === 'admin') {
      setErrorMsg('Administrative accounts cannot be self-registered. Please contact system operations.');
      return;
    }
    if (!formData.fullName.trim() || !formData.emailOrPhone.trim()) {
      setErrorMsg('Please enter your full name and email or phone number.');
      return;
    }

    setIsSubmitted(true);
  };

  const handleStartTesting = () => {
    if (activeRole === 'admin') return;
    onRegisteredLogin?.(formData.emailOrPhone, activeRole, formData.fullName);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-badge">Create Account</span>
            <h3 className="modal-title">Create BoviCare Account</h3>
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

        <div className="modal-body">
          {isSubmitted ? (
            <div className="modal-success-state">
              <div className="success-icon-wrap">
                <CheckCircle2 size={36} className="text-success" />
              </div>
              <h4>Account Profile Prepared</h4>
              <p>
                Account <strong>{formData.fullName}</strong> ({activeRole.toUpperCase()}) is ready. You can sign in immediately to access your herd dashboard.
              </p>
              <button
                type="button"
                className="btn-primary w-full"
                onClick={handleStartTesting}
              >
                Sign In As {formData.fullName}
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="modal-form">
              <p className="modal-instruction">
                Create your dairy farm operator account to begin monitoring herd health and recording daily milk yields:
              </p>

              {errorMsg && (
                <div className="form-error-banner" role="alert">
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Select Account Role</label>
                <div className="role-mini-tabs">
                  {ROLE_DEFINITIONS.filter((r) => r.id !== 'admin').map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={`mini-tab ${activeRole === r.id ? 'active' : ''}`}
                      onClick={() => setActiveRole(r.id)}
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-name" className="form-label">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Patil"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-contact" className="form-label">Email or Phone Number</label>
                <input
                  id="reg-contact"
                  type="text"
                  className="form-input"
                  placeholder="e.g. farmer@bovicare.com or +91 98765 43210"
                  value={formData.emailOrPhone}
                  onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-farm" className="form-label">Dairy Farm Name (Optional)</label>
                <input
                  id="reg-farm"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Patil Dairy Farm"
                  value={formData.farmOrOrg}
                  onChange={(e) => setFormData({ ...formData, farmOrOrg: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <UserPlus size={16} />
                  Register & Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
