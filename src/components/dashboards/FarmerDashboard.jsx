import React, { useState, useMemo } from 'react';
import {
  Tractor,
  Camera,
  Thermometer,
  Milk,
  Syringe,
  Plus,
  CheckCircle2,
  Clock,
  ChevronRight,
  Activity,
  Calendar,
  Info,
  ShieldCheck,
  Stethoscope,
  FileText,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../common/DashboardHeader';
import DashboardHeroBanner from '../common/DashboardHeroBanner';
import StatMetricCard from '../common/StatMetricCard';
import DashboardBottomNav from '../common/DashboardBottomNav';
import { FARMER_DEMO_DATA } from '../../data/dashboardData';
import { useCows } from '../../context/CowsContext';
import MyCowsPage from '../cows/MyCowsPage';
import AddCowPage from '../cows/AddCowPage';
import CowProfilePage from '../cows/CowProfilePage';
import AssessCowPage from '../assessment/AssessCowPage';
import FeverMonitoringPage from '../fever/FeverMonitoringPage';
import MilkLogPage from '../milk/MilkLogPage';
import VaccineCarePage from '../vaccine/VaccineCarePage';
import HealthRecordsPage from '../records/HealthRecordsPage';
import NotificationsPage from '../notifications/NotificationsPage';
import BookVetPage from '../appointments/BookVetPage';
import MyAppointmentsPage from '../appointments/MyAppointmentsPage';
import { generateHerdNotifications, getReadNotificationIds } from '../../services/notificationService';
import { getAppointmentsForFarmer, APPOINTMENT_STATUS } from '../../services/appointmentService';
import CowAvatar from '../common/CowAvatar';

export default function FarmerDashboard() {
  const { currentUser, logout } = useAuth();
  const data = FARMER_DEMO_DATA;
  const { cows, stats } = useCows();

  // Internal Navigation State: 'dashboard' | 'my-cows' | 'add-cow' | 'cow-profile' | 'edit-cow' | 'assess' | 'fever' | 'milk-log' | 'vaccine' | 'records' | 'notifications' | 'book-vet' | 'my-appointments'
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCowId, setSelectedCowId] = useState(null);
  const [assessCowId, setAssessCowId] = useState(null);
  const [quickActionCowId, setQuickActionCowId] = useState(null);
  const [bookVetCowId, setBookVetCowId] = useState(null);
  const [recordsCowId, setRecordsCowId] = useState(null);
  const [editingCow, setEditingCow] = useState(null);
  const [cowFilter, setCowFilter] = useState('all');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const [noticeMessage, setNoticeMessage] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeMilkDayIndex, setActiveMilkDayIndex] = useState(null);

  const farmerEmail = currentUser?.email || 'farmer@bovicare.com';
  const farmerAppointments = useMemo(
    () => getAppointmentsForFarmer(farmerEmail),
    [farmerEmail, currentView]
  );
  const upcomingAppointments = farmerAppointments.filter((a) =>
    [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED].includes(a.status)
  );

  // Dynamic notification count from active herd
  const allHerdNotifs = useMemo(() => generateHerdNotifications(cows), [cows]);
  const readNotifIds = getReadNotificationIds();
  const unreadNotifCount = allHerdNotifs.filter((n) => !readNotifIds.includes(n.id)).length;

  // Filtered cows for the dashboard preview section
  const filteredCows = cows.filter((cow) => {
    if (cowFilter === 'all') return true;
    return cow.status === cowFilter;
  });

  // 7-Day Milk Production Data derived from actual cow milkLogs
  const milkChartData = useMemo(() => {
    const milkDailyMap = new Map();
    let totalLogsCount = 0;

    cows.forEach((cow) => {
      (cow.milkLogs || []).forEach((log) => {
        if (!log.date) return;
        totalLogsCount++;
        const vol =
          parseFloat(log.totalMilk) ||
          (parseFloat(log.morningMilk) || 0) + (parseFloat(log.eveningMilk) || 0);
        const current = milkDailyMap.get(log.date) || 0;
        milkDailyMap.set(log.date, Math.round((current + vol) * 10) / 10);
      });
    });

    if (milkDailyMap.size === 0) {
      return { hasData: false, days: [], total7Days: 0, avg7Days: 0, peakDay: null, maxYield: 1 };
    }

    const recordedDates = Array.from(milkDailyMap.keys()).sort();
    const latestRecordedDate = recordedDates[recordedDates.length - 1];
    const todayStr = new Date().toISOString().split('T')[0];

    // If today is within or past the recorded range, end at today or latest record
    const endDateStr =
      todayStr >= recordedDates[0] && todayStr <= latestRecordedDate
        ? todayStr
        : latestRecordedDate;

    const [year, month, day] = endDateStr.split('-').map(Number);
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(year, month - 1, day - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const yieldLiters = milkDailyMap.get(dateStr) || 0;

      days.push({
        dateStr,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateFormatted: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        yieldLiters,
      });
    }

    const total7Days = Math.round(days.reduce((sum, d) => sum + d.yieldLiters, 0) * 10) / 10;
    const avg7Days = Math.round((total7Days / 7) * 10) / 10;
    const peakDay = [...days].sort((a, b) => b.yieldLiters - a.yieldLiters)[0];
    const maxYield = Math.max(...days.map((d) => d.yieldLiters), 1);

    return {
      hasData: total7Days > 0 || totalLogsCount > 0,
      days,
      total7Days,
      avg7Days,
      peakDay,
      maxYield,
    };
  }, [cows]);

  // Health alerts derived from actual cow statuses, temperature readings, assessments, and vaccinations
  const healthAlerts = useMemo(() => {
    const alerts = [];

    // 1. Elevated temperature or alert status
    cows.forEach((cow) => {
      const tempNum = parseFloat(cow.temperature) || 0;
      if (cow.status === 'alert' || tempNum > 39.5) {
        alerts.push({
          id: `alert-cow-${cow.id}`,
          type: 'alert',
          iconType: 'thermometer',
          title: `${cow.name} · ${cow.tagId}`,
          issue: cow.issue || `Elevated body temperature of ${cow.temperature} recorded. Clinical inspection recommended.`,
          badge: 'Needs Attention',
          cowId: cow.id,
          date: 'Immediate review',
          actionView: 'cow-profile',
        });
      } else if (cow.status === 'watch' || tempNum > 39.2) {
        alerts.push({
          id: `watch-cow-${cow.id}`,
          type: 'watch',
          iconType: 'thermometer',
          title: `${cow.name} · ${cow.tagId}`,
          issue: cow.issue || `Mild temperature fluctuation (${cow.temperature}). Monitor feed intake and milk yield.`,
          badge: 'Observation',
          cowId: cow.id,
          date: 'Daily monitoring',
          actionView: 'cow-profile',
        });
      }
    });

    // 2. High risk / watch assessments
    cows.forEach((cow) => {
      (cow.assessments || []).forEach((asm) => {
        if (asm.status === 'alert' || asm.status === 'watch') {
          if (!alerts.some((a) => a.cowId === cow.id && a.type === 'alert')) {
            alerts.push({
              id: `alert-asm-${asm.id}`,
              type: asm.status,
              iconType: 'camera',
              title: `AI Udder Scan: ${cow.name} (${cow.tagId})`,
              issue: `${asm.result} (${asm.confidence}) · ${asm.condition}`,
              badge: asm.status === 'alert' ? 'High Mastitis Risk' : 'Observation',
              cowId: cow.id,
              date: asm.date,
              actionView: 'assess',
            });
          }
        }
      });
    });

    // 3. Due / overdue vaccinations from herd notifications
    allHerdNotifs
      .filter((n) => n.category === 'vaccine')
      .forEach((n) => {
        alerts.push({
          id: n.id,
          type: n.urgency === 'alert' ? 'alert' : 'vaccine',
          iconType: 'syringe',
          title: `${n.title}`,
          issue: n.message,
          badge: n.type === 'overdue' ? 'Overdue Booster' : n.type === 'due-today' ? 'Due Today' : 'Due Soon',
          cowId: n.cowId,
          date: n.dateLabel,
          actionView: 'vaccine',
        });
      });

    return alerts.slice(0, 5);
  }, [cows, allHerdNotifs]);

  // Recent activity compiled from actual app events (assessments, milk logs, fever logs, vaccines, appointments)
  const recentActivities = useMemo(() => {
    const events = [];

    cows.forEach((cow) => {
      (cow.assessments || []).forEach((asm) => {
        events.push({
          id: `act-asm-${asm.id}`,
          type: 'assessment',
          title: `Udder Scan · ${cow.name}`,
          description: `${asm.result} (${asm.confidence}) · Tag ${cow.tagId}`,
          date: asm.date,
          cowId: cow.id,
          targetView: 'cow-profile',
        });
      });

      (cow.milkLogs || []).forEach((log) => {
        events.push({
          id: `act-milk-${log.id}`,
          type: 'milk',
          title: `Milk Recorded · ${cow.name}`,
          description: `${log.totalMilk} L logged (${log.morningMilk}L AM / ${log.eveningMilk}L PM) · Tag ${cow.tagId}`,
          date: log.date,
          cowId: cow.id,
          targetView: 'milk-log',
        });
      });

      (cow.feverLogs || []).forEach((f) => {
        events.push({
          id: `act-fever-${f.id}`,
          type: 'fever',
          title: `Vitals Check · ${cow.name}`,
          description: `Body temperature ${f.temperature} °C · Tag ${cow.tagId}`,
          date: f.date,
          cowId: cow.id,
          targetView: 'fever',
        });
      });

      (cow.vaccinations || []).forEach((v) => {
        events.push({
          id: `act-vac-${v.id}`,
          type: 'vaccine',
          title: `Vaccine · ${cow.name}`,
          description: `${v.title || v.vaccineName || 'Treatment'}${v.administeredBy ? ' · By ' + v.administeredBy : ''}`,
          date: v.administeredDate || v.date || v.nextDueDate,
          cowId: cow.id,
          targetView: 'vaccine',
        });
      });
    });

    farmerAppointments.forEach((apt) => {
      events.push({
        id: `act-apt-${apt.id}`,
        type: 'appointment',
        title: `Vet Visit · ${apt.vetName}`,
        description: `${apt.visitType} for ${apt.cowName} (${apt.cowTag}) · ${apt.status === 'accepted' ? 'Confirmed' : 'Pending'}`,
        date: apt.date,
        targetView: 'my-appointments',
      });
    });

    return events
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);
  }, [cows, farmerAppointments]);

  const showStepNotice = (actionTitle) => {
    setNoticeMessage(`${actionTitle} feature is scheduled for subsequent steps upon approval.`);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  // 1. Render "My Cows" Page
  if (currentView === 'my-cows') {
    return (
      <MyCowsPage
        onBack={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
        onSelectCow={(id) => {
          setSelectedCowId(id);
          setCurrentView('cow-profile');
        }}
        onAddCow={() => setCurrentView('add-cow')}
        roleContext="farmer"
      />
    );
  }

  // 2. Render "Add Cow" Page
  if (currentView === 'add-cow') {
    return (
      <AddCowPage
        onBack={() => setCurrentView('my-cows')}
        onSaveSuccess={(newCow, message) => {
          setSelectedCowId(newCow.id);
          setCurrentView('cow-profile');
          setNoticeMessage(message);
          setTimeout(() => setNoticeMessage(null), 4000);
        }}
      />
    );
  }

  // 3. Render "Edit Cow" Page
  if (currentView === 'edit-cow' && editingCow) {
    return (
      <AddCowPage
        existingCow={editingCow}
        onBack={() => setCurrentView('cow-profile')}
        onSaveSuccess={(updatedCow, message) => {
          setSelectedCowId(updatedCow.id);
          setCurrentView('cow-profile');
          setNoticeMessage(message);
          setTimeout(() => setNoticeMessage(null), 4000);
        }}
      />
    );
  }

  // 4. Render "Cow Profile" Page
  if (currentView === 'cow-profile' && selectedCowId) {
    return (
      <CowProfilePage
        cowId={selectedCowId}
        onBack={() => setCurrentView('my-cows')}
        onEditCow={(cow) => {
          setEditingCow(cow);
          setCurrentView('edit-cow');
        }}
        onStartAssessment={(cowId) => {
          setAssessCowId(cowId);
          setCurrentView('assess');
        }}
        onLogFever={(cowId) => {
          setQuickActionCowId(cowId);
          setCurrentView('fever');
        }}
        onLogMilk={(cowId) => {
          setQuickActionCowId(cowId);
          setCurrentView('milk-log');
        }}
        onAddVaccine={(cowId) => {
          setQuickActionCowId(cowId);
          setCurrentView('vaccine');
        }}
        onOpenRecords={(cowId) => {
          setRecordsCowId(cowId);
          setCurrentView('records');
          setActiveBottomTab('records');
        }}
        onBookVet={(cowId) => {
          setBookVetCowId(cowId);
          setCurrentView('book-vet');
        }}
        roleContext="farmer"
      />
    );
  }

  // 5. Render "Assess Cow" Health Check Page
  if (currentView === 'assess') {
    return (
      <AssessCowPage
        initialCowId={assessCowId}
        onBack={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
        onComplete={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
      />
    );
  }

  // 6. Render "Fever Monitoring" Page
  if (currentView === 'fever') {
    return (
      <FeverMonitoringPage
        initialCowId={quickActionCowId}
        onBack={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
        onSaveSuccess={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
          setNoticeMessage('Body temperature measurement recorded successfully in local session.');
          setTimeout(() => setNoticeMessage(null), 4000);
        }}
      />
    );
  }

  // 7. Render "Milk Production Log" Page
  if (currentView === 'milk-log') {
    return (
      <MilkLogPage
        initialCowId={quickActionCowId}
        onBack={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
        onSaveSuccess={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
          setNoticeMessage('Daily milk production entry recorded successfully in local session.');
          setTimeout(() => setNoticeMessage(null), 4000);
        }}
      />
    );
  }

  // 8. Render "Vaccination & Care" Page
  if (currentView === 'vaccine') {
    return (
      <VaccineCarePage
        initialCowId={quickActionCowId}
        onBack={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
        onSaveSuccess={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
          setNoticeMessage('Vaccination & care treatment recorded successfully in local session.');
          setTimeout(() => setNoticeMessage(null), 4000);
        }}
      />
    );
  }

  // 9. Render "Health Records" Page
  if (currentView === 'records') {
    return (
      <HealthRecordsPage
        initialCowId={recordsCowId}
        onBack={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
        onOpenCowProfile={(cowId) => {
          setSelectedCowId(cowId);
          setCurrentView('cow-profile');
        }}
        onStartAssessment={(cowId) => {
          setAssessCowId(cowId);
          setCurrentView('assess');
        }}
        onLogFever={(cowId) => {
          setQuickActionCowId(cowId);
          setCurrentView('fever');
        }}
        onLogMilk={(cowId) => {
          setQuickActionCowId(cowId);
          setCurrentView('milk-log');
        }}
        onAddVaccine={(cowId) => {
          setQuickActionCowId(cowId);
          setCurrentView('vaccine');
        }}
        roleContext="farmer"
      />
    );
  }

  // 10. Render "Notifications" Page
  if (currentView === 'notifications') {
    return (
      <NotificationsPage
        onBack={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
        onOpenCowProfile={(cowId) => {
          setSelectedCowId(cowId);
          setCurrentView('cow-profile');
        }}
        onOpenCowRecords={(cowId) => {
          setRecordsCowId(cowId);
          setCurrentView('records');
          setActiveBottomTab('records');
        }}
        roleContext="farmer"
      />
    );
  }

  // 11. Render "Book a Vet" Page
  if (currentView === 'book-vet') {
    return (
      <BookVetPage
        preselectedCowId={bookVetCowId}
        onBack={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
        onViewAppointments={() => setCurrentView('my-appointments')}
      />
    );
  }

  // 12. Render "My Appointments" Page
  if (currentView === 'my-appointments') {
    return (
      <MyAppointmentsPage
        onBack={() => {
          setCurrentView('dashboard');
          setActiveBottomTab('home');
        }}
        onBookNewAppointment={() => {
          setBookVetCowId(null);
          setCurrentView('book-vet');
        }}
      />
    );
  }

  // Alert cow for the "Needs attention" highlight card
  const alertCow = cows.find((c) => c.status === 'alert') || cows[0];

  const handleSidebarNavigate = (view) => {
    if (view === 'dashboard' || view === 'home') {
      setCurrentView('dashboard');
      setActiveBottomTab('home');
    } else if (view === 'my-cows') {
      setCurrentView('my-cows');
      setActiveBottomTab('my-cows');
    } else if (view === 'add-cow') {
      setCurrentView('add-cow');
    } else if (view === 'assess') {
      setAssessCowId(null);
      setCurrentView('assess');
      setActiveBottomTab('assess');
    } else if (view === 'book-vet') {
      setBookVetCowId(null);
      setCurrentView('book-vet');
    } else if (view === 'milk-log') {
      setQuickActionCowId(null);
      setCurrentView('milk-log');
    } else if (view === 'records') {
      setRecordsCowId(null);
      setCurrentView('records');
      setActiveBottomTab('records');
    } else if (view === 'vaccine') {
      setQuickActionCowId(null);
      setCurrentView('vaccine');
    } else if (view === 'notifications') {
      setCurrentView('notifications');
    }
  };

  return (
    <div className="dashboard-page-layout farmer-theme">
      {/* Top App Bar matching Screen 1 from collage */}
      <DashboardHeader
        avatarInitials="RP"
        greetingName="Ramesh"
        subtitle={data.farmName}
        roleBadge="Farmer"
        unreadNotifications={unreadNotifCount}
        onOpenNotifications={() => setCurrentView('notifications')}
        onNavigate={handleSidebarNavigate}
      />

      {/* Main Responsive Body */}
      <main className="dashboard-main-content">
        {/* Feedback / Notification Banner */}
        {noticeMessage && (
          <div className="floating-feedback-toast" role="status">
            <Info size={16} />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* 1. Welcome Message & Farm Summary Hero */}
        <DashboardHeroBanner
          title={`${stats.healthy} of ${stats.total} cows are healthy`}
          subtitle={
            stats.alert > 0
              ? `Your herd has ${stats.alert} cow requiring immediate attention and ${stats.watch} under observation.`
              : `Your herd is in excellent health across all monitored pens.`
          }
          actionText="Start assessment"
          onActionClick={() => {
            setAssessCowId(null);
            setCurrentView('assess');
          }}
          statusItems={[
            { type: 'healthy', label: `${stats.healthy} Healthy` },
            { type: 'watch', label: `${stats.watch} Watch` },
            { type: 'alert', label: `${stats.alert} Alert` },
          ]}
          bannerTheme="farmer"
        />

        {/* 1. Compact Farm Summary Cards Grid */}
        <section className="farm-summary-cards-grid" aria-label="Farm Health and Herd Summary">
          {/* Total Cows */}
          <div
            className="farm-summary-card"
            onClick={() => {
              setCowFilter('all');
              setCurrentView('my-cows');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCowFilter('all');
                setCurrentView('my-cows');
              }
            }}
            role="button"
            tabIndex={0}
            title="View all registered cows"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box total">
                <Tractor size={20} />
              </div>
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{stats.total}</span>
              <span className="summary-card-label">Total Cows</span>
              <span className="summary-card-sub">Active registered herd</span>
            </div>
          </div>

          {/* Healthy Cows */}
          <div
            className="farm-summary-card"
            onClick={() => {
              setCowFilter('healthy');
              setCurrentView('my-cows');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCowFilter('healthy');
                setCurrentView('my-cows');
              }
            }}
            role="button"
            tabIndex={0}
            title="View healthy cows"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box healthy">
                <CheckCircle2 size={20} />
              </div>
              <span className="summary-badge-indicator healthy" />
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{stats.healthy}</span>
              <span className="summary-card-label">Healthy</span>
              <span className="summary-card-sub">
                {Math.round((stats.healthy / (stats.total || 1)) * 100)}% of herd
              </span>
            </div>
          </div>

          {/* Needs Attention */}
          <div
            className="farm-summary-card"
            onClick={() => {
              setCowFilter('alert');
              setCurrentView('my-cows');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCowFilter('alert');
                setCurrentView('my-cows');
              }
            }}
            role="button"
            tabIndex={0}
            title="View cows needing attention or observation"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box attention">
                <AlertTriangle size={20} />
              </div>
              {(stats.alert > 0 || stats.watch > 0) && (
                <span className="summary-badge-indicator attention" />
              )}
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{stats.alert + stats.watch}</span>
              <span className="summary-card-label">Needs Attention</span>
              <span className="summary-card-sub">
                {stats.alert} alert · {stats.watch} watch
              </span>
            </div>
          </div>

          {/* Upcoming Vet Appointments */}
          <div
            className="farm-summary-card"
            onClick={() => setCurrentView('my-appointments')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setCurrentView('my-appointments');
              }
            }}
            role="button"
            tabIndex={0}
            title="View upcoming veterinary appointments"
          >
            <div className="summary-card-top">
              <div className="summary-icon-box appointments">
                <Calendar size={20} />
              </div>
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{upcomingAppointments.length}</span>
              <span className="summary-card-label">Upcoming Vet</span>
              <span className="summary-card-sub">
                {upcomingAppointments.length > 0
                  ? `${upcomingAppointments.length} scheduled visit${upcomingAppointments.length > 1 ? 's' : ''}`
                  : 'No visits pending'}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Explore Features & Quick Actions (8 Consistent Cards) */}
        <section className="dashboard-section" aria-label="Explore and Quick Actions">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Explore & Quick Actions</h3>
              <p className="section-subtitle">Direct one-tap tools for dairy herd management</p>
            </div>
          </div>

          <div className="explore-features-grid">
            {/* 1. Health Check */}
            <div
              className="explore-feature-card"
              onClick={() => {
                setAssessCowId(null);
                setCurrentView('assess');
              }}
              role="button"
              tabIndex={0}
            >
              <div className="explore-icon-tile">
                <Camera size={20} strokeWidth={2} />
              </div>
              <div className="explore-content">
                <span className="explore-title">Health Check</span>
                <span className="explore-desc">AI udder screening & subclinical check</span>
              </div>
            </div>

            {/* 2. Book a Vet */}
            <div
              className="explore-feature-card"
              onClick={() => {
                setBookVetCowId(null);
                setCurrentView('book-vet');
              }}
              role="button"
              tabIndex={0}
            >
              <div className="explore-icon-tile">
                <Stethoscope size={20} strokeWidth={2} />
              </div>
              <div className="explore-content">
                <span className="explore-title">Book a Vet</span>
                <span className="explore-desc">Schedule farm visits with approved doctors</span>
              </div>
            </div>

            {/* 3. Milk Log */}
            <div
              className="explore-feature-card"
              onClick={() => {
                setQuickActionCowId(null);
                setCurrentView('milk-log');
              }}
              role="button"
              tabIndex={0}
            >
              <div className="explore-icon-tile">
                <Milk size={20} strokeWidth={2} />
              </div>
              <div className="explore-content">
                <span className="explore-title">Milk Log</span>
                <span className="explore-desc">Track daily AM & PM milking yields</span>
              </div>
            </div>

            {/* 4. Fever Monitor */}
            <div
              className="explore-feature-card"
              onClick={() => {
                setQuickActionCowId(null);
                setCurrentView('fever');
              }}
              role="button"
              tabIndex={0}
            >
              <div className="explore-icon-tile">
                <Thermometer size={20} strokeWidth={2} />
              </div>
              <div className="explore-content">
                <span className="explore-title">Fever & Vitals</span>
                <span className="explore-desc">Log temperature & illness symptoms</span>
              </div>
            </div>

            {/* 5. Vaccination */}
            <div
              className="explore-feature-card"
              onClick={() => {
                setQuickActionCowId(null);
                setCurrentView('vaccine');
              }}
              role="button"
              tabIndex={0}
            >
              <div className="explore-icon-tile">
                <Syringe size={20} strokeWidth={2} />
              </div>
              <div className="explore-content">
                <span className="explore-title">Vaccinations</span>
                <span className="explore-desc">Immunizations, deworming & boosters</span>
              </div>
            </div>

            {/* 6. Health Records */}
            <div
              className="explore-feature-card"
              onClick={() => {
                setRecordsCowId(null);
                setCurrentView('records');
                setActiveBottomTab('records');
              }}
              role="button"
              tabIndex={0}
            >
              <div className="explore-icon-tile">
                <FileText size={20} strokeWidth={2} />
              </div>
              <div className="explore-content">
                <span className="explore-title">Health Records</span>
                <span className="explore-desc">Clinical history & observation scans</span>
              </div>
            </div>

            {/* 7. Add Cow */}
            <div
              className="explore-feature-card"
              onClick={() => setCurrentView('add-cow')}
              role="button"
              tabIndex={0}
            >
              <div className="explore-icon-tile">
                <Plus size={20} strokeWidth={2} />
              </div>
              <div className="explore-content">
                <span className="explore-title">Add Cow</span>
                <span className="explore-desc">Register cattle tag, breed & lactation</span>
              </div>
            </div>

            {/* 8. My Appointments */}
            <div
              className="explore-feature-card"
              onClick={() => setCurrentView('my-appointments')}
              role="button"
              tabIndex={0}
            >
              <div className="explore-icon-tile">
                <Calendar size={20} strokeWidth={2} />
              </div>
              <div className="explore-content">
                <span className="explore-title">Appointments</span>
                <span className="explore-desc">Manage upcoming & past veterinarian visits</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Veterinary Consultations / Upcoming Appointment Card */}
        <section className="dashboard-section" aria-label="Veterinary Consultations">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Veterinary Consultations</h3>
              <p className="section-subtitle">Farm visits and clinic checkups with KYC-approved doctors</p>
            </div>
            <div className="section-header-actions">
              <button
                type="button"
                className="section-link-btn"
                onClick={() => setCurrentView('my-appointments')}
                style={{ marginRight: 8 }}
              >
                My Appointments ({farmerAppointments.length})
              </button>
              <button
                type="button"
                className="btn-add-cow-inline"
                onClick={() => {
                  setBookVetCowId(null);
                  setCurrentView('book-vet');
                }}
              >
                <Stethoscope size={15} />
                <span>Book a Vet</span>
              </button>
            </div>
          </div>

          {upcomingAppointments.length > 0 ? (
            <div className="appointments-feed">
              {upcomingAppointments.slice(0, 2).map((apt) => (
                <div
                  key={apt.id}
                  className="appointment-item-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setCurrentView('my-appointments')}
                >
                  <div className="appointment-card-top">
                    <div className="appointment-header-details">
                      <div className="appointment-date-badge">
                        <span className="date-day-large">{new Date(apt.date).getDate()}</span>
                        <span className="date-month-small">
                          {new Date(apt.date).toLocaleString(undefined, { month: 'short' })}
                        </span>
                      </div>
                      <div className="appointment-header-copy">
                        <h3>{apt.vetName}</h3>
                        <span className="appointment-time-tag">
                          <Clock size={13} />
                          <strong>{apt.timeSlot}</strong> • {apt.cowName} (Tag: {apt.cowTag}) • {apt.visitType}
                        </span>
                      </div>
                    </div>
                    <span className={`badge-pill ${apt.status === 'accepted' ? 'healthy' : 'watch'}`}>
                      {apt.status === 'accepted' ? 'Confirmed Visit' : 'Pending Confirmation'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="add-cow-showcase-card" style={{ background: 'var(--color-surface-subtle)' }}>
              <div className="add-cow-icon-box" style={{ background: 'var(--color-surface-mint)', color: 'var(--color-primary)' }}>
                <Stethoscope size={24} />
              </div>
              <div className="add-cow-copy">
                <h4>Schedule a Bovine Health Consultation</h4>
                <p>Request an on-site dairy farm visit or clinic evaluation with approved veterinarians.</p>
              </div>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => {
                  setBookVetCowId(null);
                  setCurrentView('book-vet');
                }}
              >
                <Stethoscope size={15} />
                <span>Book a Vet</span>
              </button>
            </div>
          )}
        </section>

        {/* 4. Milk Production Chart (Last 7 Days) */}
        <section className="dashboard-section" aria-label="Milk Production Chart">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Milk Production (Last 7 Days)</h3>
              <p className="section-subtitle">Aggregated daily yields based on actual saved milk records</p>
            </div>
            <button
              type="button"
              className="section-link-btn"
              onClick={() => {
                setQuickActionCowId(null);
                setCurrentView('milk-log');
              }}
            >
              + Log Milk
            </button>
          </div>

          {milkChartData.hasData ? (
            <div className="milk-chart-card">
              {/* Stats summary banner */}
              <div className="milk-chart-stats-strip">
                <div className="milk-chart-stat-item">
                  <span className="milk-stat-lbl">7-Day Total</span>
                  <span className="milk-stat-val">{milkChartData.total7Days} L</span>
                </div>
                <div className="milk-chart-stat-item">
                  <span className="milk-stat-lbl">Daily Average</span>
                  <span className="milk-stat-val">{milkChartData.avg7Days} L / day</span>
                </div>
                {milkChartData.peakDay && milkChartData.peakDay.yieldLiters > 0 && (
                  <div className="milk-chart-stat-item">
                    <span className="milk-stat-lbl">Peak Yield</span>
                    <span className="milk-stat-val">
                      {milkChartData.peakDay.yieldLiters} L ({milkChartData.peakDay.dateFormatted})
                    </span>
                  </div>
                )}
                <div className="milk-chart-stat-item">
                  <span className="milk-stat-lbl">Latest Recorded</span>
                  <span className="milk-stat-val">
                    {stats.totalMilkToday || (cows[0]?.milkYieldPerDay ? `${cows[0].milkYieldPerDay} L` : '—')}
                  </span>
                </div>
              </div>

              {/* 7-Day Bar Chart */}
              <div className="milk-bar-chart-container">
                <div className="milk-bar-chart" role="img" aria-label="7-Day Milk Production Bar Chart">
                  {milkChartData.days.map((day) => {
                    const heightPercent =
                      day.yieldLiters > 0
                        ? Math.max(8, Math.round((day.yieldLiters / milkChartData.maxYield) * 100))
                        : 0;
                    const isSelected = activeMilkDayIndex === day.dateStr;

                    return (
                      <div
                        key={day.dateStr}
                        className={`milk-bar-col ${isSelected ? 'active-inspected' : ''}`}
                        onClick={() => setActiveMilkDayIndex(isSelected ? null : day.dateStr)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveMilkDayIndex(isSelected ? null : day.dateStr);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                        title={`Click to inspect ${day.dateFormatted}: ${day.yieldLiters} L`}
                      >
                        <span className={`milk-bar-val-badge ${isSelected ? 'selected-badge' : ''}`}>
                          {day.yieldLiters > 0 ? `${day.yieldLiters} L` : '—'}
                        </span>
                        <div className="milk-bar-fill-track">
                          <div
                            className={`milk-bar-fill-bar ${day.yieldLiters === 0 ? 'zero-yield' : ''}`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <div className="milk-bar-date-meta">
                          <span className="milk-bar-day-name">{day.dayLabel}</span>
                          <span className="milk-bar-date-str">{day.dateFormatted}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeMilkDayIndex && (() => {
                  const selDay = milkChartData.days.find((d) => d.dateStr === activeMilkDayIndex);
                  if (!selDay) return null;
                  return (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'var(--color-surface-subtle)',
                        border: '1px solid var(--color-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          {selDay.dateFormatted} ({selDay.dayLabel})
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>· Total Recorded:</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{selDay.yieldLiters} Liters</span>
                      </div>
                      <button
                        type="button"
                        className="section-link-btn"
                        style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        onClick={() => setActiveMilkDayIndex(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <Milk size={22} />
              </div>
              <h4 className="empty-state-title">No milk logs recorded for the last 7 days</h4>
              <p className="empty-state-desc">
                Record daily morning and evening milk volumes to visualize 7-day production trends and track individual cow contributions.
              </p>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => {
                  setQuickActionCowId(null);
                  setCurrentView('milk-log');
                }}
              >
                <Plus size={16} />
                <span>Record First Milking</span>
              </button>
            </div>
          )}

          {/* Cow Milk Contributions Table */}
          <div className="milk-contributions-table-card" style={{ marginTop: 14 }}>
            <table className="milk-table">
              <thead>
                <tr>
                  <th>Cow</th>
                  <th>Tag ID</th>
                  <th>Morning</th>
                  <th>Evening</th>
                  <th>Latest Recorded</th>
                </tr>
              </thead>
              <tbody>
                {cows.slice(0, 5).map((c) => {
                  const latestLog = c.milkLogs?.[0];
                  const morning = latestLog?.morningMilk ?? c.morningMilk ?? Math.round((c.milkYieldPerDay || 14) * 0.55);
                  const evening = latestLog?.eveningMilk ?? c.eveningMilk ?? Math.round((c.milkYieldPerDay || 14) * 0.45);
                  const total = latestLog?.totalMilk != null ? `${latestLog.totalMilk} L` : (c.milkYieldPerDay ? `${c.milkYieldPerDay} L` : c.milkToday || '—');

                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedCowId(c.id);
                        setCurrentView('cow-profile');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="font-semibold">{c.name}</td>
                      <td className="text-muted">{c.tagId}</td>
                      <td>{morning} L</td>
                      <td>{evening} L</td>
                      <td className="font-bold text-primary">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Health Alerts Section */}
        <section className="dashboard-section" aria-label="Health Alerts and Clinical Reminders">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Health Alerts</h3>
              <p className="section-subtitle">Real-time clinical warnings, mastitis screening flags, and due vaccinations</p>
            </div>
            <button
              type="button"
              className="section-link-btn"
              onClick={() => setCurrentView('notifications')}
            >
              View All ({healthAlerts.length})
            </button>
          </div>

          {healthAlerts.length > 0 ? (
            <div className="health-alerts-list">
              {healthAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`health-alert-card ${alert.type}`}
                  onClick={() => {
                    if (alert.cowId) {
                      setSelectedCowId(alert.cowId);
                      setCurrentView(alert.actionView || 'cow-profile');
                    } else if (alert.actionView) {
                      setCurrentView(alert.actionView);
                    }
                  }}
                >
                  <div className="health-alert-left">
                    <div className={`health-alert-icon-wrap ${alert.type}`}>
                      {alert.iconType === 'thermometer' && <Thermometer size={18} />}
                      {alert.iconType === 'camera' && <Camera size={18} />}
                      {alert.iconType === 'syringe' && <Syringe size={18} />}
                    </div>
                    <div className="health-alert-text">
                      <div className="health-alert-header-row">
                        <span className="health-alert-title">{alert.title}</span>
                        <span className={`badge-pill ${alert.type === 'alert' ? 'alert' : alert.type === 'watch' ? 'watch' : 'role-veterinarian'}`}>
                          {alert.badge}
                        </span>
                      </div>
                      <span className="health-alert-desc">{alert.issue}</span>
                      <span className="health-alert-date">
                        <Clock size={12} /> {alert.date}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="chevron-icon" />
                </div>
              ))}
            </div>
          ) : (
            <div className="health-alerts-clear-card">
              <CheckCircle2 size={32} className="text-success" />
              <div>
                <h4>All Clear: No Active Clinical Alerts</h4>
                <p>Your herd has no high fever warnings, mastitis flags, or overdue vaccinations recorded at this time.</p>
              </div>
            </div>
          )}
        </section>

        {/* 6. Recent Activity Section */}
        <section className="dashboard-section" aria-label="Recent Activity">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Recent Activity</h3>
              <p className="section-subtitle">Real-time timeline of health scans, milk logs, and vet appointments</p>
            </div>
            <button
              type="button"
              className="section-link-btn"
              onClick={() => {
                setRecordsCowId(null);
                setCurrentView('records');
                setActiveBottomTab('records');
              }}
            >
              View All Records
            </button>
          </div>

          {recentActivities.length > 0 ? (
            <div className="recent-activity-list">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="activity-feed-item"
                  onClick={() => {
                    if (act.cowId) {
                      setSelectedCowId(act.cowId);
                      setCurrentView(act.targetView || 'cow-profile');
                    } else if (act.targetView) {
                      setCurrentView(act.targetView);
                    }
                  }}
                >
                  <div className="activity-feed-left">
                    <div className={`activity-icon-badge ${act.type}`}>
                      {act.type === 'milk' && <Milk size={16} />}
                      {act.type === 'assessment' && <Camera size={16} />}
                      {act.type === 'fever' && <Thermometer size={16} />}
                      {act.type === 'vaccine' && <Syringe size={16} />}
                      {act.type === 'appointment' && <Calendar size={16} />}
                    </div>
                    <div className="activity-details">
                      <span className="activity-title">{act.title}</span>
                      <span className="activity-desc">{act.description}</span>
                    </div>
                  </div>
                  <div className="activity-feed-right">
                    <span className="activity-date-tag">
                      <Clock size={12} style={{ display: 'inline', marginRight: 3 }} />
                      {act.date}
                    </span>
                    <ChevronRight size={16} className="chevron-icon" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <Activity size={20} />
              </div>
              <h4 className="empty-state-title">No recent activity recorded</h4>
              <p className="empty-state-desc">
                Recorded milk entries, vital checks, AI assessments, and appointments will appear here automatically.
              </p>
            </div>
          )}
        </section>

        {/* 7. Your Cows Section (Improved Cards matching Screen 2) */}
        <section className="dashboard-section" aria-label="My Cows Overview">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Your Cows</h3>
              <p className="section-subtitle">Manage individual cattle, health statuses, and milk yields</p>
            </div>
            <div className="section-header-actions">
              <button
                type="button"
                className="section-link-btn"
                onClick={() => setCurrentView('my-cows')}
                style={{ marginRight: 8 }}
              >
                View All ({stats.total})
              </button>
              <button
                type="button"
                className="btn-add-cow-inline"
                onClick={() => setCurrentView('add-cow')}
              >
                <Plus size={16} />
                <span>Add Cow</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="cows-filter-pills" role="tablist">
            <button
              type="button"
              className={`filter-pill ${cowFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCowFilter('all')}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              className={`filter-pill ${cowFilter === 'healthy' ? 'active' : ''}`}
              onClick={() => setCowFilter('healthy')}
            >
              Healthy ({stats.healthy})
            </button>
            <button
              type="button"
              className={`filter-pill ${cowFilter === 'watch' ? 'active' : ''}`}
              onClick={() => setCowFilter('watch')}
            >
              Watch ({stats.watch})
            </button>
            <button
              type="button"
              className={`filter-pill ${cowFilter === 'alert' ? 'active' : ''}`}
              onClick={() => setCowFilter('alert')}
            >
              Alert ({stats.alert})
            </button>
          </div>

          {/* Cow Cards List Preview */}
          <div className="cows-list-grid">
            {filteredCows.length > 0 ? (
              filteredCows.slice(0, 5).map((cow) => {
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
                      setSelectedCowId(cow.id);
                      setCurrentView('cow-profile');
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
                        </div>
                      </div>
                    </div>

                    <div className="cow-card-right-group">
                      <button
                        type="button"
                        className="btn-view-profile-inline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCowId(cow.id);
                          setCurrentView('cow-profile');
                        }}
                      >
                        <span>View Profile</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state-card" style={{ padding: '20px' }}>
                <p className="empty-state-desc">No cows found in this status filter.</p>
              </div>
            )}
          </div>
        </section>

        {/* 8. Add Cow Showcase Card (Screen 3) */}
        <section className="dashboard-section" aria-label="Add Cow Feature">
          <div className="add-cow-showcase-card">
            <div className="add-cow-icon-box">
              <Plus size={24} />
            </div>
            <div className="add-cow-copy">
              <h4>Add New Cow to Herd</h4>
              <p>Register tag ID, breed, age, weight, lactation status, and baseline health scans.</p>
            </div>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => setCurrentView('add-cow')}
            >
              <Plus size={16} />
              <span>Add Cow</span>
            </button>
          </div>
        </section>

        {/* 9. Mastitis Health Check Feature (Screen 4 & 5) */}
        <section className="dashboard-section" aria-label="Mastitis Health Check">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Mastitis Health Check</h3>
              <p className="section-subtitle">AI-assisted udder screening & subclinical detection</p>
            </div>
            <span className="badge-pill healthy">AI Model v2.1</span>
          </div>

          <div className="mastitis-check-card">
            <div className="mastitis-left">
              <div className="mastitis-status-icon">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <div className="mastitis-copy">
                <span className="mastitis-latest-tag">Latest Completed Assessment</span>
                <h4>Ganga · Tag 001</h4>
                <p>No signs of mastitis detected (94% confidence) · Cleared on 15 Oct</p>
              </div>
            </div>
            <div className="mastitis-right">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setAssessCowId(null);
                  setCurrentView('assess');
                }}
              >
                <Camera size={16} />
                <span>New Assessment</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation matching Screen 1 */}
      <DashboardBottomNav
        activeTab={activeBottomTab}
        onTabClick={(tabId) => {
          setActiveBottomTab(tabId);
          if (tabId === 'my-cows') {
            setCurrentView('my-cows');
          } else if (tabId === 'home') {
            setCurrentView('dashboard');
          } else if (tabId === 'assess') {
            setAssessCowId(null);
            setCurrentView('assess');
          } else if (tabId === 'records') {
            setRecordsCowId(null);
            setCurrentView('records');
          } else if (tabId === 'profile') {
            setShowProfileModal(true);
          } else {
            showStepNotice(`Tab [${tabId.toUpperCase()}]`);
          }
        }}
      />

      {/* Farmer Profile & Account Modal */}
      {showProfileModal && (
        <div
          className="appointment-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setShowProfileModal(false);
            setActiveBottomTab('home');
          }}
        >
          <div
            className="appointment-modal-box"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                  Farmer & Herd Profile
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Registered Dairy Operator & Herd Ownership
                </span>
              </div>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => {
                  setShowProfileModal(false);
                  setActiveBottomTab('home');
                }}
                aria-label="Close profile modal"
              >
                ✕
              </button>
            </div>

            {/* Farmer Identity Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px',
                background: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-subtle)',
                marginTop: '12px',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  flexShrink: 0,
                }}
              >
                {currentUser?.avatarInitials || 'RP'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {currentUser?.fullName || 'Ramesh Patil'}
                  </h4>
                  <span className="badge-pill healthy" style={{ fontSize: '10px' }}>
                    Verified Farmer
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {currentUser?.farmName || data.farmName || 'Patil Dairy Farm'}
                </div>
              </div>
            </div>

            {/* Farm Contact Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '8px',
                marginTop: '14px',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                <Mail size={15} color="var(--color-primary)" />
                <span>{currentUser?.email || 'farmer@bovicare.com'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                <Phone size={15} color="var(--color-primary)" />
                <span>{currentUser?.phone || '+91 98765 43210'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                <MapPin size={15} color="var(--color-primary)" />
                <span>Kolhapur District, Maharashtra · Registered Dairy</span>
              </div>
            </div>

            {/* Herd Snapshot Metrics */}
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Herd Health Snapshot
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '6px' }}>
                <div style={{ textAlign: 'center', padding: '10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stats.total}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Total</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid var(--color-success-border)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success-text)' }}>{stats.healthy}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-success-text)', fontWeight: 600 }}>Healthy</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: '#FEFCE8', borderRadius: '8px', border: '1px solid #FEF08A' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#A16207' }}>{stats.watch}</div>
                  <div style={{ fontSize: '10px', color: '#A16207', fontWeight: 600 }}>Watch</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#B91C1C' }}>{stats.alert}</div>
                  <div style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 600 }}>Alert</div>
                </div>
              </div>
            </div>

            {/* Quick Actions inside Profile */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="sidebar-nav-link"
                style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', background: '#FFFFFF' }}
                onClick={() => {
                  setShowProfileModal(false);
                  setCurrentView('my-cows');
                  setActiveBottomTab('my-cows');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Tractor size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>View Full Herd Roster ({stats.total} Cattle)</span>
                </div>
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                className="sidebar-nav-link"
                style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', background: '#FFFFFF' }}
                onClick={() => {
                  setShowProfileModal(false);
                  setCurrentView('my-appointments');
                  setActiveBottomTab('home');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Veterinary Appointments ({farmerAppointments.length})</span>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Sign Out Action */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-danger btn-sm"
                style={{ gap: '6px' }}
                onClick={() => {
                  setShowProfileModal(false);
                  logout();
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setShowProfileModal(false);
                  setActiveBottomTab('home');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
