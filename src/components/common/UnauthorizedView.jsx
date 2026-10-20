import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UnauthorizedView({ attemptedRole, actualRole }) {
  const { currentUser, navigateTo, logout } = useAuth();

  const formattedActual = actualRole === 'vet' ? 'Veterinarian' : actualRole.charAt(0).toUpperCase() + actualRole.slice(1);
  const formattedAttempted = attemptedRole === 'vet' ? 'Veterinarian' : attemptedRole.charAt(0).toUpperCase() + attemptedRole.slice(1);

  return (
    <div className="unauthorized-page-wrapper">
      <div className="unauthorized-card">
        <div className="unauthorized-icon-badge">
          <ShieldAlert size={42} className="text-danger" />
        </div>

        <div className="unauthorized-text-block">
          <span className="unauthorized-pill">Security & Role Guard</span>
          <h2>Access Restricted: Role Authorization Required</h2>
          <p className="unauthorized-desc">
            You are currently authenticated as <strong>{currentUser?.fullName}</strong> with the <strong>{formattedActual}</strong> role.
          </p>
          <div className="unauthorized-detail-box">
            <p>
              Your account does not possess permissions to access the <strong>{formattedAttempted} Dashboard</strong> (<code>/dashboard/{attemptedRole}</code>).
            </p>
            <span className="unauthorized-security-rule">
              Rule: BoviCare enforces strict role-based authorization. Permissions cannot be elevated simply by altering the navigation route or role selector.
            </span>
          </div>
        </div>

        <div className="unauthorized-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigateTo(`/dashboard/${actualRole}`)}
          >
            <ArrowLeft size={16} />
            <span>Return to My Authorized Dashboard ({formattedActual})</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={logout}
          >
            <LogOut size={16} />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
