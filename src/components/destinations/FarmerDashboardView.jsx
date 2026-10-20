import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Tractor, ArrowLeft, LogOut, CheckCircle2, AlertTriangle, ShieldCheck, Stethoscope, Sparkles } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

export default function FarmerDashboardView() {
  const { currentUser, logout, navigateTo } = useAuth();

  return (
    <div className="destination-screen-wrapper">
      {/* Top App Bar resembling Screen 1 from collage */}
      <header className="destination-top-bar">
        <div className="bar-left">
          <div className="user-avatar-badge">
            {currentUser?.avatarInitials || 'RP'}
          </div>
          <div className="bar-user-info">
            <span className="greeting-sub">Authenticated Dairy Farmer</span>
            <span className="user-name-title">{currentUser?.fullName || 'Ramesh Patil'}</span>
            <span className="farm-name-tag">{currentUser?.farmName || 'Patil Dairy Farm'}</span>
          </div>
        </div>

        <div className="bar-right">
          <span className="route-indicator-pill">
            <code>/dashboard/farmer</code>
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
            <h3>Step 1 Complete: Login & Farmer Role Routing Successful</h3>
            <p>
              You have authenticated as <strong>{currentUser?.fullName}</strong> with the <strong>Farmer</strong> role. The role router has routed you to the <code>/dashboard/farmer</code> destination.
            </p>
          </div>
        </div>

        {/* Next Step Preview Card */}
        <div className="step-next-preview-card">
          <div className="preview-header">
            <div className="preview-badge-row">
              <span className="badge-pill-alert">Awaiting Approval</span>
              <span className="badge-step-tag">Next: Step 2</span>
            </div>
            <h2>Farmer Dashboard (Screen 1 & 2 in Reference)</h2>
            <p className="preview-sub">
              As per instructions, internal dashboard pages will be built upon your approval in Step 2.
            </p>
          </div>

          <div className="preview-grid">
            <div className="preview-item">
              <span className="item-num">01</span>
              <h4>Herd Health Status</h4>
              <p>21 of 24 cows healthy, watch and alert summaries</p>
            </div>
            <div className="preview-item">
              <span className="item-num">02</span>
              <h4>Quick Action Grid</h4>
              <p>Assess, Milk Log, Fever, and Vaccine actions</p>
            </div>
            <div className="preview-item">
              <span className="item-num">03</span>
              <h4>Needs Attention Alert</h4>
              <p>Critical cow health warnings (e.g. Kaveri Tag 021)</p>
            </div>
            <div className="preview-item">
              <span className="item-num">04</span>
              <h4>Bottom Navigation</h4>
              <p>Home, My Cows, Assess, Records, and Profile</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
