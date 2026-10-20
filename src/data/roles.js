/**
 * BoviCare User Roles Definition
 * Step 1: Login & Role Selection
 */

export const USER_ROLES = {
  FARMER: 'farmer',
  VET: 'vet',
  ADMIN: 'admin',
};

export const ROLE_DEFINITIONS = [
  {
    id: USER_ROLES.FARMER,
    title: 'Farmer',
    tagline: 'Farm & Cow Management',
    description: 'Monitor herd health status, record daily milk yields, capture udder scans, and view mastitis assessments.',
    badge: 'Cattle Care',
    iconName: 'Tractor',
    colorAccent: '#1A3D2F',
    destinationRoute: '/dashboard/farmer',
    destinationName: 'Farmer Dashboard',
    primaryFeatures: [
      'Herd roster & individual cow profiles',
      'Daily milk log & bulk trend tracker',
      'AI mastitis image assessment scanner',
      'Vaccination & care schedules'
    ],
  },
  {
    id: USER_ROLES.VET,
    title: 'Veterinarian',
    tagline: 'Animal Health & Clinical Review',
    description: 'Review flagged cow health alerts, inspect diagnostic scan findings, confirm clinical cases, and prescribe treatments.',
    badge: 'Clinical Care',
    iconName: 'Stethoscope',
    colorAccent: '#1D6847',
    destinationRoute: '/dashboard/vet',
    destinationName: 'Veterinarian Dashboard',
    primaryFeatures: [
      'Triage queue for watch & alert cases',
      'Deep AI confidence & thermal review',
      'Clinical treatment & Rx logging',
      'Farm health compliance reporting'
    ],
  },
  {
    id: USER_ROLES.ADMIN,
    title: 'Admin',
    tagline: 'User & System Management',
    description: 'Manage dairy farm accounts, veterinarian licenses, platform permissions, AI model telemetry, and system settings.',
    badge: 'System Ops',
    iconName: 'ShieldCheck',
    colorAccent: '#174A36',
    destinationRoute: '/dashboard/admin',
    destinationName: 'Admin Dashboard',
    primaryFeatures: [
      'Farm & veterinarian registry',
      'Role-based access & credentials',
      'Diagnostic telemetry & audit trail',
      'Global system & device configuration'
    ],
  },
];
