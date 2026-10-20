import React, { useState } from 'react';
import { Bell, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SidebarDrawer from './SidebarDrawer';
import BrandLogo from './BrandLogo';

export default function DashboardHeader({
  avatarInitials = 'RP',
  greetingName = 'Ramesh',
  subtitle = 'Patil Dairy Farm',
  roleBadge = 'Farmer',
  unreadNotifications = 2,
  onOpenNotifications,
  onNavigate,
}) {
  const { logout, currentUser } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <header className="bovicare-topbar">
      <div className="topbar-inner">
        {/* User Identity / Farm Header (Matches Screen 1 of reference collage) */}
        <div className="topbar-user-section">
          {/* Three-line Hamburger Button */}
          <button
            type="button"
            className="topbar-hamburger-btn"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open navigation sidebar"
            title="Navigation Menu"
          >
            <Menu size={20} />
          </button>

          {/* Official BoviCare Brand Logo */}
          <div className="topbar-brand-display" title="BoviCare Dairy Cattle Health">
            <BrandLogo size="header" />
          </div>

          <div className="topbar-avatar" title={`${currentUser?.fullName || greetingName} (${roleBadge})`}>
            {avatarInitials}
          </div>
          <div className="topbar-user-meta">
            <span className="topbar-greeting">Good morning, {greetingName}</span>
            <div className="topbar-subline">
              <span className="topbar-farm-name">{subtitle}</span>
              <span className={`topbar-role-pill role-${roleBadge.toLowerCase()}`}>
                {roleBadge}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Notifications */}
        <div className="topbar-actions">
          {/* Notification Bell */}
          <div className="notification-bell-wrap">
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              aria-label="View notifications"
              title="Notifications"
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="notification-dot" />
              )}
            </button>

            {/* Notification Dropdown preview */}
            {showNotifications && (
              <div className="notifications-dropdown-menu">
                <div className="dropdown-header">
                  <h4>Notifications</h4>
                  {onOpenNotifications ? (
                    <button
                      type="button"
                      className="btn-link-sm"
                      onClick={() => {
                        setShowNotifications(false);
                        onOpenNotifications();
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
                    >
                      View All
                    </button>
                  ) : (
                    <span className="unread-count-tag">{unreadNotifications} new</span>
                  )}
                </div>
                <div className="notifications-list">
                  <div
                    className="notif-item alert"
                    onClick={() => {
                      if (onOpenNotifications) {
                        setShowNotifications(false);
                        onOpenNotifications();
                      }
                    }}
                    style={{ cursor: onOpenNotifications ? 'pointer' : 'default' }}
                  >
                    <span className="notif-bullet red" />
                    <div className="notif-text">
                      <strong>Kaveri · Tag 021</strong>
                      <p>High temperature detected (39.8 °C) — Clinical alert</p>
                    </div>
                  </div>
                  <div
                    className="notif-item watch"
                    onClick={() => {
                      if (onOpenNotifications) {
                        setShowNotifications(false);
                        onOpenNotifications();
                      }
                    }}
                    style={{ cursor: onOpenNotifications ? 'pointer' : 'default' }}
                  >
                    <span className="notif-bullet yellow" />
                    <div className="notif-text">
                      <strong>Vaccination Reminder</strong>
                      <p>FMD booster schedule due for review</p>
                    </div>
                  </div>
                </div>
                {onOpenNotifications && (
                  <button
                    type="button"
                    className="dropdown-footer-link"
                    onClick={() => {
                      setShowNotifications(false);
                      onOpenNotifications();
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--color-surface-mint)',
                      border: 'none',
                      borderTop: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                      textAlign: 'center',
                    }}
                  >
                    Open Notifications Hub →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Profile / Logout Dropdown */}
          <div className="user-menu-wrap">
            <button
              type="button"
              className="user-profile-btn"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              aria-expanded={showProfileMenu}
            >
              <span className="btn-user-name">{currentUser?.fullName || greetingName}</span>
              <ChevronDown size={14} />
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown-menu">
                <div className="profile-dropdown-info">
                  <div className="p-name">{currentUser?.fullName}</div>
                  <div className="p-email">{currentUser?.email}</div>
                  <div className="p-role">Role: <strong>{roleBadge}</strong></div>
                </div>
                <div className="profile-dropdown-divider" />
                <button
                  type="button"
                  className="profile-menu-item logout"
                  onClick={logout}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out Navigation Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={onNavigate}
        roleBadge={roleBadge}
        unreadNotifications={unreadNotifications}
      />
    </header>
  );
}
