import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Award,
  Trash2,
  RefreshCw,
  Eye,
  ArrowRight,
  Info,
  Lock,
} from 'lucide-react';
import { submitVetKyc } from '../../services/kycService';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export default function VetKycRegisterModal({ isOpen, onClose, onRegisteredLogin }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'password123',
    clinicName: '',
    state: 'Maharashtra',
    qualification: 'BVSc & AH',
    licenseNumber: '',
    issuingAuthority: 'Maharashtra State Veterinary Council (MSVC)',
    expiryDate: '',
    isPermanent: false,
    declarationAccepted: false,
  });

  // Attached Documents State
  // { file, name, size, type, dataUrl, previewUrl }
  const [regCertDoc, setRegCertDoc] = useState(null);
  const [degreeDoc, setDegreeDoc] = useState(null);
  const [idDoc, setIdDoc] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);

  // Hidden file input refs
  const regCertInputRef = useRef(null);
  const degreeInputRef = useRef(null);
  const idInputRef = useRef(null);

  if (!isOpen) return null;

  // File Upload Handler with validation
  const handleFileUpload = (file, docType) => {
    setGeneralError('');
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setGeneralError('Invalid file format. Only PDF, JPG, and PNG files are supported.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setGeneralError('File exceeds maximum size of 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result;
      const docObj = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: docType,
        fileName: file.name,
        fileType: file.type,
        fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        uploadedAt: new Date().toISOString(),
        dataUrl,
      };

      if (docType === 'reg_certificate') {
        setRegCertDoc(docObj);
        if (fieldErrors.regCert) {
          setFieldErrors((prev) => ({ ...prev, regCert: null }));
        }
      } else if (docType === 'degree_certificate') {
        setDegreeDoc(docObj);
        if (fieldErrors.degreeCert) {
          setFieldErrors((prev) => ({ ...prev, degreeCert: null }));
        }
      } else if (docType === 'identity_proof') {
        setIdDoc(docObj);
      }
    };
    reader.readAsDataURL(file);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full legal name is required.';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Valid professional email is required.';
    }
    if (!formData.phone.trim() || formData.phone.length < 8) {
      errors.phone = 'Valid contact mobile number is required.';
    }
    if (!formData.licenseNumber.trim()) {
      errors.licenseNumber = 'Statutory veterinary registration / license number is required.';
    }
    if (!formData.issuingAuthority.trim()) {
      errors.issuingAuthority = 'Issuing veterinary council is required.';
    }
    if (!formData.isPermanent && !formData.expiryDate) {
      errors.expiryDate = 'Please specify license expiry or check Permanent Registration.';
    }
    if (!regCertDoc) {
      errors.regCert = 'Veterinary Registration Certificate is mandatory.';
    }
    if (!degreeDoc) {
      errors.degreeCert = 'Qualification Degree Certificate is mandatory.';
    }
    if (!formData.declarationAccepted) {
      errors.declaration = 'You must certify the authenticity of the submitted credentials.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      setGeneralError('Please complete all required fields and upload the mandatory documents.');
      return;
    }

    setIsSubmitting(true);

    try {
      const documents = [];
      if (regCertDoc) documents.push(regCertDoc);
      if (degreeDoc) documents.push(degreeDoc);
      if (idDoc) documents.push(idDoc);

      const kycPayload = {
        fullName: formData.fullName.startsWith('Dr.') ? formData.fullName.trim() : `Dr. ${formData.fullName.trim()}`,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        qualification: formData.qualification,
        licenseNumber: formData.licenseNumber.trim(),
        issuingAuthority: formData.issuingAuthority,
        expiryDate: formData.expiryDate,
        isPermanent: formData.isPermanent,
        clinicName: formData.clinicName.trim() || 'Veterinary Clinical Services',
        state: formData.state,
        documents,
      };

      const result = submitVetKyc(kycPayload);
      if (result.success) {
        setSubmittedApp(result.application);
        setIsSubmitted(true);
      } else {
        setGeneralError('Could not submit KYC application. Please try again.');
      }
    } catch (err) {
      console.error('KYC submission error:', err);
      setGeneralError('An unexpected error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToStatus = () => {
    if (submittedApp) {
      onRegisteredLogin?.(submittedApp.email, 'vet', submittedApp.fullName, 'pending');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container"
        style={{ maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="modal-badge" style={{ background: 'var(--color-surface-mint)', color: 'var(--color-primary)' }}>
                First-Time Veterinarian
              </span>
              <span className="modal-badge" style={{ background: '#FEF3E2', color: '#B45309' }}>
                Mandatory KYC & License Verification
              </span>
            </div>
            <h3 className="modal-title" style={{ marginTop: '6px' }}>
              Veterinarian Registration & Credential Verification
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
          {isSubmitted ? (
            /* Submission Success State */
            <div className="modal-success-state" style={{ textAlign: 'center', padding: '16px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--color-surface-mint)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <ShieldCheck size={36} />
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-primary)' }}>
                KYC Application Submitted
              </h3>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: '#FEF3E2',
                  color: '#B45309',
                  fontWeight: 600,
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B45309' }} />
                Status: Pending Verification
              </div>

              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5, maxWidth: '540px', margin: '0 auto 20px' }}>
                Thank you, <strong>{submittedApp?.fullName}</strong>. Your veterinary license (
                <code>{submittedApp?.licenseNumber}</code>) and qualification certificates have been securely recorded.
                In accordance with agricultural healthcare compliance, clinical features remain locked until an administrator reviews and verifies your documents.
              </p>

              <div
                style={{
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  textAlign: 'left',
                  margin: '0 auto 24px',
                  maxWidth: '540px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Submitted Documents Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {submittedApp?.documents.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={16} color="var(--color-primary)" />
                        <strong>{doc.title || doc.fileName}</strong>
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{doc.fileSize} · Private</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={handleProceedToStatus}
                style={{ width: '100%', maxWidth: '360px', margin: '0 auto', justifyContent: 'center' }}
              >
                <span>Go to KYC Status Dashboard</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            /* Multi-Section KYC Form */
            <form onSubmit={handleSubmit} className="modal-form" noValidate>
              <p className="modal-instruction" style={{ marginBottom: '14px' }}>
                To practice on the BoviCare Clinical Network, state veterinary council regulations require verifying practitioner licenses and qualifications.
              </p>

              {generalError && (
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
                  <AlertCircle size={18} />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Section 1: Personal & Contact Information */}
              <div style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} />
                  1. Practitioner Identity & Contact Details
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vet-fullname">
                      Full Legal Name <span style={{ color: '#C53030' }}>*</span>
                    </label>
                    <input
                      id="vet-fullname"
                      type="text"
                      className={`form-input ${fieldErrors.fullName ? 'has-error' : ''}`}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                    {fieldErrors.fullName && <span style={{ color: '#C53030', fontSize: '11.5px' }}>{fieldErrors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vet-email">
                      Professional Email Address <span style={{ color: '#C53030' }}>*</span>
                    </label>
                    <input
                      id="vet-email"
                      type="email"
                      className={`form-input ${fieldErrors.email ? 'has-error' : ''}`}
                      placeholder="e.g. doctor@clinic.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    {fieldErrors.email && <span style={{ color: '#C53030', fontSize: '11.5px' }}>{fieldErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vet-phone">
                      Mobile Phone Number <span style={{ color: '#C53030' }}>*</span>
                    </label>
                    <input
                      id="vet-phone"
                      type="tel"
                      className={`form-input ${fieldErrors.phone ? 'has-error' : ''}`}
                      placeholder="e.g. +91 98123 45678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                    {fieldErrors.phone && <span style={{ color: '#C53030', fontSize: '11.5px' }}>{fieldErrors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vet-clinic">
                      Clinic / Veterinary Practice Name
                    </label>
                    <input
                      id="vet-clinic"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Western Dairy Veterinary Clinic"
                      value={formData.clinicName}
                      onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Statutory Licensing & Qualification */}
              <div style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} />
                  2. Statutory Licensing & Qualifications
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vet-license-no">
                      Council Registration / License Number <span style={{ color: '#C53030' }}>*</span>
                    </label>
                    <input
                      id="vet-license-no"
                      type="text"
                      className={`form-input ${fieldErrors.licenseNumber ? 'has-error' : ''}`}
                      placeholder="e.g. VET-MH-2024-5821"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      required
                    />
                    {fieldErrors.licenseNumber && <span style={{ color: '#C53030', fontSize: '11.5px' }}>{fieldErrors.licenseNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vet-authority">
                      Issuing Veterinary Council Authority <span style={{ color: '#C53030' }}>*</span>
                    </label>
                    <select
                      id="vet-authority"
                      className="form-input"
                      value={formData.issuingAuthority}
                      onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                    >
                      <option value="Veterinary Council of India (VCI)">Veterinary Council of India (VCI)</option>
                      <option value="Maharashtra State Veterinary Council (MSVC)">Maharashtra State Veterinary Council (MSVC)</option>
                      <option value="Karnataka Veterinary Council">Karnataka Veterinary Council</option>
                      <option value="Gujarat State Veterinary Council">Gujarat State Veterinary Council</option>
                      <option value="Punjab Veterinary Council">Punjab Veterinary Council</option>
                      <option value="Other State Statutory Veterinary Council">Other State Statutory Council</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vet-degree">
                      Primary Veterinary Qualification <span style={{ color: '#C53030' }}>*</span>
                    </label>
                    <select
                      id="vet-degree"
                      className="form-input"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    >
                      <option value="BVSc & AH">BVSc & AH (Bachelor of Veterinary Science & Animal Husbandry)</option>
                      <option value="MVSc (Bovine Clinical Medicine)">MVSc (Bovine Clinical Medicine)</option>
                      <option value="MVSc (Veterinary Surgery / Radiology)">MVSc (Veterinary Surgery / Radiology)</option>
                      <option value="MVSc (Animal Reproduction & Gynaecology)">MVSc (Animal Reproduction & Gynaecology)</option>
                      <option value="PhD in Veterinary Sciences">PhD in Veterinary Sciences</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" htmlFor="vet-expiry">
                        License Expiry Date {!formData.isPermanent && <span style={{ color: '#C53030' }}>*</span>}
                      </label>
                      <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.isPermanent}
                          onChange={(e) => setFormData({ ...formData, isPermanent: e.target.checked })}
                        />
                        Lifetime / Permanent
                      </label>
                    </div>
                    <input
                      id="vet-expiry"
                      type="date"
                      className={`form-input ${fieldErrors.expiryDate ? 'has-error' : ''}`}
                      disabled={formData.isPermanent}
                      value={formData.isPermanent ? '' : formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                    {fieldErrors.expiryDate && <span style={{ color: '#C53030', fontSize: '11.5px' }}>{fieldErrors.expiryDate}</span>}
                  </div>
                </div>
              </div>

              {/* Section 3: Mandatory Document Uploads */}
              <div style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={16} />
                    3. Mandatory Document Uploads (PDF / JPG / PNG · Max 10MB)
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Private & Encrypted</span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>
                  Certificates are strictly stored in private compliance storage. Uploading does not imply official verification until approved by an administrator.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Document 1: Veterinary Registration Certificate (Mandatory) */}
                  <div
                    style={{
                      border: `1.5px dashed ${fieldErrors.regCert ? '#C53030' : regCertDoc ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      background: regCertDoc ? 'var(--color-surface-mint)' : '#FFFFFF',
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
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-sm)',
                          background: regCertDoc ? '#FFFFFF' : 'var(--color-surface-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: regCertDoc ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        }}
                      >
                        <FileText size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          Veterinary Registration Certificate <span style={{ color: '#C53030' }}>*</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {regCertDoc
                            ? `${regCertDoc.fileName} (${regCertDoc.fileSize}) · Ready for review`
                            : 'Official certificate from State Council / VCI showing valid registration number'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="file"
                        ref={regCertInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e.target.files?.[0], 'reg_certificate')}
                      />
                      {regCertDoc ? (
                        <>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ height: '34px', padding: '0 10px', fontSize: '12px' }}
                            onClick={() => regCertInputRef.current?.click()}
                          >
                            <RefreshCw size={13} />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ height: '34px', padding: '0 10px', fontSize: '12px', color: '#C53030' }}
                            onClick={() => setRegCertDoc(null)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ height: '34px', padding: '0 14px', fontSize: '12px' }}
                          onClick={() => regCertInputRef.current?.click()}
                        >
                          <Upload size={13} />
                          <span>Upload Certificate</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {fieldErrors.regCert && (
                    <span style={{ color: '#C53030', fontSize: '11.5px', marginTop: '-6px' }}>{fieldErrors.regCert}</span>
                  )}

                  {/* Document 2: Qualification Degree Certificate (Mandatory) */}
                  <div
                    style={{
                      border: `1.5px dashed ${fieldErrors.degreeCert ? '#C53030' : degreeDoc ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      background: degreeDoc ? 'var(--color-surface-mint)' : '#FFFFFF',
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
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-sm)',
                          background: degreeDoc ? '#FFFFFF' : 'var(--color-surface-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: degreeDoc ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        }}
                      >
                        <Award size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          Qualification Degree Certificate (BVSc / MVSc) <span style={{ color: '#C53030' }}>*</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {degreeDoc
                            ? `${degreeDoc.fileName} (${degreeDoc.fileSize}) · Ready for review`
                            : 'Degree certificate or convocation diploma from accredited veterinary university'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="file"
                        ref={degreeInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e.target.files?.[0], 'degree_certificate')}
                      />
                      {degreeDoc ? (
                        <>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ height: '34px', padding: '0 10px', fontSize: '12px' }}
                            onClick={() => degreeInputRef.current?.click()}
                          >
                            <RefreshCw size={13} />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ height: '34px', padding: '0 10px', fontSize: '12px', color: '#C53030' }}
                            onClick={() => setDegreeDoc(null)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ height: '34px', padding: '0 14px', fontSize: '12px' }}
                          onClick={() => degreeInputRef.current?.click()}
                        >
                          <Upload size={13} />
                          <span>Upload Degree</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {fieldErrors.degreeCert && (
                    <span style={{ color: '#C53030', fontSize: '11.5px', marginTop: '-6px' }}>{fieldErrors.degreeCert}</span>
                  )}

                  {/* Document 3: Govt Identity Proof / Clinical Affiliation (Configurable / Optional) */}
                  <div
                    style={{
                      border: '1px dashed var(--color-border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      background: idDoc ? 'var(--color-surface-mint)' : '#FFFFFF',
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
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-sm)',
                          background: idDoc ? '#FFFFFF' : 'var(--color-surface-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: idDoc ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        }}
                      >
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          Government Photo ID / Practice Affiliation <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>(Optional)</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          {idDoc
                            ? `${idDoc.fileName} (${idDoc.fileSize}) · Attached`
                            : 'National ID, Aadhaar (masked), Passport, or Clinic Establishment License'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="file"
                        ref={idInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e.target.files?.[0], 'identity_proof')}
                      />
                      {idDoc ? (
                        <>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ height: '34px', padding: '0 10px', fontSize: '12px' }}
                            onClick={() => idInputRef.current?.click()}
                          >
                            <RefreshCw size={13} />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ height: '34px', padding: '0 10px', fontSize: '12px', color: '#C53030' }}
                            onClick={() => setIdDoc(null)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ height: '34px', padding: '0 14px', fontSize: '12px' }}
                          onClick={() => idInputRef.current?.click()}
                        >
                          <Upload size={13} />
                          <span>Attach Document</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Declaration & Submission */}
              <div style={{ paddingTop: '8px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '12.5px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    lineHeight: 1.45,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.declarationAccepted}
                    onChange={(e) => {
                      setFormData({ ...formData, declarationAccepted: e.target.checked });
                      if (fieldErrors.declaration) {
                        setFieldErrors((prev) => ({ ...prev, declaration: null }));
                      }
                    }}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    I certify that the veterinary credentials and certificates provided are authentic and issued by a recognized statutory council.
                    I acknowledge that account activation is strictly subject to administrator verification, and clinical triage access remains restricted until approved.
                  </span>
                </label>
                {fieldErrors.declaration && (
                  <div style={{ color: '#C53030', fontSize: '11.5px', marginTop: '4px' }}>
                    {fieldErrors.declaration}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="modal-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Submitting KYC Documents...</span>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Submit Application for Verification</span>
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
