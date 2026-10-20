import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Syringe,
  Activity,
  Info,
  CheckCheck,
  ChevronRight,
  Filter,
  ExternalLink,
  ShieldCheck,
  Tractor
} from 'lucide-react';
import { useCows } from '../../context/CowsContext';
import {
  generateHerdNotifications,
  getReadNotificationIds,
  saveReadNotificationIds,
} from '../../services/notificationService';

export default function NotificationsPage({
  onBack,
  onOpenCowProfile,
  onOpenCowRecords,
  roleContext = 'farmer',
}) {
  const { cows } = useCows();

  // Read notification IDs stored locally
  const [readIds, setReadIds] = useState(() => getReadNotificationIds());

  // Filter state: 'all' | 'unread' | 'vaccines' | 'followup'
  const [activeFilter, setActiveFilter] = useState('all');
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Synchronize read notification IDs to localStorage
  useEffect(() => {
    saveReadNotificationIds(readIds);
  }, [readIds]);

  // Dynamically compute real notifications from registered herd data
  const rawNotifications = useMemo(() => {
    return generateHerdNotifications(cows);
  }, [cows]);

  // Enrich with read status
  const allNotifications = useMemo(() => {
    return rawNotifications.map((notif) => ({
      ...notif,
      isRead: readIds.includes(notif.id),
    }));
  }, [rawNotifications, readIds]);

  // Apply active category / unread filter
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((notif) => {
      if (activeFilter === 'unread') {
        return !notif.isRead;
      }
      if (activeFilter === 'vaccines') {
        return notif.category === 'vaccine';
      }
      if (activeFilter === 'followup') {
        return notif.category === 'followup';
      }
      return true;
    });
  }, [allNotifications, activeFilter]);

  // Counts
  const counts = useMemo(() => {
    const unreadCount = allNotifications.filter((n) => !n.isRead).length;
    const vaccineCount = allNotifications.filter((n) => n.category === 'vaccine').length;
    const followupCount = allNotifications.filter((n) => n.category === 'followup').length;
    return {
      all: allNotifications.length,
      unread: unreadCount,
      vaccines: vaccineCount,
      followup: followupCount,
    };
  }, [allNotifications]);

  // Toggle single notification read status
  const toggleReadStatus = (id) => {
    setReadIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Mark all as read
  const markAllAsRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    setReadIds(allIds);
    setFeedbackToast('All notifications marked as read.');
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  return (
    <div className="notifications-page-wrapper">
      {/* Top Header */}
      <header className="page-nav-header">
        <div className="nav-header-inner">
          <div className="nav-left">
            <button
              type="button"
              className="nav-back-btn"
              onClick={onBack}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="nav-titles">
              <h1 className="nav-page-title">Notifications</h1>
              <p className="nav-page-subtitle">Herd immunization reminders & clinical follow-ups</p>
            </div>
          </div>

          <div className="header-actions-group">
            {counts.unread > 0 && (
              <button
                type="button"
                className="btn-header-action"
                onClick={markAllAsRead}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="notifications-main-container">
        {/* Prototype Storage & Notification Capability Disclaimer */}
        <div className="prototype-disclaimer-card" role="note">
          <Info size={16} className="disclaimer-icon" />
          <div>
            <strong>In-App Reminders:</strong> Alerts are derived directly from your registered cows' vaccination dates and clinical temperature logs. Browser push notifications and cloud SMS alerts are not enabled.
          </div>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="floating-feedback-toast" role="status">
            <CheckCircle2 size={16} />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="filter-tabs-strip" role="tablist" aria-label="Notification Filters">
          <button
            type="button"
            className={`filter-tab-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span>All Updates</span>
            <span className="pill-counter">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${activeFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            <Bell size={13} />
            <span>Unread</span>
            <span className="pill-counter">{counts.unread}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${activeFilter === 'vaccines' ? 'active' : ''}`}
            onClick={() => setActiveFilter('vaccines')}
          >
            <Syringe size={13} />
            <span>Vaccinations</span>
            <span className="pill-counter">{counts.vaccines}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-pill ${activeFilter === 'followup' ? 'active' : ''}`}
            onClick={() => setActiveFilter('followup')}
          >
            <Activity size={13} />
            <span>Clinical Follow-ups</span>
            <span className="pill-counter">{counts.followup}</span>
          </button>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="notifications-stack">
            {filteredNotifications.map((notif) => {
              const isAlert = notif.urgency === 'alert';
              const isWatch = notif.urgency === 'watch';

              return (
                <div
                  key={notif.id}
                  className={`notification-card ${notif.isRead ? 'read' : 'unread'} ${notif.urgency}`}
                >
                  <div className="notif-card-header">
                    <div className="notif-header-left">
                      <div className={`notif-icon-wrap ${notif.category === 'vaccine' ? 'vaccine' : notif.urgency}`}>
                        {notif.category === 'vaccine' && <Syringe size={18} />}
                        {notif.category === 'followup' && isAlert && <AlertTriangle size={18} />}
                        {notif.category === 'followup' && isWatch && <Activity size={18} />}
                      </div>

                      <div className="notif-meta-col">
                        <div className="notif-title-row">
                          <h4 className="notif-title">{notif.title}</h4>
                          {!notif.isRead && <span className="notif-unread-dot" title="Unread notification" />}
                          <span className={`badge-pill ${notif.urgency}`}>
                            {notif.type === 'overdue'
                              ? 'Overdue'
                              : notif.type === 'due-today'
                              ? 'Due Today'
                              : notif.type === 'upcoming'
                              ? 'Upcoming'
                              : 'Review Needed'}
                          </span>
                        </div>
                        <span className="notif-date-sub">{notif.dateLabel}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-mark-read-toggle"
                      onClick={() => toggleReadStatus(notif.id)}
                      title={notif.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      <CheckCircle2 size={13} />
                      <span>{notif.isRead ? 'Read' : 'Mark Read'}</span>
                    </button>
                  </div>

                  <p className="notif-body-text">{notif.message}</p>

                  <div className="notif-card-actions">
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Cow: <strong>{notif.cowName}</strong> ({notif.tagId})
                    </span>

                    <div style={{ display: 'flex', gap: 12 }}>
                      {onOpenCowRecords && (
                        <button
                          type="button"
                          className="btn-notif-action-link"
                          onClick={() => onOpenCowRecords(notif.cowId)}
                        >
                          <span>{notif.actionLabel || 'View Record'}</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                      {onOpenCowProfile && (
                        <button
                          type="button"
                          className="btn-notif-action-link"
                          onClick={() => onOpenCowProfile(notif.cowId)}
                        >
                          <span>Cow Profile</span>
                          <ExternalLink size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="records-empty-state-card">
            <div className="empty-state-icon-box">
              <CheckCircle2 size={26} />
            </div>
            <h4 className="empty-state-title">
              {activeFilter === 'unread'
                ? 'All Caught Up!'
                : activeFilter === 'vaccines'
                ? 'No Vaccination Alerts'
                : activeFilter === 'followup'
                ? 'No Pending Follow-ups'
                : 'No Notifications Available'}
            </h4>
            <p className="empty-state-desc">
              {activeFilter === 'unread'
                ? 'You have reviewed all current health reminders and schedule notices. All herd alerts are marked as read.'
                : activeFilter === 'vaccines'
                ? 'No registered cows have upcoming or overdue vaccination dates at this time.'
                : activeFilter === 'followup'
                ? 'No cows in your herd are flagged for urgent temperature review or observation.'
                : 'There are no active reminders or clinical alerts recorded for your dairy herd.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
