import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, ArrowLeft, LogOut, CheckCircle2, Tractor, ShieldCheck } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

export default function VetDashboardView() {
  const { currentUser, logout, navigateTo } = useAuth();

  return (
    <div className="destination-screen-wrapper">
      {/* Top App Bar */}
      <header className="destination-top-bar vet-theme">
        <div className="bar-left">
          <div className="destination-logo-wrap">
            <BrandLogo size="header" />
          </div>
          <div className="user-avatar-badge vet-avatar">
            {currentUser?.avatarInitials || 'RS'}
          </div>
          <div className="bar-user-info">
            <span className="greeting-sub">Authenticated Veterinarian</span>
            <span className="user-name-title">{currentUser?.fullName || 'Dr. Rajesh Sharma'}</span>
            <span className="farm-name-tag">{currentUser?.specialization || 'Bovine Health Specialist'}</span>
          </div>
        </div>

        <div className="bar-right">
          <span className="route-indicator-pill">
            <code>/dashboard/vet</code>
          </span>
          <button
            type="button"
            className="btn-logout"
            onClick={logout}
            title="Sign out and return to role login"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Destination Stage */}
      <main className="destination-container">
        {/* Step 1 Completion Callout */}
        <div className="step-status-card success">
          <div className="status-badge-icon">
            <CheckCircle2 size={24} className="text-success" />
          </div>
          <div className="status-copy">
            <h3>Veterinarian Role Destination Reached</h3>
            <p>
              Successfully routed to <code>/dashboard/vet</code>. This dashboard will house clinical triage, cow health alert assessments, and treatment verification for veterinary practitioners.
            </p>
          </div>
        </div>

        {/* Feature Overview Card */}
        <div className="step-next-preview-card">
          <div className="preview-header">
            <div className="preview-badge-row">
              <span className="badge-pill-vet">Clinical Suite</span>
              <span className="badge-step-tag">Step 1 Ready</span>
            </div>
            <h2>Veterinarian Dashboard Destination</h2>
            <p className="preview-sub">
              Separated destination ready for clinical workflow integration.
            </p>
          </div>

          <div className="preview-grid">
            <div className="preview-item">
              <span className="item-num">01</span>
              <h4>Mastitis Triage Queue</h4>
              <p>Filter scans by confidence score & severity grade</p>
            </div>
            <div className="preview-item">
              <span className="item-num">02</span>
              <h4>Udder Thermal & Visual Analysis</h4>
              <p>Side-by-side inspection of cow imagery & heat mapping</p>
            </div>
            <div className="preview-item">
              <span className="item-num">03</span>
              <h4>Prescriptions & Medical Orders</h4>
              <p>Sign off antibiotic dosages and milk withholding periods</p>
            </div>
            <div className="preview-item">
              <span className="item-num">04</span>
              <h4>Farm Health Audits</h4>
              <p>Review hygiene scores and somatic cell count trends</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
