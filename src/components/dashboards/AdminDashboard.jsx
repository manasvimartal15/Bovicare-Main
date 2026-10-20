import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Clock,
  ChevronRight,
  Plus,
  Info,
  Layers,
  Database,
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Stethoscope,
  Tractor,
  Activity,
  Check,
  Filter,
  Download,
  Key,
  X,
  Building,
} from 'lucide-react';
import DashboardHeader from '../common/DashboardHeader';
import DashboardHeroBanner from '../common/DashboardHeroBanner';
import { ADMIN_DEMO_DATA } from '../../data/dashboardData';
import { getKycApplications } from '../../services/kycService';
import { getAllAccounts, registerAccount } from '../../services/userService';
import { getAllAppointments, APPOINTMENT_STATUS } from '../../services/appointmentService';
import { useCows } from '../../context/CowsContext';
import AdminKycReviewModal from '../admin/AdminKycReviewModal';
import AdminAppointmentsSection from '../appointments/AdminAppointmentsSection';

export default function AdminDashboard() {
  const data = ADMIN_DEMO_DATA;
  const { cows } = useCows();
  const [noticeMessage, setNoticeMessage] = useState(null);

  // Real Accounts State
  const [accounts, setAccounts] = useState(() => getAllAccounts());
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all' | 'farmer' | 'veterinarian' | 'admin'

  // KYC Verification Queue state
  const [kycApps, setKycApps] = useState(() => getKycApplications());
  const [kycFilter, setKycFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [selectedKycApp, setSelectedKycApp] = useState(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);

  // Platform Appointments State
  const [appointments, setAppointments] = useState(() => getAllAppointments());

  // Farm Accounts list state
  const [farmAccountsList, setFarmAccountsList] = useState(() => ADMIN_DEMO_DATA.farmAccounts);

  // Provision User Modal state
  const [isProvisionUserModalOpen, setIsProvisionUserModalOpen] = useState(false);
  const [provFullName, setProvFullName] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provRole, setProvRole] = useState('farmer');
  const [provPassword, setProvPassword] = useState('welcome123');
  const [provExtra, setProvExtra] = useState('');
  const [provError, setProvError] = useState('');

  // Manage User Modal state
  const [managingUser, setManagingUser] = useState(null);
  const [resetTokenInfo, setResetTokenInfo] = useState(null);

  // Register Farm Modal state
  const [isRegisterFarmModalOpen, setIsRegisterFarmModalOpen] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmOwner, setNewFarmOwner] = useState('');
  const [newFarmDistrict, setNewFarmDistrict] = useState('Kolhapur');
  const [newFarmQuota, setNewFarmQuota] = useState(50);

  const refreshKycList = () => {
    setKycApps(getKycApplications());
  };

  const refreshAccounts = () => {
    setAccounts(getAllAccounts());
  };

  const refreshAppointments = () => {
    setAppointments(getAllAppointments());
  };

  const handleOpenKycReview = (app) => {
    setSelectedKycApp(app);
    setIsKycModalOpen(true);
  };

  const handleStatusUpdated = (updatedApp) => {
    refreshKycList();
    refreshAccounts();
    refreshAppointments();
    setNoticeMessage(`${updatedApp.fullName} credential status updated to ${updatedApp.status.toUpperCase()}.`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Real summary counts
  const farmersCount = useMemo(() => {
    return accounts.filter((u) => (u.role || '').toLowerCase() === 'farmer').length;
  }, [accounts]);

  const vetsCount = useMemo(() => {
    return accounts.filter((u) => {
      const r = (u.role || '').toLowerCase();
      return r === 'veterinarian' || r === 'vet';
    }).length;
  }, [accounts]);

  const pendingKycCount = useMemo(() => {
    return kycApps.filter((a) => a.status === 'pending').length;
  }, [kycApps]);

  const approvedKycCount = useMemo(() => {
    return kycApps.filter((a) => a.status === 'approved').length;
  }, [kycApps]);

  const totalAppointmentsCount = useMemo(() => {
    return appointments.length;
  }, [appointments]);

  const pendingAppointmentsCount = useMemo(() => {
    return appointments.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length;
  }, [appointments]);

  const completedAppointmentsCount = useMemo(() => {
    return appointments.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length;
  }, [appointments]);

  // Telemetry rates
  const kycComplianceRate = useMemo(() => {
    if (kycApps.length === 0) return 100;
    return Math.round((approvedKycCount / kycApps.length) * 100);
  }, [approvedKycCount, kycApps]);

  const consultationCompletionRate = useMemo(() => {
    if (appointments.length === 0) return 0;
    return Math.round((completedAppointmentsCount / appointments.length) * 100);
  }, [completedAppointmentsCount, appointments]);

  // Filtered KYC Apps
  const filteredKycApps = useMemo(() => {
    if (kycFilter === 'all') return kycApps;
    return kycApps.filter((a) => a.status === kycFilter);
  }, [kycApps, kycFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (userRoleFilter === 'all') return accounts;
    if (userRoleFilter === 'veterinarian') {
      return accounts.filter((u) => {
        const r = (u.role || '').toLowerCase();
        return r === 'veterinarian' || r === 'vet';
      });
    }
    return accounts.filter((u) => (u.role || '').toLowerCase() === userRoleFilter.toLowerCase());
  }, [accounts, userRoleFilter]);

  // Dynamic Recent System Activity
  const recentPlatformActivity = useMemo(() => {
    const events = [];

    // KYC events
    kycApps.forEach((k) => {
      if (k.reviewedAt) {
        events.push({
          id: `act-kyc-rev-${k.id}`,
          category: 'Credential Audit',
          severity: k.status === 'approved' ? 'info' : 'warning',
          timestamp: new Date(k.reviewedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          detail: `Veterinarian application for ${k.fullName} (${k.licenseNumber}) was ${k.status.toUpperCase()} by ${k.reviewedBy || 'Admin'}.`,
        });
      } else if (k.submittedAt) {
        events.push({
          id: `act-kyc-sub-${k.id}`,
          category: 'KYC Application',
          severity: 'warning',
          timestamp: new Date(k.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          detail: `New veterinary KYC application submitted by ${k.fullName} (${k.licenseNumber}) awaiting verification.`,
        });
      }
    });

    // Appointment events
    appointments.forEach((apt) => {
      events.push({
        id: `act-apt-${apt.id}`,
        category: 'Consultation Booking',
        severity: apt.status === 'completed' ? 'info' : apt.status === 'pending' ? 'warning' : 'neutral',
        timestamp: `${apt.date} · ${apt.timeSlot}`,
        detail: `Farmer ${apt.farmerName} requested ${apt.visitType} with Dr. ${apt.vetName} for cow ${apt.cowName} (${apt.status.toUpperCase()}).`,
      });
    });

    // Registered user events
    accounts.forEach((u) => {
      if (u.registeredAt) {
        events.push({
          id: `act-user-${u.id}`,
          category: 'User Onboarding',
          severity: 'neutral',
          timestamp: new Date(u.registeredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          detail: `Registered new account for ${u.fullName} (${u.role.toUpperCase()}) · ${u.email}`,
        });
      }
    });

    if (events.length === 0) {
      return data.recentSystemActivity || [];
    }

    return events.slice(0, 6);
  }, [kycApps, appointments, accounts, data.recentSystemActivity]);

  const handleExportAuditLog = () => {
    try {
      const headers = ['ID', 'Category', 'Severity', 'Timestamp', 'Detail'];
      const rows = recentPlatformActivity.map((a) => [
        `"${a.id}"`,
        `"${a.category}"`,
        `"${a.severity}"`,
        `"${a.timestamp}"`,
        `"${(a.detail || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `bovicare_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNoticeMessage('Platform audit ledger exported successfully (CSV download).');
      setTimeout(() => setNoticeMessage(null), 3500);
    } catch (err) {
      setNoticeMessage('Failed to export audit log.');
      setTimeout(() => setNoticeMessage(null), 3000);
    }
  };

  const showStep2Notice = (actionTitle) => {
    setNoticeMessage(`${actionTitle} feature is scheduled for subsequent steps upon approval.`);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  return (
    <div className="dashboard-page-layout admin-theme">
      {/* Top Header */}
      <DashboardHeader
        avatarInitials="SR"
        greetingName="Sunita Rao"
        subtitle={data.department}
        roleBadge="Admin"
        unreadNotifications={pendingKycCount}
        onNavigate={(view) => {
          if (view === 'dashboard' || view === 'home') {
            setUserRoleFilter('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (view === 'kyc-approvals') {
            setUserRoleFilter('kyc');
            setKycFilter('pending');
            setTimeout(() => {
              document.getElementById('admin-kyc-queue')?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          } else if (view === 'users') {
            setUserRoleFilter('all');
            setTimeout(() => {
              document.getElementById('admin-user-management')?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          } else if (view === 'appointments') {
            setTimeout(() => {
              document.getElementById('admin-appointments-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          } else if (view === 'analytics') {
            setTimeout(() => {
              document.getElementById('admin-telemetry-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          } else if (view === 'settings') {
            setTimeout(() => {
              document.getElementById('admin-settings-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          } else if (view === 'notifications') {
            setTimeout(() => {
              document.getElementById('admin-system-activity')?.scrollIntoView({ behavior: 'smooth' });
            }, 60);
          } else {
            showStep2Notice(`Admin Console: ${view}`);
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

        {/* Hero System Banner */}
        <DashboardHeroBanner
          title="BoviCare Platform Administration Console"
          subtitle={`${farmersCount} Registered Farms · ${cows.length} Monitored Cattle · ${vetsCount} Registered Veterinarians`}
          actionText="Inspect Verification Queue"
          onActionClick={() => {
            document.getElementById('admin-kyc-queue')?.scrollIntoView({ behavior: 'smooth' });
          }}
          statusItems={[
            { type: 'healthy', label: `${farmersCount} Active Farmers` },
            { type: approvedKycCount > 0 ? 'healthy' : 'watch', label: `${approvedKycCount} Verified Vets` },
            { type: pendingKycCount > 0 ? 'alert' : 'healthy', label: `${pendingKycCount} Pending KYC` },
          ]}
          bannerTheme="admin"
        />

        {/* 1. Summary Cards Grid (Matching Farmer & Vet Dashboard Visual Quality) */}
        <section
          className="farm-summary-cards-grid"
          aria-label="Platform Executive Metrics Summary"
        >
          {/* Card 1: Registered Farmers */}
          <div
            className="farm-summary-card"
            onClick={() => {
              setUserRoleFilter('farmer');
              document.getElementById('admin-user-management')?.scrollIntoView({ behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            title="View registered dairy farmers"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box total">
                <Users size={20} />
              </div>
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{farmersCount}</span>
              <span className="summary-card-label">Registered Farmers</span>
              <span className="summary-card-sub">Active dairy producers</span>
            </div>
          </div>

          {/* Card 2: Registered Veterinarians */}
          <div
            className="farm-summary-card"
            onClick={() => {
              setUserRoleFilter('veterinarian');
              document.getElementById('admin-user-management')?.scrollIntoView({ behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            title="View registered veterinarians"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box healthy">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{vetsCount}</span>
              <span className="summary-card-label">Registered Vets</span>
              <span className="summary-card-sub">
                {approvedKycCount} verified & active
              </span>
            </div>
          </div>

          {/* Card 3: Pending KYC Applications */}
          <div
            className="farm-summary-card"
            onClick={() => {
              setKycFilter('pending');
              document.getElementById('admin-kyc-queue')?.scrollIntoView({ behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            title="Review pending veterinarian KYC applications"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box attention">
                <FileText size={20} />
              </div>
              {pendingKycCount > 0 && <span className="summary-badge-indicator attention" />}
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{pendingKycCount}</span>
              <span className="summary-card-label">Pending KYC</span>
              <span className="summary-card-sub">
                {pendingKycCount > 0 ? 'Awaiting verification audit' : 'Queue up to date'}
              </span>
            </div>
          </div>

          {/* Card 4: Appointment Requests */}
          <div
            className="farm-summary-card"
            onClick={() => {
              document.getElementById('admin-appointments-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            title="View platform consultations directory"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box total">
                <Calendar size={20} />
              </div>
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{totalAppointmentsCount}</span>
              <span className="summary-card-label">Appointments</span>
              <span className="summary-card-sub">
                {pendingAppointmentsCount} pending review
              </span>
            </div>
          </div>
        </section>

        {/* 2. Veterinarian KYC Verification Queue Section */}
        <section
          className="dashboard-section"
          id="admin-kyc-queue"
          aria-label="Veterinarian KYC Verification Queue"
        >
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Veterinarian KYC Verification Queue</h3>
              <p className="section-subtitle">
                Review veterinary council credentials, qualifications, and statutory license documents
              </p>
            </div>
            <span
              className={`badge-pill ${pendingKycCount > 0 ? 'watch' : 'healthy'}`}
              style={{ fontWeight: 700 }}
            >
              {pendingKycCount} Awaiting Review
            </span>
          </div>

          {/* Queue Filter Pills */}
          <div className="cows-filter-pills" role="tablist">
            <button
              type="button"
              className={`filter-pill ${kycFilter === 'all' ? 'active' : ''}`}
              onClick={() => setKycFilter('all')}
            >
              All Applications ({kycApps.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${kycFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setKycFilter('pending')}
            >
              Pending Review ({pendingKycCount})
            </button>
            <button
              type="button"
              className={`filter-pill ${kycFilter === 'approved' ? 'active' : ''}`}
              onClick={() => setKycFilter('approved')}
            >
              Verified / Approved ({approvedKycCount})
            </button>
            <button
              type="button"
              className={`filter-pill ${kycFilter === 'rejected' ? 'active' : ''}`}
              onClick={() => setKycFilter('rejected')}
            >
              Declined ({kycApps.filter((a) => a.status === 'rejected').length})
            </button>
          </div>

          {/* KYC Applications Table */}
          {filteredKycApps.length > 0 ? (
            <div className="admin-table-card">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Practitioner & Email</th>
                    <th>Council & License No</th>
                    <th>Qualification & Clinic</th>
                    <th>Submitted</th>
                    <th>Attached Documents</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKycApps.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="table-user-cell">
                          <span className="table-user-name">{app.fullName}</span>
                          <span className="table-user-email">{app.email}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <code
                            style={{
                              background: '#FFFFFF',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border-subtle)',
                              fontWeight: 600,
                            }}
                          >
                            {app.licenseNumber}
                          </code>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {app.issuingAuthority}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{app.qualification}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {app.clinicName}
                        </div>
                      </td>
                      <td className="text-muted">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
                          {app.documents?.length || 0} Attached (PDF/IMG)
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge-pill ${
                            app.status === 'approved' ? 'healthy' : app.status === 'rejected' ? 'alert' : 'watch'
                          }`}
                        >
                          {app.status === 'approved'
                            ? 'Verified'
                            : app.status === 'rejected'
                            ? 'Declined'
                            : 'Pending Review'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-action-primary-sm"
                          onClick={() => handleOpenKycReview(app)}
                        >
                          <Eye size={13} />
                          <span>Review Documents</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <FileText size={22} />
              </div>
              <h4 className="empty-state-title">No Applications Found</h4>
              <p className="empty-state-desc">
                There are no veterinarian KYC applications matching the selected filter category ({kycFilter}).
              </p>
            </div>
          )}
        </section>

        {/* 3. User Management Section */}
        <section
          className="dashboard-section"
          id="admin-user-management"
          aria-label="User Account Management"
        >
          <div className="section-header-row">
            <div>
              <h3 className="section-title">User Account Management</h3>
              <p className="section-subtitle">
                System accounts, role credentials, and permissions directory
              </p>
            </div>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => {
                setIsProvisionUserModalOpen(true);
                setProvError('');
              }}
            >
              <Plus size={14} />
              <span>Provision User</span>
            </button>
          </div>

          {/* Role Filter Tabs */}
          <div className="cows-filter-pills" role="tablist">
            <button
              type="button"
              className={`filter-pill ${userRoleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('all')}
            >
              All Users ({accounts.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${userRoleFilter === 'farmer' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('farmer')}
            >
              Farmers ({farmersCount})
            </button>
            <button
              type="button"
              className={`filter-pill ${userRoleFilter === 'veterinarian' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('veterinarian')}
            >
              Veterinarians ({vetsCount})
            </button>
            <button
              type="button"
              className={`filter-pill ${userRoleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setUserRoleFilter('admin')}
            >
              Platform Admins ({accounts.filter((u) => u.role === 'admin').length})
            </button>
          </div>

          {/* Users Table */}
          {filteredUsers.length > 0 ? (
            <div className="admin-table-card">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>User & Identity</th>
                    <th>Role</th>
                    <th>Farm / Clinic / Identifier</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isVet = (u.role || '').toLowerCase() === 'veterinarian' || (u.role || '').toLowerCase() === 'vet';
                    const matchingKyc = isVet
                      ? kycApps.find(
                          (a) =>
                            a.email.toLowerCase() === (u.email || '').toLowerCase() ||
                            a.licenseNumber === u.licenseNo
                        )
                      : null;

                    return (
                      <tr key={u.id || u.email}>
                        <td>
                          <div className="table-user-cell">
                            <span className="table-user-name">{u.fullName || u.name}</span>
                            <span className="table-user-email">{u.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge-pill role-${isVet ? 'veterinarian' : (u.role || '').toLowerCase()}`}>
                            {isVet ? 'Veterinarian' : u.role === 'admin' ? 'Admin' : 'Farmer'}
                          </span>
                        </td>
                        <td className="text-muted">
                          {u.farmName || u.clinicName || u.licenseNo || (u.role === 'admin' ? 'Governance' : '—')}
                        </td>
                        <td className="text-muted">
                          {u.registeredAt ? new Date(u.registeredAt).toLocaleDateString() : u.registeredDate || 'Permanent'}
                        </td>
                        <td>
                          <span
                            className={`badge-pill ${
                              isVet
                                ? matchingKyc?.status === 'pending'
                                  ? 'watch'
                                  : matchingKyc?.status === 'rejected'
                                  ? 'alert'
                                  : 'healthy'
                                : 'healthy'
                            }`}
                          >
                            {isVet
                              ? matchingKyc
                                ? matchingKyc.status === 'approved'
                                  ? 'Verified'
                                  : matchingKyc.status === 'rejected'
                                  ? 'Declined'
                                  : 'Pending KYC'
                                : 'Active'
                              : 'Active'}
                          </span>
                        </td>
                        <td>
                          {isVet ? (
                            <button
                              type="button"
                              className="btn-action-outline-sm"
                              onClick={() => {
                                const targetApp =
                                  matchingKyc || {
                                    id: `kyc-${u.id}`,
                                    fullName: u.fullName || u.name,
                                    email: u.email,
                                    licenseNumber: u.licenseNo || 'VET-MH-2022-882',
                                    issuingAuthority: 'State Veterinary Council',
                                    qualification: 'BVSc & AH',
                                    status: 'approved',
                                    documents: [
                                      {
                                        id: 'doc-d1',
                                        title: 'Veterinary Registration Certificate',
                                        fileName: 'Vet_License_Registration.pdf',
                                        fileSize: '2.2 MB',
                                      },
                                    ],
                                  };
                                handleOpenKycReview(targetApp);
                              }}
                            >
                              <Eye size={12} />
                              <span>Audit KYC</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-action-outline-sm"
                              onClick={() => {
                                setManagingUser(u);
                                setResetTokenInfo(null);
                              }}
                            >
                              <span>Manage</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <Users size={22} />
              </div>
              <h4 className="empty-state-title">No Users Found</h4>
              <p className="empty-state-desc">
                No registered accounts match the selected role filter ({userRoleFilter}).
              </p>
            </div>
          )}
        </section>

        {/* 4. Platform Consultations Overview Section */}
        <div id="admin-appointments-section">
          <AdminAppointmentsSection />
        </div>

        {/* 5. Basic Reports & Telemetry Section */}
        <section
          className="dashboard-section"
          id="admin-telemetry-section"
          aria-label="Platform Telemetry & Audit Reports"
        >
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Platform Reports & Telemetry</h3>
              <p className="section-subtitle">
                Operational status derived from active cattle registries, KYC compliance, and consultations
              </p>
            </div>
            <span className="badge-pill healthy">100% Operational</span>
          </div>

          <div className="admin-reports-grid">
            <div className="admin-report-card">
              <div className="report-card-top">
                <span className="report-label-text">Monitored Cattle</span>
                <Tractor size={18} color="var(--color-primary)" />
              </div>
              <span className="report-val-large">{cows.length}</span>
              <span className="report-sub-meta">Active animal records in herd registry</span>
            </div>

            <div className="admin-report-card">
              <div className="report-card-top">
                <span className="report-label-text">KYC Compliance</span>
                <ShieldCheck size={18} color="var(--color-primary)" />
              </div>
              <span className="report-val-large">{kycComplianceRate}%</span>
              <span className="report-sub-meta">Veterinary licenses verified</span>
            </div>

            <div className="admin-report-card">
              <div className="report-card-top">
                <span className="report-label-text">Consultation Completion</span>
                <CheckCircle2 size={18} color="var(--color-primary)" />
              </div>
              <span className="report-val-large">{consultationCompletionRate}%</span>
              <span className="report-sub-meta">{completedAppointmentsCount} visits concluded</span>
            </div>

            <div className="admin-report-card">
              <div className="report-card-top">
                <span className="report-label-text">Dairy Farm Accounts</span>
                <Layers size={18} color="var(--color-primary)" />
              </div>
              <span className="report-val-large">{data.farmAccounts.length}</span>
              <span className="report-sub-meta">Operational farm tenants</span>
            </div>
          </div>
        </section>

        {/* 6. Farm and Tenant Management */}
        <section
          className="dashboard-section"
          id="admin-settings-section"
          aria-label="Farm and Account Management"
        >
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Farm and Tenant Accounts</h3>
              <p className="section-subtitle">Operational profiles, sensor gateway integrations, and herd quotas</p>
            </div>
            <button
              type="button"
              className="section-link-btn"
              onClick={() => setIsRegisterFarmModalOpen(true)}
            >
              + Register New Farm
            </button>
          </div>

          <div className="farm-accounts-grid">
            {farmAccountsList.map((farm) => (
              <div
                key={farm.id}
                className="farm-account-card"
                onClick={() => {
                  setNoticeMessage(`Farm: ${farm.name} (${farm.district}) · Capacity: ${farm.cowsCapacity} cows · Sensors: ${farm.connectedSensors} active.`);
                  setTimeout(() => setNoticeMessage(null), 3500);
                }}
              >
                <div className="f-acc-header">
                  <div>
                    <h4 className="f-acc-name">{farm.name}</h4>
                    <span className="f-acc-owner">Owner: {farm.owner} · {farm.district}</span>
                  </div>
                  <span className="badge-pill healthy">{farm.status}</span>
                </div>

                <div className="f-acc-details-grid">
                  <div className="f-detail-box">
                    <span className="f-det-lbl">Subscription:</span>
                    <span className="f-det-val">{farm.tier}</span>
                  </div>
                  <div className="f-detail-box">
                    <span className="f-det-lbl">Cattle Quota:</span>
                    <span className="f-det-val">{farm.cowsCapacity}</span>
                  </div>
                  <div className="f-detail-box">
                    <span className="f-det-lbl">IoT Sensors:</span>
                    <span className="f-det-val">{farm.connectedSensors} active</span>
                  </div>
                  <div className="f-detail-box">
                    <span className="f-det-lbl">Health Score:</span>
                    <span className="f-det-val text-success">{farm.healthIndex} / 100</span>
                  </div>
                </div>

                <div className="f-acc-actions">
                  <span className="f-acc-action-text">Configure Quota & Gateways</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. System Activity Section */}
        <section
          className="dashboard-section"
          id="admin-system-activity"
          aria-label="Platform Real-Time Activity Log"
        >
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Platform Activity Log</h3>
              <p className="section-subtitle">
                Audit stream of credential verifications, consultation bookings, and account registrations
              </p>
            </div>
            <button
              type="button"
              className="section-link-btn"
              onClick={handleExportAuditLog}
            >
              Export Audit Log
            </button>
          </div>

          {recentPlatformActivity.length > 0 ? (
            <div className="system-activity-card">
              <div className="activity-stream">
                {recentPlatformActivity.map((act) => (
                  <div key={act.id} className="activity-item">
                    <div className={`activity-bullet ${act.severity}`} />
                    <div className="activity-body">
                      <div className="activity-meta">
                        <span className="activity-category">{act.category}</span>
                        <span className="activity-time">
                          <Clock size={11} /> {act.timestamp}
                        </span>
                      </div>
                      <p className="activity-detail">{act.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <Clock size={22} />
              </div>
              <h4 className="empty-state-title">No Activity Recorded</h4>
              <p className="empty-state-desc">
                When platform events, bookings, and user changes occur, they will be logged here in chronological sequence.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Admin KYC Document Review Modal */}
      <AdminKycReviewModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        application={selectedKycApp}
        onStatusUpdated={handleStatusUpdated}
      />

      {/* Provision User Modal */}
      {isProvisionUserModalOpen && (
        <div
          className="appointment-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsProvisionUserModalOpen(false)}
        >
          <div
            className="appointment-modal-box"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                  Provision New User Account
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Register and onboard an authorized farmer or veterinary practitioner
                </span>
              </div>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setIsProvisionUserModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {provError && (
              <div className="rejection-reason-alert" style={{ marginTop: '12px' }}>
                <AlertCircle size={16} />
                <span>{provError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setProvError('');
                const res = registerAccount({
                  fullName: provFullName,
                  emailOrPhone: provEmail,
                  role: provRole,
                  password: provPassword,
                  farmName: provRole === 'farmer' ? provExtra : undefined,
                  clinicName: provRole === 'veterinarian' ? provExtra : undefined,
                  licenseNumber: provRole === 'veterinarian' ? 'VET-PROV-' + Date.now().toString().slice(-4) : undefined,
                });

                if (res.success) {
                  refreshAccounts();
                  setNoticeMessage(
                    `Account for ${provFullName} (${provRole.toUpperCase()}) provisioned successfully.`
                  );
                  setTimeout(() => setNoticeMessage(null), 4000);
                  setIsProvisionUserModalOpen(false);
                  setProvFullName('');
                  setProvEmail('');
                  setProvExtra('');
                } else {
                  setProvError(res.error || 'Failed to provision account.');
                }
              }}
              style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Deshmukh"
                  value={provFullName}
                  onChange={(e) => setProvFullName(e.target.value)}
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
                  Email Address or Mobile Phone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. anand@dairy.com or +91 98220 12345"
                  value={provEmail}
                  onChange={(e) => setProvEmail(e.target.value)}
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
                  Assigned User Role *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`filter-pill ${provRole === 'farmer' ? 'active' : ''}`}
                    onClick={() => setProvRole('farmer')}
                  >
                    Dairy Farmer
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${provRole === 'veterinarian' ? 'active' : ''}`}
                    onClick={() => setProvRole('veterinarian')}
                  >
                    Veterinarian
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  {provRole === 'farmer' ? 'Dairy Farm / Operation Name' : 'Veterinary Clinic / Practice Name'}
                </label>
                <input
                  type="text"
                  placeholder={provRole === 'farmer' ? 'e.g. Deshmukh Dairy Farm' : 'e.g. Western Veterinary Clinic'}
                  value={provExtra}
                  onChange={(e) => setProvExtra(e.target.value)}
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
                  Initial Password
                </label>
                <input
                  type="text"
                  value={provPassword}
                  onChange={(e) => setProvPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setIsProvisionUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  <CheckCircle2 size={15} />
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage User Modal */}
      {managingUser && (
        <div
          className="appointment-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setManagingUser(null)}
        >
          <div
            className="appointment-modal-box"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                  User Account Administration
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Manage account status, credentials, and access credentials
                </span>
              </div>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setManagingUser(null)}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                marginTop: '12px',
                padding: '14px',
                background: 'var(--color-surface-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--color-border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8125rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Account Name:</span>{' '}
                <strong>{managingUser.fullName || managingUser.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Email / Identifier:</span>{' '}
                <code>{managingUser.email || managingUser.emailOrPhone}</code>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Role:</span>{' '}
                <span className="badge-pill healthy" style={{ textTransform: 'uppercase' }}>
                  {managingUser.role}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Farm / Clinic:</span>{' '}
                <span>{managingUser.farmName || managingUser.clinicName || 'Standard Account'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Account Status:</span>{' '}
                <span style={{ color: 'var(--color-success-text)', fontWeight: 600 }}>Active Verified</span>
              </div>
            </div>

            {/* Password Reset Generator */}
            <div style={{ marginTop: '14px', padding: '12px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Password Recovery Token
                  </span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Generate a one-time credential reset link for this user
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-action-outline-sm"
                  onClick={() => {
                    const token = 'rst_' + Math.random().toString(36).substring(2, 10);
                    setResetTokenInfo(`https://bovicare.com/reset-password?token=${token}`);
                  }}
                >
                  <Key size={13} />
                  <span>Generate Link</span>
                </button>
              </div>

              {resetTokenInfo && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'var(--color-surface-mint)', borderRadius: '6px', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-primary)', display: 'block', marginBottom: '2px' }}>
                    Generated One-Time Reset Link:
                  </span>
                  <code>{resetTokenInfo}</code>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setManagingUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Farm Modal */}
      {isRegisterFarmModalOpen && (
        <div
          className="appointment-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsRegisterFarmModalOpen(false)}
        >
          <div
            className="appointment-modal-box"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                  Register New Dairy Farm Tenant
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Onboard a new regional farm holding into the central platform registry
                </span>
              </div>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setIsRegisterFarmModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newFarm = {
                  id: `farm-${Date.now()}`,
                  name: newFarmName,
                  owner: newFarmOwner,
                  district: newFarmDistrict,
                  tier: 'Commercial Herd',
                  cowsCapacity: Number(newFarmQuota),
                  connectedSensors: 6,
                  healthIndex: 98,
                  status: 'Active',
                };
                setFarmAccountsList((prev) => [...prev, newFarm]);
                setNoticeMessage(`Dairy farm "${newFarmName}" registered successfully.`);
                setTimeout(() => setNoticeMessage(null), 4000);
                setIsRegisterFarmModalOpen(false);
                setNewFarmName('');
                setNewFarmOwner('');
              }}
              style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Farm Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahyadri Dairy Holdings"
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
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
                  Owner / Dairy Operator *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Gaikwad"
                  value={newFarmOwner}
                  onChange={(e) => setNewFarmOwner(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    District / Region
                  </label>
                  <input
                    type="text"
                    value={newFarmDistrict}
                    onChange={(e) => setNewFarmDistrict(e.target.value)}
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
                    Cattle Head Quota
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newFarmQuota}
                    onChange={(e) => setNewFarmQuota(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-subtle)',
                      fontSize: '0.8125rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => setIsRegisterFarmModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  <CheckCircle2 size={15} />
                  <span>Register Farm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

