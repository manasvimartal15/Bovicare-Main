import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowLeft, LogOut, CheckCircle2, Tractor, Stethoscope } from 'lucide-react';

export default function AdminDashboardView() {
  const { currentUser, logout, navigateTo } = useAuth();

  return (
    <div className="destination-screen-wrapper">
      {/* Top App Bar */}
      <header className="destination-top-bar admin-theme">
        <div className="bar-left">
          <div className="user-avatar-badge admin-avatar">
            {currentUser?.avatarInitials || 'SR'}
          </div>
          <div className="bar-user-info">
            <span className="greeting-sub">Authenticated System Administrator</span>
            <span className="user-name-title">{currentUser?.fullName || 'Sunita Rao'}</span>
            <span className="farm-name-tag">{currentUser?.department || 'Platform Operations'}</span>
          </div>
        </div>

        <div className="bar-right">
          <span className="route-indicator-pill">
            <code>/dashboard/admin</code>
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
            <h3>Admin Role Destination Reached</h3>
            <p>
              Successfully routed to <code>/dashboard/admin</code>. This dashboard will host user access controls, farm registration verification, and AI diagnostics telemetry.
            </p>
          </div>
        </div>

        {/* Feature Overview Card */}
        <div className="step-next-preview-card">
          <div className="preview-header">
            <div className="preview-badge-row">
              <span className="badge-pill-admin">Operations Console</span>
              <span className="badge-step-tag">Step 1 Ready</span>
            </div>
            <h2>Admin Dashboard Destination</h2>
            <p className="preview-sub">
              Centralized tenant, farm registry, and platform configuration.
            </p>
          </div>

          <div className="preview-grid">
            <div className="preview-item">
              <span className="item-num">01</span>
              <h4>Farm Registry & Tenancy</h4>
              <p>Onboard dairy herds, IoT milk meters, and barn sensors</p>
            </div>
            <div className="preview-item">
              <span className="item-num">02</span>
              <h4>Veterinarian Credentials</h4>
              <p>Verify veterinary medical council licenses & regional jurisdictions</p>
            </div>
            <div className="preview-item">
              <span className="item-num">03</span>
              <h4>Diagnostic Model Telemetry</h4>
              <p>Observe AI mastitis classification accuracy and latency stats</p>
            </div>
            <div className="preview-item">
              <span className="item-num">04</span>
              <h4>Security & Audit Logs</h4>
              <p>Track access records, data retention, and compliance reports</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
