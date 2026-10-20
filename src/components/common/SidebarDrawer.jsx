import React, { useState, useEffect } from 'react';
import {
  X,
  Home,
  Users,
  Camera,
  FileText,
  Bell,
  Plus,
  Stethoscope,
  Milk,
  Syringe,
  Globe,
  ExternalLink,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Clock,
  Settings,
  Activity,
  BarChart2,
  LayoutDashboard,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useAuth } from '../../context/AuthContext';

export default function SidebarDrawer({
  isOpen,
  onClose,
  onNavigate,
  roleBadge = 'Farmer',
  unreadNotifications = 0,
}) {
  const { currentUser, logout } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  // Close sidebar drawer on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Derive role
  const activeRole = (currentUser?.role || roleBadge || 'farmer').toLowerCase();
  const isFarmer = activeRole === 'farmer';
  const isVet = activeRole === 'vet' || activeRole === 'veterinarian';
  const isAdmin = activeRole === 'admin';

  // Check Vet approval status for role security
  const isVetApproved = isVet && (currentUser?.kycStatus === 'approved' || currentUser?.id === 'user-vet-01' || currentUser?.email === 'vet@bovicare.com');

  const handleActionClick = (targetView, featureName, isProtectedVetFeature = false) => {
    // Role security check for unapproved veterinarians
    if (isVet && isProtectedVetFeature && !isVetApproved) {
      setFeedbackNotice(
        'Access Restricted: Your veterinarian license is currently undergoing Admin KYC review. Clinical tools will unlock once approved.'
      );
      setTimeout(() => setFeedbackNotice(null), 4500);
      return;
    }

    if (onNavigate) {
      onNavigate(targetView);
      onClose();
    } else {
      setFeedbackNotice(`${featureName || targetView} navigation is active.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
    }
  };

  const handleLanguageChange = (langCode, langName) => {
    setSelectedLanguage(langCode);
    setFeedbackNotice(`Language switched to ${langName} (Preview).`);
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  const handleOpenWebsite = () => {
    window.open('https://bovicare.com', '_blank', 'noopener,noreferrer');
  };

  // Subtitle per role
  const subtitle = isFarmer
    ? (currentUser?.farmName || 'Patil Dairy Farm')
    : isVet
    ? (currentUser?.clinicName || 'Western Dairy Veterinary Services')
    : 'Platform Governance & Administration';

  return (
    <div
      className="sidebar-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="BoviCare Navigation Sidebar"
    >
      <aside className="sidebar-drawer" onClick={(e) => e.stopPropagation()}>
        {/* 1. Header with Logo and Close Button */}
        <div className="sidebar-header">
          <BrandLogo size="small" showTagline={true} />
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Notice Toast inside sidebar */}
        {feedbackNotice && (
          <div className="sidebar-notice-toast">
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="sidebar-scrollable-body">
          {/* 2. User Identity Strip */}
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {currentUser?.avatarInitials || (isFarmer ? 'RP' : isVet ? 'RS' : 'SR')}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">
                {currentUser?.fullName || (isFarmer ? 'Ramesh Patil' : isVet ? 'Dr. Rajesh Sharma' : 'Sunita Rao')}
              </span>
              <span className="sidebar-user-sub">{subtitle}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <span className={`topbar-role-pill role-${activeRole === 'vet' ? 'veterinarian' : activeRole}`}>
                  {isFarmer ? 'Farmer' : isVet ? 'Veterinarian' : 'Admin'}
                </span>
                {isVet && (
                  <span
                    className={`badge-pill ${isVetApproved ? 'healthy' : 'watch'}`}
                    style={{ fontSize: '10px', padding: '1px 6px' }}
                  >
                    {isVetApproved ? 'Verified' : 'KYC Pending'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Primary Action Button for Farmer (+ Add Cow) */}
          {isFarmer && (
            <button
              type="button"
              className="sidebar-btn-add-cow"
              onClick={() => handleActionClick('add-cow', 'Add Cow')}
            >
              <Plus size={16} />
              <span>+ Add New Cow</span>
            </button>
          )}

          {/* 4. Main Navigation Section (Role-Filtered) */}
          <div className="sidebar-nav-group">
            <span className="sidebar-group-title">MAIN NAVIGATION</span>
            <div className="sidebar-links-list">
              <button
                type="button"
                className="sidebar-nav-link"
                onClick={() => handleActionClick('dashboard', 'Dashboard Home')}
              >
                <div className="sidebar-link-icon">
                  <Home size={18} />
                </div>
                <span>Dashboard Home</span>
              </button>

              {/* Farmer Navigation Items */}
              {isFarmer && (
                <>
                  <button
                    type="button"
                    className="sidebar-nav-link"
                    onClick={() => handleActionClick('my-cows', 'My Cows')}
                  >
                    <div className="sidebar-link-icon">
                      <Users size={18} />
                    </div>
                    <span>My Cows Roster</span>
                  </button>

                  <button
                    type="button"
                    className="sidebar-nav-link"
                    onClick={() => handleActionClick('assess', 'Mastitis Health Check')}
                  >
                    <div className="sidebar-link-icon">
                      <Camera size={18} />
                    </div>
                    <span>Udder Health Check</span>
                  </button>

                  <button
                    type="button"
                    className="sidebar-nav-link"
                    onClick={() => handleActionClick('records', 'Health Records')}
                  >
                    <div className="sidebar-link-icon">
                      <FileText size={18} />
                    </div>
                    <span>Health Records Hub</span>
                  </button>
                </>
              )}

              {/* Veterinarian Navigation Items */}
              {isVet && (
                <>
                  <button
                    type="button"
                    className="sidebar-nav-link"
                    onClick={() => handleActionClick('appointments', 'Appointments', true)}
                  >
                    <div className="sidebar-link-icon">
                      <Calendar size={18} />
                    </div>
                    <span>Clinical Appointments</span>
                  </button>

                  <button
                    type="button"
                    className="sidebar-nav-link"
                    onClick={() => handleActionClick('records', 'Authorized Cow Records', true)}
                  >
                    <div className="sidebar-link-icon">
                      <FileText size={18} />
                    </div>
                    <span>Patient Health Records</span>
                  </button>
                </>
              )}

              {/* Admin Navigation Items */}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    className="sidebar-nav-link"
                    onClick={() => handleActionClick('users', 'User Management')}
                  >
                    <div className="sidebar-link-icon">
                      <Users size={18} />
                    </div>
                    <span>User Management</span>
                  </button>

                  <button
                    type="button"
                    className="sidebar-nav-link"
                    onClick={() => handleActionClick('appointments', 'Platform Consultations')}
                  >
                    <div className="sidebar-link-icon">
                      <Calendar size={18} />
                    </div>
                    <span>Appointments Overview</span>
                  </button>
                </>
              )}

              {/* Notifications Link (All Roles) */}
              <button
                type="button"
                className="sidebar-nav-link"
                onClick={() => handleActionClick('notifications', 'Notifications')}
              >
                <div className="sidebar-link-icon">
                  <Bell size={18} />
                </div>
                <span>Notifications & Alerts</span>
                {unreadNotifications > 0 && (
                  <span className="sidebar-badge-count">{unreadNotifications}</span>
                )}
              </button>
            </div>
          </div>

          {/* 5. ROLE-SPECIFIC QUICK ACCESS SECTION */}
          <div className="sidebar-nav-group quick-access-group">
            <div className="sidebar-group-header-row">
              <span className="sidebar-group-title">QUICK ACCESS</span>
              <span className="sidebar-group-subtitle">
                {isFarmer ? 'Farmer Shortcuts' : isVet ? 'Clinical Shortcuts' : 'Admin Shortcuts'}
              </span>
            </div>

            {/* FARMER QUICK ACCESS SHORTCUTS */}
            {isFarmer && (
              <div className="sidebar-quick-access-list">
                {/* 1. Add Cow */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('add-cow', 'Add Cow')}
                  title="Register a new cow to your herd"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Plus size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Add Cow</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 2. Health Check */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('assess', 'Health Check')}
                  title="Mastitis udder screening & AI camera analysis"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Camera size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Health Check</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 3. Book a Vet */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('book-vet', 'Book a Vet')}
                  title="Schedule consultation with an approved veterinarian"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Stethoscope size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Book a Vet</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 4. Milk Log */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('milk-log', 'Milk Log')}
                  title="Log morning and evening milk production"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Milk size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Milk Log</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 5. Health Records */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('records', 'Health Records')}
                  title="View complete health history and diagnosis logs"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <FileText size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Health Records</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 6. Vaccination */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('vaccine', 'Vaccination')}
                  title="Immunization schedules & clinical care"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Syringe size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Vaccination</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>
              </div>
            )}

            {/* VETERINARIAN QUICK ACCESS SHORTCUTS */}
            {isVet && (
              <div className="sidebar-quick-access-list">
                {/* 1. Appointments */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('appointments', 'Appointments', true)}
                  title="Manage incoming consultation requests & triage"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Calendar size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Appointments</span>
                  </div>
                  {isVetApproved ? (
                    <ChevronRight size={14} className="shortcut-chevron" />
                  ) : (
                    <Lock size={12} style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </button>

                {/* 2. Farmer/Cow Records (Authorized only) */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('records', 'Farmer/Cow Records', true)}
                  title="Access authorized clinical health records"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <FileText size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Farmer/Cow Records</span>
                  </div>
                  {isVetApproved ? (
                    <ChevronRight size={14} className="shortcut-chevron" />
                  ) : (
                    <Lock size={12} style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </button>

                {/* 3. KYC / Verification Status */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('kyc-status', 'KYC / Verification Status')}
                  title="View statutory license and credential status"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <ShieldCheck size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">KYC / Verification Status</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 4. Manage Availability */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('availability', 'Manage Availability', true)}
                  title="Configure working days and consultation time slots"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Clock size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Manage Availability</span>
                  </div>
                  {isVetApproved ? (
                    <ChevronRight size={14} className="shortcut-chevron" />
                  ) : (
                    <Lock size={12} style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </button>

                {/* 5. Notifications */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('notifications', 'Notifications')}
                  title="Clinical alerts and farm consultation requests"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Bell size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Notifications</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>
              </div>
            )}

            {/* ADMIN QUICK ACCESS SHORTCUTS */}
            {isAdmin && (
              <div className="sidebar-quick-access-list">
                {/* 1. Dashboard */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('dashboard', 'Dashboard')}
                  title="System telemetry and platform metrics"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <LayoutDashboard size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Dashboard</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 2. Vet KYC Approvals */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('kyc-approvals', 'Vet KYC Approvals')}
                  title="Review veterinarian licenses & verification queue"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <ShieldCheck size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Vet KYC Approvals</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 3. User Management */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('users', 'User Management')}
                  title="Manage farmer, vet, and administrative accounts"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Users size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">User Management</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 4. Appointment Management */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('appointments', 'Appointment Management')}
                  title="District-wide consultations audit and oversight"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Calendar size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Appointment Management</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 5. Reports/Analytics */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('analytics', 'Reports/Analytics')}
                  title="Platform telemetry, health trends & audit logs"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <BarChart2 size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Reports/Analytics</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>

                {/* 6. Settings */}
                <button
                  type="button"
                  className="sidebar-shortcut-row"
                  onClick={() => handleActionClick('settings', 'Settings')}
                  title="Platform configuration, sensor gateways & quotas"
                >
                  <div className="shortcut-left">
                    <div className="shortcut-icon-tile">
                      <Settings size={16} strokeWidth={2} />
                    </div>
                    <span className="shortcut-title">Settings</span>
                  </div>
                  <ChevronRight size={14} className="shortcut-chevron" />
                </button>
              </div>
            )}
          </div>

          {/* 6. Language Selector */}
          <div className="sidebar-nav-group">
            <div className="sidebar-group-header-row">
              <span className="sidebar-group-title">LANGUAGE</span>
              <Globe size={13} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="sidebar-lang-pills">
              <button
                type="button"
                className={`sidebar-lang-pill ${selectedLanguage === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en', 'English')}
              >
                English
              </button>
              <button
                type="button"
                className={`sidebar-lang-pill ${selectedLanguage === 'mr' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('mr', 'मराठी')}
              >
                मराठी
              </button>
              <button
                type="button"
                className={`sidebar-lang-pill ${selectedLanguage === 'hi' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('hi', 'हिंदी')}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* 8. System & Account Links */}
          <div className="sidebar-nav-group" style={{ borderBottom: 'none' }}>
            <span className="sidebar-group-title">SYSTEM</span>
            <div className="sidebar-links-list">
              <button
                type="button"
                className="sidebar-nav-link"
                onClick={handleOpenWebsite}
                title="Open official BoviCare website"
              >
                <div className="sidebar-link-icon">
                  <Globe size={18} />
                </div>
                <span>BoviCare Website</span>
                <ExternalLink size={13} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} />
              </button>

              <button
                type="button"
                className="sidebar-nav-link logout-link"
                onClick={logout}
                title="Sign out and return to role selection"
              >
                <div className="sidebar-link-icon">
                  <LogOut size={18} />
                </div>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
