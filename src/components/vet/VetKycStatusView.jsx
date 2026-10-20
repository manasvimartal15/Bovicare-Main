import React from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  Building2,
  Award,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getKycByEmail } from '../../services/kycService';
import BrandLogo from '../common/BrandLogo';

export default function VetKycStatusView({ onOpenResubmit }) {
  const { currentUser, logout } = useAuth();
  const kycApp = getKycByEmail(currentUser?.email);

  const status = kycApp?.status || currentUser?.kycStatus || 'pending';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const isResubmit = status === 'resubmission_required';

  return (
    <div className="login-screen-wrapper" style={{ padding: '0 16px 48px' }}>
      {/* Top Header */}
      <header
        style={{
          width: '100%',
          maxWidth: '820px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0 20px',
          borderBottom: '1px solid var(--color-border-subtle)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <BrandLogo size="medium" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
              Veterinarian Verification Hub
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Statutory License & Compliance Gate
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: isPending ? '#FEF3E2' : isRejected ? '#FEECEB' : 'var(--color-surface-mint)',
              color: isPending ? '#B45309' : isRejected ? '#C53030' : 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isPending ? '#B45309' : isRejected ? '#C53030' : 'var(--color-primary)',
              }}
            />
            {isPending ? 'Pending Verification' : isRejected ? 'License Declined' : 'Resubmission Requested'}
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={logout}
            style={{ height: '36px', padding: '0 12px', fontSize: '12.5px', gap: '6px' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Status Container */}
      <main style={{ width: '100%', maxWidth: '820px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 32px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Status Alert Banner */}
          {isPending && (
            <div
              style={{
                background: '#FEF3E2',
                border: '1px solid #FCD9A5',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                marginBottom: '24px',
              }}
            >
              <Clock size={22} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#B45309' }}>
                  Application Under Administrative Review
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#92400E', lineHeight: 1.5 }}>
                  Your veterinary practice license (<code>{kycApp?.licenseNumber || 'License on file'}</code>) and qualification certificates have been safely received.
                  In compliance with dairy healthcare regulations, <strong>clinical features (mastitis triage, herd health records, and prescription orders) are locked</strong> until an authorized BoviCare compliance administrator verifies your statutory council registration.
                </p>
              </div>
            </div>
          )}

          {isRejected && (
            <div
              style={{
                background: '#FEECEB',
                border: '1px solid #F9C3C1',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                marginBottom: '24px',
              }}
            >
              <ShieldAlert size={22} color="#C53030" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ width: '100%' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#C53030' }}>
                  License Verification Declined
                </h4>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#9B1C1C', lineHeight: 1.5 }}>
                  The compliance administration was unable to verify your veterinary credentials.
                </p>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #F9C3C1',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#C53030', marginBottom: '2px' }}>
                    Reason: {kycApp?.rejectionReason || 'Council Registration Mismatch'}
                  </div>
                  {kycApp?.adminNotes && (
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '12.5px' }}>
                      Admin Notes: {kycApp.adminNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verification Timeline Tracker */}
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
              Verification Progress
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div
                style={{
                  background: 'var(--color-surface-mint)',
                  border: '1px solid var(--color-success-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success-text)', fontWeight: 700, fontSize: '13.5px', marginBottom: '4px' }}>
                  <CheckCircle2 size={16} />
                  <span>1. Application Filed</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Credentials & certificates logged securely.
                </div>
              </div>

              <div
                style={{
                  background: isPending ? '#FEF3E2' : isRejected ? '#FEECEB' : 'var(--color-surface-mint)',
                  border: `1px solid ${isPending ? '#FCD9A5' : isRejected ? '#F9C3C1' : 'var(--color-success-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isPending ? '#B45309' : isRejected ? '#C53030' : 'var(--color-success-text)',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    marginBottom: '4px',
                  }}
                >
                  {isPending ? <Clock size={16} /> : isRejected ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span>2. Council Audit</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {isPending ? 'Under active review by Admin.' : isRejected ? 'Verification declined.' : 'Verified.'}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  opacity: 0.75,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '13.5px', marginBottom: '4px' }}>
                  <ShieldCheck size={16} />
                  <span>3. Clinical Network</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Unlocks full Vet Dashboard after approval.
                </div>
              </div>
            </div>
          </div>

          {/* Submitted Professional Details & Uploaded Documents Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {/* Credentials Card */}
            <div
              style={{
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                background: 'var(--color-bg-card-subtle)',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={15} />
                Practitioner Credentials on Record
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Practitioner:</span>{' '}
                  <strong>{currentUser?.fullName || kycApp?.fullName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>License Number:</span>{' '}
                  <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-border-subtle)' }}>
                    {kycApp?.licenseNumber || 'Under Review'}
                  </code>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Issuing Authority:</span>{' '}
                  <span>{kycApp?.issuingAuthority || 'State Veterinary Council'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Qualification:</span>{' '}
                  <span>{kycApp?.qualification || 'BVSc & AH'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Practice / Clinic:</span>{' '}
                  <span>{kycApp?.clinicName || 'Veterinary Practice'}</span>
                </div>
              </div>
            </div>

            {/* Uploaded Documents Card */}
            <div
              style={{
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                background: 'var(--color-bg-card-subtle)',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} />
                Private Document Vault ({kycApp?.documents?.length || 0} Files)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {kycApp?.documents && kycApp.documents.length > 0 ? (
                  kycApp.documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12.5px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <FileText size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.title || doc.fileName}
                        </span>
                      </div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '11.5px', flexShrink: 0 }}>
                        {doc.fileSize} · Encrypted
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                    Veterinary Registration Certificate & Degree on file.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy & Security Guarantee */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              marginBottom: '24px',
            }}
          >
            <ShieldCheck size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Private Compliance Storage:</strong> Your certificates are encrypted and accessible strictly to authorized compliance officers. No farm operators or other veterinarians can view your license files.
            </span>
          </div>

          {/* Prototype Evaluation Shortcut */}
          <div
            style={{
              background: 'var(--color-surface-mint)',
              border: '1px solid var(--color-success-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <ShieldCheck size={22} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                Statutory Compliance & Administrative Audit
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Your submitted credentials and certificates are securely routed to the BoviCare Compliance Administration. You will receive an official verification confirmation upon statutory council audit.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
