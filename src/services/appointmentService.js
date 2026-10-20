/**
 * BoviCare Vet Appointment Booking Service
 * Handles scheduling, availability slots, conflict detection, and status workflows
 * Persists data via localStorage (mirroring project's existing client storage architecture)
 */

import { getKycApplications } from './kycService.js';

const APPOINTMENTS_STORAGE_KEY = 'bovicare_appointments_data';
const VET_AVAILABILITY_STORAGE_KEY = 'bovicare_vet_availability_data';

// Standard consultation time slots
export const DEFAULT_TIME_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '12:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
];

export const VISIT_TYPES = {
  FARM_VISIT: 'Farm Visit (On-site inspection)',
  CLINIC_VISIT: 'Clinic Visit (At veterinary center)',
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

/**
 * Retrieve all approved veterinarians eligible to accept appointments
 * Enforces that only vets with KYC status === 'approved' are returned
 */
export function getApprovedVeterinarians() {
  const allKyc = getKycApplications();
  return allKyc
    .filter((k) => k.status === 'approved')
    .map((k) => ({
      id: k.id,
      userId: k.userId,
      fullName: k.fullName,
      email: k.email,
      phone: k.phone,
      qualification: k.qualification,
      licenseNumber: k.licenseNumber,
      issuingAuthority: k.issuingAuthority,
      clinicName: k.clinicName,
      state: k.state,
      consultationTypes: [VISIT_TYPES.FARM_VISIT, VISIT_TYPES.CLINIC_VISIT],
      experienceYears: '8+ Years',
      rating: '4.9 ★',
    }));
}

/**
 * Get all stored appointments
 */
export function getAllAppointments() {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read appointments from storage:', e);
  }
  return [];
}

/**
 * Save appointments to storage
 */
function saveAppointments(appointments) {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.warn('Could not save appointments to storage:', e);
  }
}

/**
 * Retrieve appointments for a specific farmer (by email or user ID)
 */
export function getAppointmentsForFarmer(farmerEmail) {
  if (!farmerEmail) return [];
  const cleanEmail = farmerEmail.trim().toLowerCase();
  const all = getAllAppointments();
  return all.filter((a) => (a.farmerEmail || '').toLowerCase() === cleanEmail);
}

/**
 * Retrieve appointments for a specific veterinarian (by vet email, vet userId, or vetId)
 */
export function getAppointmentsForVet(vetEmail, vetUserId = null) {
  const cleanEmail = (vetEmail || '').trim().toLowerCase();
  const all = getAllAppointments();
  return all.filter(
    (a) =>
      (a.vetEmail || '').toLowerCase() === cleanEmail ||
      (vetUserId && a.vetUserId === vetUserId)
  );
}

/**
 * Retrieve configured availability for a veterinarian
 */
export function getVetAvailability(vetEmail) {
  if (!vetEmail) return { timeSlots: DEFAULT_TIME_SLOTS, workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
  try {
    const raw = localStorage.getItem(VET_AVAILABILITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[vetEmail.toLowerCase()]) {
        return parsed[vetEmail.toLowerCase()];
      }
    }
  } catch (e) {
    // fallback
  }
  return {
    timeSlots: DEFAULT_TIME_SLOTS,
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  };
}

/**
 * Save veterinarian availability configuration
 */
export function saveVetAvailability(vetEmail, availabilityConfig) {
  if (!vetEmail) return { success: false, error: 'Vet email is required.' };
  try {
    const raw = localStorage.getItem(VET_AVAILABILITY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[vetEmail.toLowerCase()] = availabilityConfig;
    localStorage.setItem(VET_AVAILABILITY_STORAGE_KEY, JSON.stringify(parsed));
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to save availability configuration.' };
  }
}

/**
 * Check if a date string is in the past (before today's local date)
 */
export function isDateInPast(dateStr) {
  if (!dateStr) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

/**
 * Get available time slots for a vet on a specific date
 * Filters out slots that are already booked (status pending or accepted)
 */
export function getAvailableSlotsForVet(vetEmail, dateStr) {
  if (!vetEmail || !dateStr || isDateInPast(dateStr)) {
    return [];
  }

  const availability = getVetAvailability(vetEmail);
  const allSlots = availability.timeSlots || DEFAULT_TIME_SLOTS;

  // Find existing active appointments for this vet on this date
  const cleanEmail = vetEmail.trim().toLowerCase();
  const appointments = getAllAppointments().filter(
    (a) =>
      (a.vetEmail || '').toLowerCase() === cleanEmail &&
      a.date === dateStr &&
      [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED].includes(a.status)
  );

  const bookedSlots = appointments.map((a) => a.timeSlot);

  return allSlots.map((slot) => ({
    slot,
    isAvailable: !bookedSlots.includes(slot),
  }));
}

/**
 * Book a new Vet appointment
 * Strictly validates role, KYC approval, past dates, and slot overlapping
 */
export function createAppointment({
  farmerUser,
  vet,
  cow,
  date,
  timeSlot,
  visitType,
  symptoms,
}) {
  // 1. Authenticated Farmer Role Check
  if (!farmerUser || farmerUser.role !== 'farmer') {
    return {
      success: false,
      error: 'Security authorization failed: Only registered dairy farmers can schedule veterinary consultations.',
    };
  }

  // 2. Approved Vet KYC Check
  const approvedVets = getApprovedVeterinarians();
  const isApproved = approvedVets.some(
    (v) => (v.email || '').toLowerCase() === (vet.email || '').toLowerCase()
  );
  if (!isApproved) {
    return {
      success: false,
      error: 'Security authorization failed: Selected veterinarian is not currently approved for clinical consultations.',
    };
  }

  // 3. Cow validation
  if (!cow || !cow.id || !cow.name) {
    return { success: false, error: 'Please select a valid cow from your herd registry.' };
  }

  // 4. Date validation (must not be past date)
  if (!date || isDateInPast(date)) {
    return { success: false, error: 'Appointment date must be today or a future date.' };
  }

  // 5. Time slot validation
  if (!timeSlot) {
    return { success: false, error: 'Please select an available consultation time slot.' };
  }

  // 6. Double-booking check: verify slot availability again before saving
  const existingAppointments = getAllAppointments();
  const cleanVetEmail = (vet.email || '').toLowerCase();
  const hasConflict = existingAppointments.some(
    (a) =>
      (a.vetEmail || '').toLowerCase() === cleanVetEmail &&
      a.date === date &&
      a.timeSlot === timeSlot &&
      [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED].includes(a.status)
  );

  if (hasConflict) {
    return {
      success: false,
      error: `The ${timeSlot} slot on ${date} was just reserved by another farmer. Please pick a different slot.`,
    };
  }

  // Create new appointment record
  const newAppointment = {
    id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    // Farmer info
    farmerId: farmerUser.id,
    farmerName: farmerUser.fullName || 'Dairy Farm Operator',
    farmerEmail: (farmerUser.email || '').toLowerCase(),
    farmerPhone: farmerUser.phone || '+91 98765 00000',
    farmName: farmerUser.farmName || 'BoviCare Dairy Farm',
    farmLocation: farmerUser.location || 'Maharashtra',
    // Vet info
    vetId: vet.id,
    vetUserId: vet.userId || vet.id,
    vetName: vet.fullName,
    vetEmail: (vet.email || '').toLowerCase(),
    vetPhone: vet.phone,
    vetLicense: vet.licenseNumber,
    vetClinic: vet.clinicName,
    vetQualification: vet.qualification,
    // Cow info
    cowId: cow.id,
    cowName: cow.name,
    cowTag: cow.tagId,
    cowBreed: cow.breed,
    cowStatus: cow.status,
    cowPhotoUrl: cow.photoUrl || null,
    // Appointment details
    date,
    timeSlot,
    visitType: visitType || VISIT_TYPES.FARM_VISIT,
    symptoms: (symptoms || '').trim() || 'General health evaluation & routine clinical checkup.',
    status: APPOINTMENT_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    statusUpdatedAt: new Date().toISOString(),
    rejectionReason: null,
    completionNotes: null,
  };

  existingAppointments.unshift(newAppointment);
  saveAppointments(existingAppointments);

  return { success: true, appointment: newAppointment };
}

/**
 * Update appointment status (Vet Action: Accept / Reject / Complete)
 */
export function updateAppointmentStatus({
  appointmentId,
  vetUser,
  newStatus,
  reason = null,
  notes = null,
}) {
  const appointments = getAllAppointments();
  const idx = appointments.findIndex((a) => a.id === appointmentId);

  if (idx < 0) {
    return { success: false, error: 'Appointment not found.' };
  }

  const apt = appointments[idx];

  // Enforce vet authorization: only the assigned vet or an admin can update status
  const isAssignedVet =
    vetUser &&
    (vetUser.email || '').toLowerCase() === (apt.vetEmail || '').toLowerCase();
  const isAdmin = vetUser && vetUser.role === 'admin';

  if (!isAssignedVet && !isAdmin) {
    return {
      success: false,
      error: 'Security authorization failed: You are not authorized to update this appointment.',
    };
  }

  // Prevent overlap when accepting:
  if (newStatus === APPOINTMENT_STATUS.ACCEPTED) {
    const hasOverlap = appointments.some(
      (a) =>
        a.id !== appointmentId &&
        (a.vetEmail || '').toLowerCase() === (apt.vetEmail || '').toLowerCase() &&
        a.date === apt.date &&
        a.timeSlot === apt.timeSlot &&
        a.status === APPOINTMENT_STATUS.ACCEPTED
    );

    if (hasOverlap) {
      return {
        success: false,
        error: `Schedule conflict: You have already accepted another appointment on ${apt.date} at ${apt.timeSlot}. You cannot accept overlapping appointments.`,
      };
    }
  }

  // Rejection requires a mandatory reason
  if (newStatus === APPOINTMENT_STATUS.REJECTED && (!reason || !reason.trim())) {
    return {
      success: false,
      error: 'A specific explanation or reason is required when declining an appointment.',
    };
  }

  appointments[idx] = {
    ...apt,
    status: newStatus,
    statusUpdatedAt: new Date().toISOString(),
    rejectionReason: newStatus === APPOINTMENT_STATUS.REJECTED ? reason.trim() : apt.rejectionReason,
    completionNotes: newStatus === APPOINTMENT_STATUS.COMPLETED ? (notes || '').trim() : apt.completionNotes,
  };

  saveAppointments(appointments);
  return { success: true, appointment: appointments[idx] };
}

/**
 * Cancel appointment (Farmer Action)
 */
export function cancelAppointmentByFarmer(appointmentId, farmerEmail) {
  const appointments = getAllAppointments();
  const idx = appointments.findIndex((a) => a.id === appointmentId);

  if (idx < 0) {
    return { success: false, error: 'Appointment not found.' };
  }

  const apt = appointments[idx];
  const cleanEmail = (farmerEmail || '').toLowerCase();

  // Enforce ownership
  if ((apt.farmerEmail || '').toLowerCase() !== cleanEmail) {
    return {
      success: false,
      error: 'Security authorization failed: You can only cancel your own appointments.',
    };
  }

  if (apt.status === APPOINTMENT_STATUS.COMPLETED) {
    return { success: false, error: 'Completed appointments cannot be cancelled.' };
  }

  if (apt.status === APPOINTMENT_STATUS.CANCELLED) {
    return { success: false, error: 'Appointment is already cancelled.' };
  }

  appointments[idx] = {
    ...apt,
    status: APPOINTMENT_STATUS.CANCELLED,
    statusUpdatedAt: new Date().toISOString(),
  };

  saveAppointments(appointments);
  return { success: true, appointment: appointments[idx] };
}
