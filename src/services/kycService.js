/**
 * BoviCare Veterinarian KYC & Credential Verification Service
 * Handles KYC applications, document metadata, and review statuses
 */

const KYC_STORAGE_KEY = 'bovicare_vet_kyc_data';

// Initial pre-seeded demo KYC applications
const INITIAL_KYC_APPLICATIONS = [
  {
    id: 'kyc-vet-01',
    userId: 'user-vet-01',
    fullName: 'Dr. Rajesh Sharma',
    email: 'vet@bovicare.com',
    phone: '+91 98123 45678',
    qualification: 'BVSc & AH, MVSc (Bovine Clinical Medicine)',
    licenseNumber: 'VET-MH-2019-441',
    issuingAuthority: 'Maharashtra State Veterinary Council (MSVC)',
    expiryDate: '2028-12-31',
    isPermanent: false,
    clinicName: 'Western Dairy Veterinary Services',
    state: 'Maharashtra',
    status: 'approved', // Approved - Full access
    submittedAt: '2024-02-03T10:00:00Z',
    reviewedAt: '2024-02-04T14:30:00Z',
    reviewedBy: 'Sunita Rao (Admin)',
    documents: [
      {
        id: 'doc-01',
        type: 'reg_certificate',
        title: 'Veterinary Registration Certificate',
        fileName: 'MSVC_Reg_Cert_Sharma.pdf',
        fileType: 'application/pdf',
        fileSize: '2.4 MB',
        uploadedAt: '2024-02-03T10:00:00Z',
        isSample: true,
      },
      {
        id: 'doc-02',
        type: 'degree_certificate',
        title: 'Qualification Degree (BVSc & AH)',
        fileName: 'MVSc_Degree_Bombay_Vet_College.pdf',
        fileType: 'application/pdf',
        fileSize: '3.1 MB',
        uploadedAt: '2024-02-03T10:00:00Z',
        isSample: true,
      },
    ],
  },
  {
    id: 'kyc-vet-02',
    userId: 'user-vet-02',
    fullName: 'Dr. Priya Nair',
    email: 'p.nair@bovicare.vet',
    phone: '+91 98220 77665',
    qualification: 'BVSc & AH (Bovine Health)',
    licenseNumber: 'VET-MH-2022-882',
    issuingAuthority: 'Veterinary Council of India (VCI)',
    expiryDate: '2027-06-30',
    isPermanent: false,
    clinicName: 'Priya Bovine Clinic',
    state: 'Maharashtra',
    status: 'pending', // Pending Verification - Awaiting Admin Review
    submittedAt: '2024-10-19T11:20:00Z',
    reviewedAt: null,
    reviewedBy: null,
    documents: [
      {
        id: 'doc-03',
        type: 'reg_certificate',
        title: 'Veterinary Registration Certificate',
        fileName: 'VCI_License_Registration_PriyaNair.pdf',
        fileType: 'application/pdf',
        fileSize: '1.8 MB',
        uploadedAt: '2024-10-19T11:20:00Z',
        isSample: true,
      },
      {
        id: 'doc-04',
        type: 'degree_certificate',
        title: 'Qualification Degree (BVSc & AH)',
        fileName: 'BVSc_Degree_Certificate_Nair.jpg',
        fileType: 'image/jpeg',
        fileSize: '2.1 MB',
        uploadedAt: '2024-10-19T11:20:00Z',
        isSample: true,
      },
    ],
  },
];

/**
 * Load KYC applications from localStorage or defaults
 */
export function getKycApplications() {
  try {
    const raw = localStorage.getItem(KYC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read KYC data from localStorage:', e);
  }
  return INITIAL_KYC_APPLICATIONS;
}

/**
 * Save KYC applications to localStorage
 */
function saveKycApplications(apps) {
  try {
    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.warn('Could not save KYC data to localStorage:', e);
  }
}

/**
 * Get KYC application by email
 */
export function getKycByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const apps = getKycApplications();
  return apps.find((a) => a.email.toLowerCase() === cleanEmail) || null;
}

/**
 * Get KYC application by ID
 */
export function getKycById(id) {
  if (!id) return null;
  const apps = getKycApplications();
  return apps.find((a) => a.id === id) || null;
}

/**
 * Submit a new Vet KYC application
 */
export function submitVetKyc(kycPayload) {
  const apps = getKycApplications();
  const cleanEmail = (kycPayload.email || '').trim().toLowerCase();

  // Check if application for this email already exists
  const existingIdx = apps.findIndex((a) => a.email.toLowerCase() === cleanEmail);

  const newApp = {
    id: existingIdx >= 0 ? apps[existingIdx].id : `kyc-${Date.now()}`,
    userId: kycPayload.userId || `user-vet-${Date.now()}`,
    fullName: kycPayload.fullName || 'Veterinarian Applicant',
    email: cleanEmail,
    phone: kycPayload.phone || '',
    qualification: kycPayload.qualification || '',
    licenseNumber: kycPayload.licenseNumber || '',
    issuingAuthority: kycPayload.issuingAuthority || 'State Veterinary Council',
    expiryDate: kycPayload.isPermanent ? 'Permanent / Lifetime' : (kycPayload.expiryDate || 'N/A'),
    isPermanent: !!kycPayload.isPermanent,
    clinicName: kycPayload.clinicName || 'Private Practice',
    state: kycPayload.state || 'Maharashtra',
    status: 'pending', // Pending Verification
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    adminNotes: null,
    documents: kycPayload.documents || [],
  };

  if (existingIdx >= 0) {
    apps[existingIdx] = newApp;
  } else {
    apps.unshift(newApp);
  }

  saveKycApplications(apps);
  return { success: true, application: newApp };
}

/**
 * Approve a Vet KYC application (Admin Action)
 */
export function approveKyc(applicationId, adminNotes = '', actingUser = null) {
  if (actingUser && (actingUser.role !== 'admin' || (actingUser.email || '').toLowerCase() !== 'admin@bovicare.com')) {
    return { success: false, error: 'Security Authorization Error: Only verified Administrators can approve veterinarian KYC credentials.' };
  }

  const apps = getKycApplications();
  const idx = apps.findIndex((a) => a.id === applicationId);

  if (idx < 0) {
    return { success: false, error: 'Application not found.' };
  }

  apps[idx] = {
    ...apps[idx],
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: actingUser?.fullName ? `${actingUser.fullName} (Admin)` : 'Sunita Rao (Admin)',
    adminNotes: adminNotes || 'All statutory credentials and council registration verified.',
    rejectionReason: null,
  };

  saveKycApplications(apps);
  return { success: true, application: apps[idx] };
}

/**
 * Reject a Vet KYC application (Admin Action - requires rejection reason)
 */
export function rejectKyc(applicationId, reason, adminNotes = '', actingUser = null) {
  if (actingUser && (actingUser.role !== 'admin' || (actingUser.email || '').toLowerCase() !== 'admin@bovicare.com')) {
    return { success: false, error: 'Security Authorization Error: Only verified Administrators can reject veterinarian KYC credentials.' };
  }

  if (!reason || !reason.trim()) {
    return { success: false, error: 'A specific rejection reason is required.' };
  }

  const apps = getKycApplications();
  const idx = apps.findIndex((a) => a.id === applicationId);

  if (idx < 0) {
    return { success: false, error: 'Application not found.' };
  }

  apps[idx] = {
    ...apps[idx],
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewedBy: actingUser?.fullName ? `${actingUser.fullName} (Admin)` : 'Sunita Rao (Admin)',
    rejectionReason: reason.trim(),
    adminNotes: (adminNotes || '').trim(),
  };

  saveKycApplications(apps);
  return { success: true, application: apps[idx] };
}

/**
 * Request Document Resubmission (Admin Action)
 */
export function requestKycResubmission(applicationId, reason, notes = '', actingUser = null) {
  if (actingUser && (actingUser.role !== 'admin' || (actingUser.email || '').toLowerCase() !== 'admin@bovicare.com')) {
    return { success: false, error: 'Security Authorization Error: Only verified Administrators can request document resubmission.' };
  }

  const apps = getKycApplications();
  const idx = apps.findIndex((a) => a.id === applicationId);

  if (idx < 0) {
    return { success: false, error: 'Application not found.' };
  }

  apps[idx] = {
    ...apps[idx],
    status: 'resubmission_required',
    reviewedAt: new Date().toISOString(),
    reviewedBy: actingUser?.fullName ? `${actingUser.fullName} (Admin)` : 'Sunita Rao (Admin)',
    rejectionReason: reason || 'Document clarification requested.',
    adminNotes: notes,
  };

  saveKycApplications(apps);
  return { success: true, application: apps[idx] };
}
