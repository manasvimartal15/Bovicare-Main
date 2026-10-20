import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Activity,
  Plus,
  Info,
  ShieldCheck,
  FileText,
  X,
  AlertTriangle,
  Stethoscope,
  Tractor,
  Lock,
  Eye,
  Milk,
  Search,
  Check,
} from 'lucide-react';
import DashboardHeader from '../common/DashboardHeader';
import DashboardHeroBanner from '../common/DashboardHeroBanner';
import { VET_DEMO_DATA } from '../../data/dashboardData';
import { useCows } from '../../context/CowsContext';
import { useAuth } from '../../context/AuthContext';
import CowProfilePage from '../cows/CowProfilePage';
import HealthRecordsPage from '../records/HealthRecordsPage';
import NotificationsPage from '../notifications/NotificationsPage';
import VetAppointmentsSection from '../appointments/VetAppointmentsSection';
import VetAvailabilityModal from '../appointments/VetAvailabilityModal';
import { getKycByEmail } from '../../services/kycService';
import { getAppointmentsForVet, APPOINTMENT_STATUS } from '../../services/appointmentService';
import { generateHerdNotifications, getReadNotificationIds } from '../../services/notificationService';
import CowAvatar from '../common/CowAvatar';

export default function VetDashboard() {
  const data = VET_DEMO_DATA;
  const { cows } = useCows();
  const { currentUser } = useAuth();
  const [selectedCowId, setSelectedCowId] = useState(null);
  const [recordsCowId, setRecordsCowId] = useState(null);
  const [currentVetView, setCurrentVetView] = useState('dashboard');
  const [noticeMessage, setNoticeMessage] = useState(null);
  const [cowFilter, setCowFilter] = useState('all'); // 'all' | 'healthy' | 'alert'
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0);

  // Farms Directory & Clinical Rx states
  const [isFarmsDirectoryOpen, setIsFarmsDirectoryOpen] = useState(false);
  const [selectedFarmDetail, setSelectedFarmDetail] = useState(null);
  const [farmSearchQuery, setFarmSearchQuery] = useState('');
  const [farmFilter, setFarmFilter] = useState('all');
  const [prescribingCase, setPrescribingCase] = useState(null);
  const [rxNotes, setRxNotes] = useState('');
  const [rxMedication, setRxMedication] = useState('');
  const [rxWithholding, setRxWithholding] = useState('72');
  const [treatedCaseIds, setTreatedCaseIds] = useState([]);

  // Availability & KYC Verification Modals
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  // Vet KYC Application Data
  const vetEmail = currentUser?.email || 'vet@bovicare.com';
  const vetKycData = useMemo(() => {
    return getKycByEmail(vetEmail);
  }, [vetEmail]);

  const vetKycStatus = vetKycData?.status || 'approved';
  const isKycApproved = vetKycStatus === 'approved';

  // Real Appointments for this authenticated veterinarian
  const vetAppointments = useMemo(() => {
    return getAppointmentsForVet(vetEmail, currentUser?.id);
  }, [vetEmail, currentUser, appointmentsRefreshKey]);

  // Today's date in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Summary Metrics computed from actual appointments
  const pendingAptsCount = useMemo(() => {
    return vetAppointments.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length;
  }, [vetAppointments]);

  const todayAptsCount = useMemo(() => {
    return vetAppointments.filter(
      (a) =>
        a.date === todayStr &&
        [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED].includes(a.status)
    ).length;
  }, [vetAppointments, todayStr]);

  const upcomingAptsCount = useMemo(() => {
    return vetAppointments.filter(
      (a) =>
        a.date >= todayStr &&
        [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED].includes(a.status)
    ).length;
  }, [vetAppointments, todayStr]);

  const completedAptsCount = useMemo(() => {
    return vetAppointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length;
  }, [vetAppointments]);

  // Filtered cows for authorized records section
  const filteredCows = useMemo(() => {
    return cows.filter((c) => {
      if (cowFilter === 'all') return true;
      if (cowFilter === 'healthy') return c.status === 'healthy';
      if (cowFilter === 'alert') return c.status === 'alert' || c.status === 'watch';
      return true;
    });
  }, [cows, cowFilter]);

  // Recent consultation activity feed
  const recentConsultationActivity = useMemo(() => {
    const events = [];

    vetAppointments.forEach((apt) => {
      events.push({
        id: `apt-${apt.id}`,
        type: 'consultation',
        title: `${apt.visitType || 'Clinical Consultation'}`,
        description: `Patient: ${apt.cowName} (Tag: ${apt.cowTag}) · Farm: ${apt.farmName || 'Dairy Farm'} (Farmer: ${apt.farmerName})`,
        date: apt.date,
        time: apt.timeSlot,
        status: apt.status,
        cowId: apt.cowId,
      });
    });

    // Also include recommendations if available
    (data.recommendations || []).forEach((rec) => {
      events.push({
        id: `rec-${rec.id}`,
        type: 'directive',
        title: `Clinical Directive · ${rec.cow}`,
        description: `${rec.action} (Farm: ${rec.farm})`,
        date: rec.date || 'Recent',
        time: null,
        status: 'completed',
        cowId: null,
      });
    });

    return events.slice(0, 5);
  }, [vetAppointments, data.recommendations]);

  // Dynamic notifications for vet review
  const allNotifs = useMemo(() => generateHerdNotifications(cows), [cows]);
  const readIds = getReadNotificationIds();
  const unreadNotifCount = allNotifs.filter((n) => !readIds.includes(n.id)).length;

  const showClinicalLockedNotice = (actionTitle) => {
    setNoticeMessage(`Clinical Action Locked: ${actionTitle} requires verified & approved veterinary council credentials.`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const showStep2Notice = (actionTitle) => {
    setNoticeMessage(`${actionTitle} feature is scheduled for subsequent steps upon approval.`);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  // If viewing a cow clinical profile
  if (selectedCowId) {
    return (
      <CowProfilePage
        cowId={selectedCowId}
        onBack={() => setSelectedCowId(null)}
        onOpenRecords={(cowId) => {
          setSelectedCowId(null);
          setRecordsCowId(cowId);
          setCurrentVetView('records');
        }}
        roleContext="vet"
      />
    );
  }

  // If viewing Health Records
  if (currentVetView === 'records') {
    return (
      <HealthRecordsPage
        initialCowId={recordsCowId}
        onBack={() => setCurrentVetView('dashboard')}
        onOpenCowProfile={(cowId) => {
          setCurrentVetView('dashboard');
          setSelectedCowId(cowId);
        }}
        roleContext="vet"
      />
    );
  }

  // If viewing Notifications Hub
  if (currentVetView === 'notifications') {
    return (
      <NotificationsPage
        onBack={() => setCurrentVetView('dashboard')}
        onOpenCowProfile={(cowId) => {
          setCurrentVetView('dashboard');
          setSelectedCowId(cowId);
        }}
        onOpenCowRecords={(cowId) => {
          setRecordsCowId(cowId);
          setCurrentVetView('records');
        }}
        roleContext="vet"
      />
    );
  }

  return (
    <div className="dashboard-page-layout vet-theme">
      {/* Top Header */}
      <DashboardHeader
        avatarInitials={currentUser?.avatarInitials || 'RS'}
        greetingName={currentUser?.fullName || 'Dr. Rajesh Sharma'}
        subtitle={vetKycData?.clinicName || data.clinic}
        roleBadge="Veterinarian"
        unreadNotifications={unreadNotifCount}
        onOpenNotifications={() => setCurrentVetView('notifications')}
        onNavigate={(view) => {
          if (view === 'dashboard' || view === 'home') {
            setCurrentVetView('dashboard');
            setSelectedCowId(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (view === 'appointments') {
            setCurrentVetView('dashboard');
            setSelectedCowId(null);
            setTimeout(() => {
              document.getElementById('vet-appointments-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 80);
          } else if (view === 'records') {
            setCurrentVetView('records');
            setSelectedCowId(null);
          } else if (view === 'availability') {
            if (!isKycApproved) {
              showClinicalLockedNotice('Availability Scheduling');
            } else {
              setIsAvailabilityModalOpen(true);
            }
          } else if (view === 'kyc-status') {
            setIsKycModalOpen(true);
          } else if (view === 'notifications') {
            setCurrentVetView('notifications');
            setSelectedCowId(null);
          } else {
            showStep2Notice(`Clinical Tool: ${view}`);
          }
        }}
      />

      <main className="dashboard-main-content">
        {/* Step Notification Toast */}
        {noticeMessage && (
          <div className="floating-feedback-toast" role="status">
            <Info size={16} />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Hero Clinical Banner */}
        <DashboardHeroBanner
          title={
            isKycApproved
              ? `${pendingAptsCount > 0 ? `${pendingAptsCount} Consultations Awaiting Your Review` : `${data.assignedSummary.urgentCases} Cases Requiring Clinical Review`}`
              : 'Veterinary Account Pending Credential Verification'
          }
          subtitle={
            isKycApproved
              ? 'Authorized for bovine diagnosis, AI mastitis verification, and farm consultation bookings.'
              : 'Statutory veterinary documents are under administrative audit. Protected clinical actions are temporarily restricted.'
          }
          actionText={isKycApproved ? 'View Schedule & Requests' : 'Check KYC Status'}
          onActionClick={() => {
            if (isKycApproved) {
              document.getElementById('vet-appointments-section')?.scrollIntoView({ behavior: 'smooth' });
            } else {
              setIsKycModalOpen(true);
            }
          }}
          statusItems={[
            { type: isKycApproved ? 'healthy' : 'watch', label: isKycApproved ? 'License Verified' : 'KYC Pending' },
            { type: pendingAptsCount > 0 ? 'alert' : 'healthy', label: `${pendingAptsCount} Pending Requests` },
            { type: 'healthy', label: `${todayAptsCount} Today's Schedule` },
          ]}
          bannerTheme="vet"
        />

        {/* Prominent Veterinarian KYC Verification Status Card */}
        <div className={`vet-kyc-status-card ${vetKycStatus}`}>
          <div className="kyc-status-left">
            <div className={`kyc-status-icon-box ${vetKycStatus}`}>
              {isKycApproved ? (
                <ShieldCheck size={24} />
              ) : vetKycStatus === 'rejected' ? (
                <AlertTriangle size={24} />
              ) : (
                <Clock size={24} />
              )}
            </div>
            <div className="kyc-status-info">
              <div className="kyc-status-title-row">
                <span className="kyc-status-title">
                  {isKycApproved
                    ? 'State Veterinary Council License Verified & Approved'
                    : vetKycStatus === 'rejected'
                    ? 'Veterinary Credential Review Declined'
                    : 'Veterinary Council Registration & KYC Verification Pending'}
                </span>
                <span
                  className={`badge-pill ${
                    isKycApproved ? 'healthy' : vetKycStatus === 'rejected' ? 'alert' : 'watch'
                  }`}
                >
                  {isKycApproved
                    ? 'Active Practice'
                    : vetKycStatus === 'rejected'
                    ? 'Action Required'
                    : 'Pending Admin Review'}
                </span>
              </div>
              <p className="kyc-status-meta">
                {isKycApproved ? (
                  <>
                    Council License: <strong>{vetKycData?.licenseNumber || 'VET-MH-2019-441'}</strong> ·{' '}
                    Issuing Authority: <strong>{vetKycData?.issuingAuthority || 'Maharashtra State Veterinary Council'}</strong> ·{' '}
                    Qualification: <strong>{vetKycData?.qualification || 'BVSc & AH, MVSc'}</strong>
                  </>
                ) : vetKycStatus === 'rejected' ? (
                  <>
                    Application was declined by Platform Admin: <em>{vetKycData?.rejectionReason || 'Document clarification required.'}</em>. Protected clinical features are restricted until credentials are rectified.
                  </>
                ) : (
                  <>
                    Submitted council license <strong>{vetKycData?.licenseNumber || 'Under Review'}</strong> is currently in the Administrative verification queue. Access to clinical sign-offs and consultation bookings will unlock upon approval.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="kyc-status-right">
            <button
              type="button"
              className="btn-action-outline-sm"
              onClick={() => setIsKycModalOpen(true)}
            >
              <FileText size={13} />
              <span>View Credential Details</span>
            </button>
          </div>
        </div>

        {/* Protection Banner: Non-Approved Veterinarian Lockout */}
        {!isKycApproved && (
          <div className="alert-highlight-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#FEECEB',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Lock size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#991B1B' }}>
                  Protected Clinical Features Restricted
                </div>
                <div style={{ fontSize: '12px', color: '#7F1D1D' }}>
                  Under veterinary statutory regulations, approving farmer appointments, confirming clinical diagnoses, and issuing official treatment directives require verified council credentials.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-action-outline-sm"
              style={{ borderColor: '#DC2626', color: '#DC2626', flexShrink: 0 }}
              onClick={() => setIsKycModalOpen(true)}
            >
              Audit Status
            </button>
          </div>
        )}

        {/* 1. Summary Cards Grid (Matching Farmer Dashboard's Visual Quality) */}
        <section
          className="farm-summary-cards-grid"
          aria-label="Veterinary Consultations and Schedule Summary"
        >
          {/* 1. Pending Appointment Requests */}
          <div
            className="farm-summary-card"
            onClick={() => {
              document.getElementById('vet-appointments-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            title="Review pending consultation requests"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box attention">
                <Clock size={20} />
              </div>
              {pendingAptsCount > 0 && <span className="summary-badge-indicator attention" />}
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{pendingAptsCount}</span>
              <span className="summary-card-label">Pending Requests</span>
              <span className="summary-card-sub">
                {pendingAptsCount > 0 ? 'Awaiting clinical review' : 'All requests reviewed'}
              </span>
            </div>
          </div>

          {/* 2. Today's Appointments */}
          <div
            className="farm-summary-card"
            onClick={() => {
              document.getElementById('vet-appointments-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            title="View today's scheduled consultations"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box total">
                <Calendar size={20} />
              </div>
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{todayAptsCount}</span>
              <span className="summary-card-label">Today's Schedule</span>
              <span className="summary-card-sub">
                {todayAptsCount > 0 ? `${todayAptsCount} visits scheduled today` : 'No visits scheduled today'}
              </span>
            </div>
          </div>

          {/* 3. Upcoming Appointments */}
          <div
            className="farm-summary-card"
            onClick={() => {
              document.getElementById('vet-appointments-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            title="View confirmed upcoming consultations"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box healthy">
                <Stethoscope size={20} />
              </div>
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{upcomingAptsCount}</span>
              <span className="summary-card-label">Upcoming Schedule</span>
              <span className="summary-card-sub">
                {upcomingAptsCount > 0 ? 'Confirmed farm & clinic visits' : 'No upcoming bookings'}
              </span>
            </div>
          </div>

          {/* 4. Completed Consultations */}
          <div
            className="farm-summary-card"
            onClick={() => {
              document.getElementById('vet-appointments-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            title="View completed consultations"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box healthy">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{completedAptsCount}</span>
              <span className="summary-card-label">Completed</span>
              <span className="summary-card-sub">
                {completedAptsCount > 0 ? `${completedAptsCount} visits concluded` : 'No completed visits yet'}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Appointment Schedule Section */}
        <div id="vet-appointments-section" style={{ marginBottom: '32px' }}>
          <VetAppointmentsSection
            onOpenCowProfile={(cowId) => setSelectedCowId(cowId)}
            onAppointmentsUpdated={() => setAppointmentsRefreshKey((k) => k + 1)}
            isKycApproved={isKycApproved}
          />
        </div>

        {/* 3. Authorized Farmer / Cow Records Section */}
        <section className="dashboard-section" aria-label="Authorized Herd Clinical Records">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Authorized Bovine Patients & Herds</h3>
              <p className="section-subtitle">
                Clinical records of registered cattle under veterinary supervision
              </p>
            </div>
            <div className="cows-filter-pills" role="tablist">
              <button
                type="button"
                className={`filter-pill ${cowFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCowFilter('all')}
              >
                All Herds ({cows.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${cowFilter === 'healthy' ? 'active' : ''}`}
                onClick={() => setCowFilter('healthy')}
              >
                Healthy ({cows.filter((c) => c.status === 'healthy').length})
              </button>
              <button
                type="button"
                className={`filter-pill ${cowFilter === 'alert' ? 'active' : ''}`}
                onClick={() => setCowFilter('alert')}
              >
                Alert / Watch ({cows.filter((c) => c.status === 'alert' || c.status === 'watch').length})
              </button>
            </div>
          </div>

          {filteredCows.length > 0 ? (
            <div className="cows-list-grid">
              {filteredCows.map((cow) => {
                const latestMilk =
                  cow.milkLogs?.[0]?.totalMilk != null
                    ? `${cow.milkLogs[0].totalMilk} L`
                    : cow.milkYieldPerDay != null
                    ? `${cow.milkYieldPerDay} L`
                    : cow.milkToday || '—';

                return (
                  <div
                    key={cow.id}
                    className="cow-summary-card"
                    onClick={() => {
                      if (!isKycApproved) {
                        showClinicalLockedNotice('In-depth Clinical Dossier');
                      } else {
                        setSelectedCowId(cow.id);
                      }
                    }}
                  >
                    <div className="cow-card-left-group">
                      <CowAvatar
                        photoUrl={cow.photoUrl}
                        name={cow.name}
                        tagId={cow.tagId}
                        breed={cow.breed}
                        avatarColor={cow.avatarColor || '#17733E'}
                        size="medium"
                        rounded="circle"
                      />
                      <div className="cow-card-main-meta">
                        <div className="cow-card-title-row">
                          <span className="cow-card-name">{cow.name}</span>
                          <span className="cow-card-tag-pill">{cow.tagId}</span>
                          <span className={`badge-pill ${cow.status}`}>
                            {cow.status === 'alert'
                              ? 'Needs Attention'
                              : cow.status === 'watch'
                              ? 'Observation'
                              : 'Healthy'}
                          </span>
                        </div>
                        <div className="cow-card-sub-row">
                          <span>{cow.breed}</span>
                          <span>•</span>
                          <span className="cow-milk-yield-stat">
                            <Milk size={13} />
                            {latestMilk} / day
                          </span>
                          <span>•</span>
                          <span>Patil Dairy Farm</span>
                        </div>
                      </div>
                    </div>

                    <div className="cow-card-right-group">
                      <button
                        type="button"
                        className="btn-view-profile-inline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isKycApproved) {
                            showClinicalLockedNotice('In-depth Clinical Dossier');
                          } else {
                            setSelectedCowId(cow.id);
                          }
                        }}
                      >
                        <span>Clinical Profile</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <Tractor size={22} />
              </div>
              <h4 className="empty-state-title">No Cattle Records Found</h4>
              <p className="empty-state-desc">
                No animal records match the selected filter category in your authorized veterinary jurisdiction.
              </p>
            </div>
          )}
        </section>

        {/* 4. Recent Consultation Activity Section */}
        <section className="dashboard-section" aria-label="Recent Consultation Activity">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Recent Clinical Consultations & Directives</h3>
              <p className="section-subtitle">
                Chronological ledger of farm visits, diagnostic evaluations, and issued medical protocols
              </p>
            </div>
            <button
              type="button"
              className="section-link-btn"
              onClick={() => {
                if (!isKycApproved) {
                  showClinicalLockedNotice('Full Medical History');
                } else {
                  setRecordsCowId(null);
                  setCurrentVetView('records');
                }
              }}
            >
              View Full Clinical Ledger
            </button>
          </div>

          {recentConsultationActivity.length > 0 ? (
            <div className="records-preview-card" style={{ padding: '8px 16px' }}>
              <div className="system-activity-card" style={{ border: 'none', padding: 0 }}>
                <div className="activity-stream">
                  {recentConsultationActivity.map((act) => (
                    <div key={act.id} className="activity-item">
                      <div
                        className={`activity-bullet ${
                          act.status === 'completed' || act.status === 'accepted'
                            ? 'info'
                            : act.status === 'pending'
                            ? 'warning'
                            : 'neutral'
                        }`}
                      />
                      <div className="activity-body">
                        <div className="activity-meta">
                          <span className="activity-category">{act.title}</span>
                          <span className="activity-time">
                            <Clock size={11} /> {act.date} {act.time ? `· ${act.time}` : ''}
                          </span>
                        </div>
                        <p className="activity-detail">{act.description}</p>
                      </div>
                      <div>
                        <span
                          className={`badge-pill ${
                            act.status === 'completed' || act.status === 'accepted'
                              ? 'healthy'
                              : act.status === 'pending'
                              ? 'watch'
                              : 'alert'
                          }`}
                        >
                          {act.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <ClipboardList size={22} />
              </div>
              <h4 className="empty-state-title">No Recent Consultation Activity</h4>
              <p className="empty-state-desc">
                When you accept, conduct, or complete consultations with registered dairy farms, the audit entries will appear here.
              </p>
            </div>
          )}
        </section>

        {/* 5. Assigned Farms and Herds */}
        <section className="dashboard-section" aria-label="Assigned Farms Roster">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Assigned Farms & Herds</h3>
              <p className="section-subtitle">Clinical jurisdiction across registered dairy operations</p>
            </div>
            <button
              type="button"
              className="section-link-btn"
              onClick={() => {
                setSelectedFarmDetail(null);
                setIsFarmsDirectoryOpen(true);
              }}
            >
              View all farms
            </button>
          </div>

          <div className="assigned-farms-grid">
            {data.assignedFarms.map((farm) => (
              <div
                key={farm.id}
                className="farm-summary-card"
                onClick={() => {
                  setSelectedFarmDetail(farm);
                  setIsFarmsDirectoryOpen(true);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedFarmDetail(farm);
                    setIsFarmsDirectoryOpen(true);
                  }
                }}
              >
                <div className="farm-card-top">
                  <div className="farm-title-col">
                    <span className="farm-name">{farm.name}</span>
                    <span className="farm-owner">Owner: {farm.owner}</span>
                  </div>
                  <span className={`badge-pill ${farm.alertsCount > 0 ? 'alert' : farm.watchCount > 0 ? 'watch' : 'healthy'}`}>
                    {farm.status}
                  </span>
                </div>

                <div className="farm-card-stats">
                  <div className="f-stat">
                    <span className="f-label">Cattle:</span>
                    <span className="f-val">{farm.cowsCount} cows</span>
                  </div>
                  <div className="f-stat">
                    <span className="f-label">Alerts:</span>
                    <span className="f-val text-danger">{farm.alertsCount} urgent</span>
                  </div>
                  <div className="f-stat">
                    <span className="f-label">Next Visit:</span>
                    <span className="f-val">{farm.nextVisit}</span>
                  </div>
                </div>

                <div className="farm-card-footer">
                  <span className="view-link">Open Clinical Herd Log</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Pending Health Assessments */}
        <section className="dashboard-section" aria-label="Pending Health Assessments">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Pending Health Assessments</h3>
              <p className="section-subtitle">Cases flagged by AI mastitis detector requiring clinical sign-off</p>
            </div>
            <span className="badge-pill alert">
              {data.pendingAssessments.filter((a) => !treatedCaseIds.includes(a.id)).length} Awaiting Review
            </span>
          </div>

          <div className="pending-assessments-stack">
            {data.pendingAssessments.map((asm) => {
              const matchedCow = cows.find(
                (c) => c.tagId === asm.tagId || c.name.toLowerCase() === asm.cowName.toLowerCase()
              );
              const isTreated = treatedCaseIds.includes(asm.id);

              return (
                <div
                  key={asm.id}
                  className={`vet-case-card ${asm.urgency}`}
                  onClick={() => {
                    if (!isKycApproved) {
                      showClinicalLockedNotice('Case Triage');
                      return;
                    }
                    if (matchedCow) {
                      setSelectedCowId(matchedCow.id);
                    } else {
                      setSelectedFarmDetail({ name: asm.farmName, owner: 'Dairy Farmer', cowsCount: 24, alertsCount: 1, watchCount: 2, status: 'Active', nextVisit: 'Tomorrow' });
                      setIsFarmsDirectoryOpen(true);
                    }
                  }}
                >
                  <div className="case-header">
                    <div className="case-cow-info">
                      <span className="case-cow-title">{asm.cowName} · {asm.tagId}</span>
                      <span className="case-farm-badge">{asm.farmName}</span>
                    </div>
                    <span className={`badge-pill ${isTreated ? 'healthy' : asm.urgency === 'high' ? 'alert' : asm.urgency === 'medium' ? 'watch' : 'healthy'}`}>
                      {isTreated ? 'Prescription Signed' : asm.severity}
                    </span>
                  </div>

                  <p className="case-symptoms">
                    <strong>Clinical Observation:</strong> {asm.symptoms}
                  </p>

                  <div className="case-ai-strip">
                    <span className="ai-label">AI Diagnostic Score:</span>
                    <span className="ai-val">{asm.aiConfidence}</span>
                  </div>

                  <div className="case-action-row">
                    <div className="suggested-rx">
                      <span className="rx-label">Recommended Protocol:</span>
                      <span className="rx-val">{asm.suggestedRx}</span>
                    </div>

                    {isTreated ? (
                      <span
                        className="badge-pill healthy"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                      >
                        <Check size={14} />
                        <span>Prescription Confirmed</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isKycApproved) {
                            showClinicalLockedNotice('Confirm Clinical Rx');
                          } else {
                            setPrescribingCase(asm);
                            setRxMedication(asm.suggestedRx || 'Intramammary Cloxacillin 500mg, 1 tube/quarter q12h x 3 doses');
                            setRxNotes(`Clinical examination on ${asm.cowName} (${asm.tagId}) confirms ${asm.severity.toLowerCase()} symptoms. Prescribed standard antibacterial protocol.`);
                          }
                        }}
                      >
                        <CheckCircle2 size={15} />
                        <span>Confirm Clinical Rx</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Vet Availability Management Modal */}
      <VetAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        vetEmail={vetEmail}
        onSaved={() => {
          setNoticeMessage('Availability schedule updated successfully.');
          setTimeout(() => setNoticeMessage(null), 3000);
        }}
      />

      {/* Verified Veterinarian KYC Credential Modal */}
      {isKycModalOpen && (
        <div
          className="appointment-booking-overlay"
          onClick={() => setIsKycModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vet-kyc-modal-title"
        >
          <div
            className="appointment-modal-card"
            style={{ maxWidth: '580px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="appointment-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isKycApproved ? 'var(--color-surface-mint)' : '#FEF3C7',
                    color: isKycApproved ? 'var(--color-primary)' : '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3
                    id="vet-kyc-modal-title"
                    style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--color-primary-dark)' }}
                  >
                    Veterinary Credential & KYC Status
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Statutory License & Council Registration Verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsKycModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Verification Status Badge */}
              <div
                style={{
                  background: isKycApproved ? 'var(--color-surface-mint)' : '#FFFBEB',
                  border: `1px solid ${isKycApproved ? 'var(--color-success-border)' : '#FCD34D'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isKycApproved ? (
                    <CheckCircle2 size={20} color="var(--color-primary)" />
                  ) : (
                    <Clock size={20} color="#D97706" />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: isKycApproved ? 'var(--color-primary-dark)' : '#B45309' }}>
                      {isKycApproved
                        ? 'License Verified & Approved'
                        : vetKycStatus === 'rejected'
                        ? 'Application Review Declined'
                        : 'Awaiting Admin Verification'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {isKycApproved
                        ? 'Authorized for clinical diagnosis, mastitis review, and farm appointments.'
                        : vetKycStatus === 'rejected'
                        ? `Reason: ${vetKycData?.rejectionReason || 'Document clarification required.'}`
                        : 'Credentials are under review by platform administration.'}
                    </div>
                  </div>
                </div>
                <span
                  className={`badge-pill ${
                    isKycApproved ? 'healthy' : vetKycStatus === 'rejected' ? 'alert' : 'watch'
                  }`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  {isKycApproved ? 'Active Standing' : vetKycStatus === 'rejected' ? 'Declined' : 'Pending'}
                </span>
              </div>

              {/* Credential Data Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#F8FAF9', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Practitioner</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {currentUser?.fullName || 'Dr. Rajesh Sharma'}
                  </div>
                </div>

                <div style={{ background: '#F8FAF9', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Council Registration</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
                    {vetKycData?.licenseNumber || 'VET-MH-2019-441'}
                  </div>
                </div>

                <div style={{ background: '#F8FAF9', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Issuing Authority</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {vetKycData?.issuingAuthority || 'Maharashtra State Veterinary Council'}
                  </div>
                </div>

                <div style={{ background: '#F8FAF9', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Qualification</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {vetKycData?.qualification || 'BVSc & AH, MVSc'}
                  </div>
                </div>

                <div style={{ background: '#F8FAF9', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Registered Clinic</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {vetKycData?.clinicName || data.clinic || 'Western Dairy Veterinary Services'}
                  </div>
                </div>

                <div style={{ background: '#F8FAF9', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>License Validity</span>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {vetKycData?.expiryDate || 'Permanent / Lifetime'}
                  </div>
                </div>
              </div>

              {/* Verified Documents Checklist */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Compliance & Regulatory Documents
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {vetKycData?.documents?.length ? (
                    vetKycData.documents.map((doc) => (
                      <div
                        key={doc.id || doc.fileName}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: '#FFFFFF',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} color="var(--color-primary)" />
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>
                              {doc.title || doc.fileName}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                              {doc.fileName} · {doc.fileSize || 'Standard PDF'}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`badge-pill ${isKycApproved ? 'healthy' : 'watch'}`}
                          style={{ fontSize: '10.5px' }}
                        >
                          {isKycApproved ? 'Verified' : 'Attached'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      No documents currently on file.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => setIsKycModalOpen(false)}
                >
                  Close Credential View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Farms & Herds Directory Modal */}
      {isFarmsDirectoryOpen && (
        <div
          className="appointment-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setIsFarmsDirectoryOpen(false);
            setSelectedFarmDetail(null);
          }}
        >
          <div
            className="appointment-modal-box"
            style={{ maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                  Assigned Farms & Herds Directory
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Veterinary jurisdiction across registered regional dairy holdings
                </span>
              </div>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => {
                  setIsFarmsDirectoryOpen(false);
                  setSelectedFarmDetail(null);
                }}
              >
                ✕
              </button>
            </div>

            {/* Search and Filter */}
            <div style={{ display: 'flex', gap: '8px', margin: '14px 0 10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search farms by name, owner, or district..."
                  value={farmSearchQuery}
                  onChange={(e) => setFarmSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div className="cows-filter-pills" style={{ margin: 0 }}>
                {['all', 'healthy', 'alert'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`filter-pill ${farmFilter === f ? 'active' : ''}`}
                    onClick={() => setFarmFilter(f)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Farm List or Selected Farm Detail */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedFarmDetail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="button"
                    className="section-link-btn"
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setSelectedFarmDetail(null)}
                  >
                    ← Back to All Farms
                  </button>

                  <div style={{ padding: '16px', background: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-primary)' }}>{selectedFarmDetail.name}</h4>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Owner: <strong>{selectedFarmDetail.owner}</strong> · Kolhapur District
                        </div>
                      </div>
                      <span className={`badge-pill ${selectedFarmDetail.alertsCount > 0 ? 'alert' : 'healthy'}`}>
                        {selectedFarmDetail.status || 'Active Operation'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px', fontSize: '0.8125rem' }}>
                      <div style={{ padding: '8px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)' }}>{selectedFarmDetail.cowsCount || 24}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Registered Cattle</div>
                      </div>
                      <div style={{ padding: '8px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: selectedFarmDetail.alertsCount > 0 ? '#B91C1C' : 'var(--color-success-text)' }}>
                          {selectedFarmDetail.alertsCount || 0}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Urgent Alerts</div>
                      </div>
                      <div style={{ padding: '8px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{selectedFarmDetail.nextVisit || 'Oct 24'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Next Inspection</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 style={{ margin: '8px 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Assigned Cattle Records ({cows.length} cattle in clinical registry)
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {cows.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            border: '1px solid var(--color-border-subtle)',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setSelectedCowId(c.id);
                            setIsFarmsDirectoryOpen(false);
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Tractor size={16} color="var(--color-primary)" />
                            </div>
                            <div>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{c.name}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '6px' }}>{c.tagId} · {c.breed}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`badge-pill ${c.status}`}>{c.status}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Open File →</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                data.assignedFarms
                  .filter((f) => {
                    const matchesSearch =
                      f.name.toLowerCase().includes(farmSearchQuery.toLowerCase()) ||
                      f.owner.toLowerCase().includes(farmSearchQuery.toLowerCase());
                    const matchesFilter =
                      farmFilter === 'all'
                        ? true
                        : farmFilter === 'alert'
                        ? f.alertsCount > 0
                        : f.alertsCount === 0;
                    return matchesSearch && matchesFilter;
                  })
                  .map((farm) => (
                    <div
                      key={farm.id}
                      style={{
                        padding: '14px',
                        background: '#FFFFFF',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => setSelectedFarmDetail(farm)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                            {farm.name}
                          </span>
                          <span className={`badge-pill ${farm.alertsCount > 0 ? 'alert' : 'healthy'}`}>
                            {farm.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          Owner: <strong>{farm.owner}</strong> · {farm.cowsCount} cattle · {farm.alertsCount} alerts
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Inspect Herd</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setIsFarmsDirectoryOpen(false);
                  setSelectedFarmDetail(null);
                }}
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Prescription Confirmation Modal (AI Triage) */}
      {prescribingCase && (
        <div
          className="appointment-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setPrescribingCase(null)}
        >
          <div
            className="appointment-modal-box"
            style={{ maxWidth: '560px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                  Confirm Clinical Prescription
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Sign off on AI triage screening and log veterinarian treatment protocol
                </span>
              </div>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setPrescribingCase(null)}
              >
                ✕
              </button>
            </div>

            {/* Patient & Case Summary */}
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                  {prescribingCase.cowName} · Tag {prescribingCase.tagId}
                </span>
                <span className="badge-pill alert">{prescribingCase.severity}</span>
              </div>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Holding: {prescribingCase.farmName} · AI Diagnostic Score: <strong>{prescribingCase.aiConfidence}</strong>
              </span>
              <span style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Observation: {prescribingCase.symptoms}
              </span>
            </div>

            {/* Prescription Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTreatedCaseIds((prev) => [...prev, prescribingCase.id]);
                setNoticeMessage(
                  `Clinical prescription confirmed & signed by Dr. Rajesh Sharma for ${prescribingCase.cowName} (${prescribingCase.tagId}). Record synced to patient history.`
                );
                setTimeout(() => setNoticeMessage(null), 4500);
                setPrescribingCase(null);
              }}
              style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Prescribed Medication & Dosage
                </label>
                <input
                  type="text"
                  required
                  value={rxMedication}
                  onChange={(e) => setRxMedication(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Milk Withholding / Discard Period (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  value={rxWithholding}
                  onChange={(e) => setRxWithholding(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Clinical Assessment & Notes
                </label>
                <textarea
                  rows={3}
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.8125rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setPrescribingCase(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-sm"
                >
                  <CheckCircle2 size={15} />
                  <span>Sign & Confirm Prescription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

