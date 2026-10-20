/**
 * BoviCare Prototype Demo Users
 * Explicitly marked for prototype authentication & testing
 */

import { USER_ROLES } from './roles.js';

export const PROTOTYPE_USERS = [
  {
    id: 'user-farmer-01',
    role: USER_ROLES.FARMER,
    fullName: 'Ramesh Patil',
    email: 'farmer@bovicare.com',
    phone: '+91 98765 43210',
    farmName: 'Patil Dairy Farm',
    location: 'Pune, Maharashtra',
    herdSize: 24,
    avatarInitials: 'RP',
    password: 'password123',
  },
  {
    id: 'user-vet-01',
    role: USER_ROLES.VET,
    fullName: 'Dr. Rajesh Sharma',
    email: 'vet@bovicare.com',
    phone: '+91 98123 45678',
    specialization: 'Bovine Health Specialist (MVSc)',
    clinicName: 'Western Dairy Veterinary Services',
    avatarInitials: 'RS',
    password: 'password123',
  },
  {
    id: 'user-admin-01',
    role: USER_ROLES.ADMIN,
    fullName: 'Sunita Rao',
    email: 'admin@bovicare.com',
    phone: '+91 98999 11223',
    department: 'Platform & Dairy Network Operations',
    avatarInitials: 'SR',
    password: 'password123',
  },
];

export const DEFAULT_PROTOTYPE_PASSWORD = 'password123';
