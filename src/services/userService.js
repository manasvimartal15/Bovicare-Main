/**
 * BoviCare User Account & Authorization Service
 * Enforces role assignment, account validation, and permissions security
 */

import { USER_ROLES } from '../data/roles.js';
import { PROTOTYPE_USERS, DEFAULT_PROTOTYPE_PASSWORD } from '../data/mockUsers.js';

const USERS_STORAGE_KEY = 'bovicare_registered_users';

// Explicitly authorized system administrator accounts
// Admin role CANNOT be self-registered or dynamically provisioned by clients
export const AUTHORIZED_ADMIN_EMAILS = [
  'admin@bovicare.com',
];

/**
 * Get registered accounts from localStorage merged with baseline prototype accounts
 */
export function getAllAccounts() {
  let stored = [];
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (raw) {
        stored = JSON.parse(raw);
      }
    }
  } catch (e) {
    console.warn('Could not read registered accounts from localStorage:', e);
  }

  // Merge stored accounts with PROTOTYPE_USERS, ensuring PROTOTYPE_USERS take baseline precedence
  const map = new Map();
  PROTOTYPE_USERS.forEach((u) => map.set(u.email.toLowerCase(), u));
  stored.forEach((u) => {
    // Sanitize any stored account to prevent unauthorized admin role persistence
    if (u.role === USER_ROLES.ADMIN && !AUTHORIZED_ADMIN_EMAILS.includes((u.email || '').toLowerCase())) {
      u.role = USER_ROLES.FARMER;
    }
    map.set(u.email.toLowerCase(), u);
  });

  return Array.from(map.values());
}

/**
 * Save accounts to localStorage
 */
function saveAccounts(accounts) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch (e) {
    console.warn('Could not save accounts to localStorage:', e);
  }
}

/**
 * Find account by email or phone identifier
 */
export function findAccountByIdentifier(identifier) {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/\D/g, '');

  const accounts = getAllAccounts();
  return accounts.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (cleanPhone.length >= 6 && (u.phone || '').replace(/\D/g, '') === cleanPhone)
  ) || null;
}

/**
 * Register a new user account (Farmer or Veterinarian ONLY)
 * Strictly prevents self-assignment of the Admin role
 */
export function registerAccount({ fullName, emailOrPhone, role, farmName = '' }) {
  if (!fullName || !fullName.trim()) {
    return { success: false, error: 'Full name is required.' };
  }
  if (!emailOrPhone || !emailOrPhone.trim()) {
    return { success: false, error: 'Email or phone number is required.' };
  }

  // SECURITY ENFORCEMENT: Disallow Admin self-registration
  if (role === USER_ROLES.ADMIN || role === 'admin') {
    return {
      success: false,
      error: 'Security Violation: Administrator accounts cannot be self-registered. Role assignment requires authorized governance provisioning.',
    };
  }

  const cleanInput = emailOrPhone.trim();
  const isEmail = cleanInput.includes('@');
  const cleanEmail = isEmail ? cleanInput.toLowerCase() : `${cleanInput.replace(/\D/g, '')}@dairyfarm.local`;
  const cleanPhone = !isEmail ? cleanInput : '+91 98765 00000';

  // Check if account already exists
  const existing = findAccountByIdentifier(cleanInput);
  if (existing) {
    return {
      success: false,
      error: `An account already exists for ${cleanInput}. Please sign in with your credentials.`,
    };
  }

  const assignedRole = role === USER_ROLES.VET ? USER_ROLES.VET : USER_ROLES.FARMER;

  const newAccount = {
    id: `user-${assignedRole}-${Date.now()}`,
    role: assignedRole,
    fullName: fullName.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    farmName: assignedRole === USER_ROLES.FARMER ? (farmName.trim() || 'Dairy Farm') : undefined,
    avatarInitials: fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join(''),
    password: DEFAULT_PROTOTYPE_PASSWORD,
    registeredAt: new Date().toISOString(),
    isRegisteredUser: true,
  };

  const stored = getAllAccounts().filter((a) => !PROTOTYPE_USERS.some((p) => p.email.toLowerCase() === a.email.toLowerCase()));
  stored.push(newAccount);
  saveAccounts(stored);

  return { success: true, user: newAccount };
}

/**
 * Validate that an authenticated user has authorization for a specific action/route
 */
export function verifyRolePermission(user, requiredRole) {
  if (!user || !user.role) return false;

  // Exact role match required
  if (user.role !== requiredRole) return false;

  // Extra verification for Administrator role
  if (requiredRole === USER_ROLES.ADMIN) {
    return AUTHORIZED_ADMIN_EMAILS.includes((user.email || '').toLowerCase());
  }

  return true;
}
