import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CowsProvider } from './context/CowsContext';
import LoginForm from './components/auth/LoginForm';
import FarmerDashboard from './components/dashboards/FarmerDashboard';
import VetDashboard from './components/dashboards/VetDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import UnauthorizedView from './components/common/UnauthorizedView';
import VetKycStatusView from './components/vet/VetKycStatusView';
import { USER_ROLES } from './data/roles';

function AppContent() {
  const { currentRoute, currentUser, isAuthenticated } = useAuth();

  // 1. If not authenticated, show the Login and Role Selection interface
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // 2. If an unauthorized route was attempted, show the security role guard view
  if (currentRoute.startsWith('/unauthorized')) {
    const urlParams = new URLSearchParams(currentRoute.split('?')[1] || '');
    const attempted = urlParams.get('attempted') || 'requested';
    const actual = urlParams.get('actual') || currentUser?.role || 'user';
    return <UnauthorizedView attemptedRole={attempted} actualRole={actual} />;
  }

  // 3. Strict Role-Based Routing
  // The authenticated account's verified role strictly governs which dashboard is rendered:
  if (currentUser?.role === USER_ROLES.VET) {
    // If veterinarian license is not yet approved (pending, rejected, or resubmission), gate access to KYC Status View
    if (currentUser.kycStatus && currentUser.kycStatus !== 'approved') {
      return <VetKycStatusView />;
    }
    return <VetDashboard />;
  }

  if (currentUser?.role === USER_ROLES.ADMIN) {
    return <AdminDashboard />;
  }

  // Default to Farmer Dashboard for farmer accounts
  return <FarmerDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <CowsProvider>
        <AppContent />
      </CowsProvider>
    </AuthProvider>
  );
}
