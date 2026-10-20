import React, { createContext, useContext, useState, useEffect } from 'react';
import { USER_ROLES } from '../data/roles';
import { PROTOTYPE_USERS, DEFAULT_PROTOTYPE_PASSWORD } from '../data/mockUsers';
import { getKycByEmail } from '../services/kycService';
import {
  findAccountByIdentifier,
  AUTHORIZED_ADMIN_EMAILS,
  verifyRolePermission,
} from '../services/userService';

const AuthContext = createContext(null);

const STORAGE_KEY = 'bovicare_prototype_session';

export function AuthProvider({ children }) {
  // Currently chosen portal/role on the login screen
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.FARMER);

  // Authenticated user object (null when logged out)
  const [currentUser, setCurrentUser] = useState(null);

  // Current view route: '/login' or '/dashboard/farmer' | '/dashboard/vet' | '/dashboard/admin' | '/vet/kyc-status'
  const [currentRoute, setCurrentRoute] = useState('/login');

  // Load saved session on initial mount if available
  useEffect(() => {
    try {
      const savedSession = sessionStorage.getItem(STORAGE_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.user) {
          let userObj = parsed.user;

          // SECURITY VERIFICATION: Ensure Admin role is restricted to explicitly authorized admin accounts
          if (userObj.role === USER_ROLES.ADMIN) {
            const isAuthorizedAdmin = AUTHORIZED_ADMIN_EMAILS.includes((userObj.email || '').toLowerCase());
            if (!isAuthorizedAdmin) {
              console.warn('Security Alert: Unauthorized administrator session detected. Session revoked.');
              sessionStorage.removeItem(STORAGE_KEY);
              return;
            }
          }

          // Sync latest KYC verification status for veterinarians
          if (userObj.role === USER_ROLES.VET) {
            const kycApp = getKycByEmail(userObj.email);
            if (kycApp) {
              userObj = { ...userObj, kycStatus: kycApp.status };
            } else if (userObj.id === 'user-vet-01' || userObj.email === 'vet@bovicare.com') {
              userObj = { ...userObj, kycStatus: 'approved' };
            } else {
              userObj = { ...userObj, kycStatus: userObj.kycStatus || 'pending' };
            }
          }

          setCurrentUser(userObj);
          setSelectedRole(userObj.role);
          const dest = (userObj.role === USER_ROLES.VET && userObj.kycStatus !== 'approved')
            ? '/vet/kyc-status'
            : `/dashboard/${userObj.role}`;
          setCurrentRoute(dest);
        }
      }
    } catch (err) {
      console.warn('Could not restore prototype session:', err);
    }
  }, []);

  /**
   * Trusted Authentication Handler
   * Active role is strictly determined by the authenticated user's account record,
   * never from user-editable frontend state or URL parameters.
   */
  const login = async (identifier, password, portalRole = null, explicitKycStatus = null) => {
    const trimmedId = (identifier || '').trim().toLowerCase();
    const cleanPhone = (identifier || '').replace(/\D/g, '');

    // Basic empty checks
    if (!trimmedId) {
      return { success: false, error: 'Please enter your email address or mobile number.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your account password.' };
    }

    // Lookup user in trusted account store by identifier (email or phone)
    let matchedUser = findAccountByIdentifier(trimmedId) || findAccountByIdentifier(cleanPhone);

    if (matchedUser) {
      // Validate password
      if (password !== matchedUser.password && password !== DEFAULT_PROTOTYPE_PASSWORD) {
        return {
          success: false,
          error: 'Incorrect password. In prototype mode, default password is: password123',
        };
      }

      // SECURITY ENFORCEMENT: Portal Role Check
      // If user attempted to log in via a specific portal tab (e.g. Admin or Vet),
      // verify that their trusted account role is authorized for that portal.
      if (portalRole && matchedUser.role !== portalRole) {
        const portalName = portalRole === 'vet' ? 'Veterinarian' : portalRole.charAt(0).toUpperCase() + portalRole.slice(1);
        const userRoleName = matchedUser.role === 'vet' ? 'Veterinarian' : matchedUser.role.charAt(0).toUpperCase() + matchedUser.role.slice(1);
        return {
          success: false,
          error: `Access Denied: Account '${matchedUser.fullName}' is registered with the ${userRoleName} role. You do not have permissions to access the ${portalName} portal.`,
        };
      }

      // SECURITY ENFORCEMENT: Admin Role Verification
      // Ensure only whitelisted admin emails can ever receive Admin privileges
      if (matchedUser.role === USER_ROLES.ADMIN) {
        const isAuthorizedAdmin = AUTHORIZED_ADMIN_EMAILS.includes(matchedUser.email.toLowerCase());
        if (!isAuthorizedAdmin) {
          return {
            success: false,
            error: 'Security Error: Unauthorized administrator credentials.',
          };
        }
      }

      // Check and attach latest KYC verification status for veterinarians
      if (matchedUser.role === USER_ROLES.VET) {
        let kycStatus = explicitKycStatus;
        if (!kycStatus) {
          const kycApp = getKycByEmail(trimmedId);
          if (kycApp) {
            kycStatus = kycApp.status;
          } else if (matchedUser.id === 'user-vet-01' || trimmedId === 'vet@bovicare.com') {
            kycStatus = 'approved';
          } else {
            kycStatus = matchedUser.kycStatus || 'pending';
          }
        }
        matchedUser = { ...matchedUser, kycStatus };
      }
    } else {
      // Unrecognized account attempting Admin login
      if (portalRole === USER_ROLES.ADMIN || selectedRole === USER_ROLES.ADMIN) {
        return {
          success: false,
          error: 'Access Denied: Unregistered accounts cannot access the Administrator Console. Admin accounts must be explicitly provisioned by system operations.',
        };
      }

      // In prototype mode, default custom accounts strictly to FARMER, never Admin
      const assignedRole = portalRole === USER_ROLES.VET ? USER_ROLES.VET : USER_ROLES.FARMER;
      let kycStatus = assignedRole === USER_ROLES.VET ? (explicitKycStatus || 'pending') : undefined;

      matchedUser = {
        id: `user-${assignedRole}-${Date.now()}`,
        role: assignedRole,
        fullName: assignedRole === USER_ROLES.FARMER ? 'Dairy Farm Operator' : 'Clinical Veterinarian',
        email: trimmedId.includes('@') ? trimmedId : `${trimmedId}@dairyfarm.local`,
        phone: cleanPhone.length > 5 ? identifier : '+91 98765 00000',
        farmName: assignedRole === USER_ROLES.FARMER ? 'BoviCare Demo Farm' : undefined,
        avatarInitials: assignedRole.substring(0, 2).toUpperCase(),
        isCustomPrototypeUser: true,
        kycStatus,
      };
    }

    // Role is determined strictly from the trusted account record (matchedUser.role)
    const authenticatedRole = matchedUser.role;

    setCurrentUser(matchedUser);
    setSelectedRole(authenticatedRole);

    const dest = (authenticatedRole === USER_ROLES.VET && matchedUser.kycStatus !== 'approved')
      ? '/vet/kyc-status'
      : `/dashboard/${authenticatedRole}`;
    setCurrentRoute(dest);

    // Save session
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: matchedUser, timestamp: Date.now() })
      );
    } catch (e) {
      // storage unavailable
    }

    return { success: true, user: matchedUser, destination: dest };
  };

  /**
   * Sign out and return to Login screen
   */
  const logout = () => {
    setCurrentUser(null);
    setCurrentRoute('/login');
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  /**
   * Switch route between destinations (with strict role authorization guard)
   * A user CANNOT gain permissions simply by navigating to a different dashboard route.
   */
  const navigateTo = (route) => {
    if (route === '/login') {
      logout();
      return;
    }

    // Role Guard: Check if route is a dashboard destination
    if (route.startsWith('/dashboard/')) {
      const requestedRole = route.replace('/dashboard/', '');
      
      if (!currentUser) {
        // Not logged in -> redirect to login with that role selected for convenience
        setSelectedRole(requestedRole);
        setCurrentRoute('/login');
        return;
      }

      // STRICT AUTHORIZATION CHECK:
      // If the authenticated account's verified role does not match the requested dashboard role,
      // prevent access. Permissions are strictly tied to currentUser.role, never to route or selector.
      if (currentUser.role !== requestedRole) {
        console.warn(`Authorization Denied: Account '${currentUser.fullName}' (${currentUser.role}) does not have permission to access /dashboard/${requestedRole}.`);
        // We set the route to the unauthorized guard path so the UI explicitly warns the user
        setCurrentRoute(`/unauthorized?attempted=${requestedRole}&actual=${currentUser.role}`);
        return;
      }

      // KYC AUTHORIZATION CHECK FOR VETERINARIANS:
      if (requestedRole === 'vet' && currentUser.role === USER_ROLES.VET && currentUser.kycStatus && currentUser.kycStatus !== 'approved') {
        setCurrentRoute('/vet/kyc-status');
        return;
      }
    }

    setCurrentRoute(route);
  };

  /**
   * Password Recovery Request
   * Validates format and checks authentication provider status
   * Secure design: Does not leak account existence or plaintext passwords
   */
  const requestPasswordReset = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // Strict format validation
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered email address.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email format (e.g., name@domain.com).' };
    }

    // Simulate standard asynchronous network latency to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Return transparent architectural status (no fake email claims)
    return {
      success: true,
      email: cleanEmail,
      isRealEmailServiceConfigured: false,
      message: 'If an account is associated with this email, password recovery instructions will be processed.',
    };
  };

  const value = {
    selectedRole,
    setSelectedRole,
    currentUser,
    isAuthenticated: !!currentUser,
    currentRoute,
    login,
    logout,
    navigateTo,
    requestPasswordReset,
    prototypeMode: true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
