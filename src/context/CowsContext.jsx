import React, { createContext, useContext, useState, useEffect } from 'react';

const CowsContext = createContext(null);
const STORAGE_KEY = 'bovicare_cows_inventory';

// Initial enriched demo cows
// Helper to generate default fever logs if missing
const getDefaultFeverLogs = (cow) => {
  const isHigh = cow.status === 'alert';
  const isWatch = cow.status === 'watch';
  const baseTemp = isHigh ? 39.8 : isWatch ? 38.9 : 38.5;

  return [
    {
      id: `fever-${cow.id}-1`,
      date: isHigh ? '2024-10-20' : '2024-10-18',
      time: '08:30 AM',
      temperature: baseTemp.toFixed(1),
      symptoms: isHigh
        ? ['Warm or Swollen Udder', 'Loss of Appetite / Low Feed', 'Drop in Milk Yield', 'Lethargy / Dullness']
        : isWatch
        ? ['Drop in Milk Yield', 'Loss of Appetite / Low Feed']
        : ['Normal Behavior / Alert'],
      notes: isHigh
        ? 'High body temperature observed during morning milking. Right hind udder quadrant warm.'
        : isWatch
        ? 'Mild temperature fluctuation. Monitoring feed intake.'
        : 'Routine physiological health check. Baseline normal.',
      recordedAt: new Date().toISOString(),
    },
    {
      id: `fever-${cow.id}-2`,
      date: '2024-10-10',
      time: '09:00 AM',
      temperature: '38.4',
      symptoms: ['Normal Behavior / Alert'],
      notes: 'Weekly baseline check.',
      recordedAt: new Date().toISOString(),
    },
  ];
};

// Helper to generate default milk logs if missing
const getDefaultMilkLogs = (cow) => {
  const daily = cow.milkYieldPerDay || 14;
  const m1 = cow.morningMilk || Math.round(daily * 0.55 * 10) / 10;
  const e1 = cow.eveningMilk || Math.round(daily * 0.45 * 10) / 10;
  return [
    {
      id: `milk-${cow.id}-1`,
      date: '2024-10-20',
      morningMilk: m1,
      eveningMilk: e1,
      totalMilk: daily,
      notes: 'Standard double milking session. Clean milk conductivity.',
      recordedAt: new Date().toISOString(),
    },
    {
      id: `milk-${cow.id}-2`,
      date: '2024-10-19',
      morningMilk: Math.round((m1 - 0.2) * 10) / 10,
      eveningMilk: Math.round((e1 + 0.1) * 10) / 10,
      totalMilk: daily,
      notes: 'Normal feed intake and water consumption.',
      recordedAt: new Date().toISOString(),
    },
    {
      id: `milk-${cow.id}-3`,
      date: '2024-10-18',
      morningMilk: Math.round((m1 + 0.3) * 10) / 10,
      eveningMilk: Math.round((e1 - 0.1) * 10) / 10,
      totalMilk: Math.round((daily + 0.2) * 10) / 10,
      notes: 'Consistent daily production yield.',
      recordedAt: new Date().toISOString(),
    },
  ];
};

// Helper to ensure cow records have all collections
const ensureCowDefaults = (cow) => ({
  ...cow,
  feverLogs: Array.isArray(cow.feverLogs) && cow.feverLogs.length > 0 ? cow.feverLogs : getDefaultFeverLogs(cow),
  milkLogs: Array.isArray(cow.milkLogs) && cow.milkLogs.length > 0 ? cow.milkLogs : getDefaultMilkLogs(cow),
  vaccinations: Array.isArray(cow.vaccinations) ? cow.vaccinations : [],
});

// Initial enriched demo cows
const INITIAL_DEMO_COWS = [
  {
    id: 'cow-001',
    tagId: 'Tag 001',
    name: 'Ganga',
    breed: 'Holstein Friesian',
    gender: 'Female (Milking Cow)',
    ageYears: 4,
    dateOfBirth: '2020-04-12',
    weightKg: 480,
    milkYieldPerDay: 18,
    milkToday: '18 L',
    morningMilk: 10,
    eveningMilk: 8,
    dateOfRegistration: '2024-01-15',
    lactationStatus: 'Lactating (2nd Lactation)',
    status: 'healthy',
    statusLabel: 'Healthy',
    temperature: '38.5 °C',
    lastAssessment: '15 Oct 2024 · Low Risk',
    photoUrl: null,
    avatarColor: '#17733E',
    notes: 'High-performing milker with steady somatic cell counts. Very docile and responsive.',
    assessments: [
      {
        id: 'asm-001-1',
        date: '15 Oct 2024, 09:00 AM',
        result: 'Low Risk',
        status: 'healthy',
        condition: 'Healthy udder symmetry and normal milk flow. No mastitis symptoms detected.',
        confidence: '94%',
        assessedBy: 'Dr. Rajesh Sharma (Clinical Visit)',
      },
      {
        id: 'asm-001-2',
        date: '28 Sep 2024, 08:30 AM',
        result: 'Low Risk',
        status: 'healthy',
        condition: 'Clear milk conductivity, no teat lesions.',
        confidence: '95%',
        assessedBy: 'Ramesh Patil (Routine Scan)',
      },
    ],
    feverLogs: [
      {
        id: 'fever-001-1',
        date: '2024-10-18',
        time: '08:00 AM',
        temperature: '38.5',
        symptoms: ['Normal Behavior / Alert'],
        notes: 'Morning milking temperature reading. Normal baseline.',
        recordedAt: '2024-10-18T08:00:00.000Z',
      },
      {
        id: 'fever-001-2',
        date: '2024-10-11',
        time: '08:30 AM',
        temperature: '38.4',
        symptoms: ['Normal Behavior / Alert'],
        notes: 'Pre-milking physical check.',
        recordedAt: '2024-10-11T08:30:00.000Z',
      },
    ],
    milkLogs: [
      {
        id: 'milk-001-1',
        date: '2024-10-20',
        morningMilk: 10,
        eveningMilk: 8,
        totalMilk: 18,
        notes: 'Standard morning and evening milking sessions.',
        recordedAt: '2024-10-20T17:30:00.000Z',
      },
      {
        id: 'milk-001-2',
        date: '2024-10-19',
        morningMilk: 9.8,
        eveningMilk: 8.2,
        totalMilk: 18,
        notes: 'Clean milk consistency, good lactation flow.',
        recordedAt: '2024-10-19T17:30:00.000Z',
      },
      {
        id: 'milk-001-3',
        date: '2024-10-18',
        morningMilk: 10.2,
        eveningMilk: 7.9,
        totalMilk: 18.1,
        notes: 'High solids and butterfat content.',
        recordedAt: '2024-10-18T17:30:00.000Z',
      },
    ],
    vaccinations: [
      { id: 'vac-1', title: 'FMD Vaccination (Cycle 2)', date: '2024-04-10', nextDueDate: '2024-10-10', status: 'Completed', administrator: 'Veterinary Dept', notes: 'Bivalent FMD subcutaneous injection.' },
      { id: 'vac-2', title: 'Deworming (Albendazole)', date: '2024-07-15', nextDueDate: '2024-10-25', status: 'Due Soon', administrator: 'Farm Staff', notes: 'Oral drench administered post-morning feed.' },
      { id: 'vac-3', title: 'FMD Booster', date: '2024-10-20', nextDueDate: '2025-04-20', status: 'Due Today', administrator: 'Dr. Sharma', notes: 'Scheduled booster for herd immunization.' },
    ],
  },
  {
    id: 'cow-002',
    tagId: 'Tag 002',
    name: 'Lakshmi',
    breed: 'Gir (Indigenous Dairy)',
    gender: 'Female (Milking Cow)',
    ageYears: 5,
    dateOfBirth: '2019-06-20',
    weightKg: 420,
    milkYieldPerDay: 12,
    milkToday: '12 L',
    morningMilk: 7,
    eveningMilk: 5,
    dateOfRegistration: '2024-01-15',
    lactationStatus: 'Lactating (3rd Lactation)',
    status: 'healthy',
    statusLabel: 'Healthy',
    temperature: '38.6 °C',
    lastAssessment: '16 Oct 2024 · Normal',
    photoUrl: null,
    avatarColor: '#17733E',
    notes: 'Resilient indigenous breed, excellent A2 milk quality, very heat tolerant.',
    assessments: [
      {
        id: 'asm-002-1',
        date: '16 Oct 2024, 10:15 AM',
        result: 'Low Risk',
        status: 'healthy',
        condition: 'Normal teat elasticity and somatic cell count within ideal range.',
        confidence: '91%',
        assessedBy: 'Ramesh Patil',
      },
    ],
    feverLogs: [
      {
        id: 'fever-002-1',
        date: '2024-10-16',
        time: '09:15 AM',
        temperature: '38.6',
        symptoms: ['Normal Behavior / Alert'],
        notes: 'Routine health scan. Normal baseline.',
        recordedAt: '2024-10-16T09:15:00.000Z',
      },
    ],
    milkLogs: [
      {
        id: 'milk-002-1',
        date: '2024-10-20',
        morningMilk: 7,
        eveningMilk: 5,
        totalMilk: 12,
        notes: 'Healthy intake, rich A2 milk yield.',
        recordedAt: '2024-10-20T17:30:00.000Z',
      },
    ],
    vaccinations: [
      { id: 'vac-4', title: 'FMD Vaccination', date: '2024-04-10', nextDueDate: '2024-10-10', status: 'Completed', administrator: 'Dr. Sharma', notes: 'Routine immunization.' },
      { id: 'vac-5', title: 'Black Quarter Vaccine', date: '2024-05-12', nextDueDate: '2024-11-12', status: 'Scheduled', administrator: 'Veterinary Dept', notes: 'Annual clostridial bacterin vaccination.' },
    ],
  },
  {
    id: 'cow-021',
    tagId: 'Tag 021',
    name: 'Kaveri',
    breed: 'Jersey Cross',
    gender: 'Female (Milking Cow)',
    ageYears: 3.5,
    dateOfBirth: '2021-03-05',
    weightKg: 400,
    milkYieldPerDay: 8,
    milkToday: '8 L',
    morningMilk: 5,
    eveningMilk: 3,
    dateOfRegistration: '2024-02-10',
    lactationStatus: 'Lactating (1st Lactation)',
    status: 'alert',
    statusLabel: 'Needs Attention',
    temperature: '39.8 °C',
    lastAssessment: '20 Oct 2024 · High Risk (Mastitis)',
    photoUrl: null,
    avatarColor: '#C53030',
    issue: 'High temperature & right rear udder swelling',
    notes: 'Detected with sudden temperature rise and localized heat in right hind udder quadrant. Isolated from bulk tank.',
    assessments: [
      {
        id: 'asm-021-1',
        date: '20 Oct 2024, 10:30 AM',
        result: 'High Risk',
        status: 'alert',
        condition: 'Acute udder inflammation & elevated temperature (39.8 °C). Clot traces in foremilk.',
        confidence: '92%',
        assessedBy: 'AI Scanner & Triage Flag',
        requiresVetReview: true,
      },
      {
        id: 'asm-021-2',
        date: '10 Oct 2024, 09:00 AM',
        result: 'Watch',
        status: 'watch',
        condition: 'Mild conductivity fluctuation in right teat.',
        confidence: '79%',
        assessedBy: 'Ramesh Patil',
      },
    ],
    feverLogs: [
      {
        id: 'fever-021-1',
        date: '2024-10-20',
        time: '10:00 AM',
        temperature: '39.8',
        symptoms: ['Warm or Swollen Udder', 'Loss of Appetite / Low Feed', 'Drop in Milk Yield', 'Lethargy / Dullness'],
        notes: 'High fever spike. Right rear quarter swollen and painful to touch. Isolated for clinical examination.',
        recordedAt: '2024-10-20T10:00:00.000Z',
      },
      {
        id: 'fever-021-2',
        date: '2024-10-19',
        time: '06:00 PM',
        temperature: '38.9',
        symptoms: ['Loss of Appetite / Low Feed'],
        notes: 'Slightly warm ears in evening.',
        recordedAt: '2024-10-19T18:00:00.000Z',
      },
    ],
    milkLogs: [
      {
        id: 'milk-021-1',
        date: '2024-10-20',
        morningMilk: 5,
        eveningMilk: 3,
        totalMilk: 8,
        notes: 'Sharp drop in yield due to acute udder heat. Milk discarded.',
        recordedAt: '2024-10-20T17:30:00.000Z',
      },
      {
        id: 'milk-021-2',
        date: '2024-10-19',
        morningMilk: 7.5,
        eveningMilk: 6.5,
        totalMilk: 14,
        notes: 'Slight yield reduction observed.',
        recordedAt: '2024-10-19T17:30:00.000Z',
      },
    ],
    vaccinations: [
      { id: 'vac-6', title: 'FMD Vaccination', date: '2024-04-10', nextDueDate: '2024-10-10', status: 'Completed', administrator: 'Dr. Sharma', notes: 'Cycle 2 vaccination.' },
      { id: 'vac-7', title: 'Brucellosis Strain 19', date: '2023-11-20', nextDueDate: '', status: 'Completed', administrator: 'Veterinary Dept', notes: 'Calfhood vaccination certification.' },
    ],
  },
  {
    id: 'cow-009',
    tagId: 'Tag 009',
    name: 'Nandini',
    breed: 'HF Cross',
    gender: 'Female (Milking Cow)',
    ageYears: 3,
    dateOfBirth: '2021-09-18',
    weightKg: 410,
    milkYieldPerDay: 10,
    milkToday: '10 L',
    morningMilk: 6,
    eveningMilk: 4,
    dateOfRegistration: '2024-03-01',
    lactationStatus: 'Lactating (1st Lactation)',
    status: 'watch',
    statusLabel: 'Under Observation',
    temperature: '38.9 °C',
    lastAssessment: '18 Oct 2024 · Elevated SCC',
    photoUrl: null,
    avatarColor: '#B45309',
    issue: 'Drop in morning milk yield & slight appetite dip',
    notes: 'Under observation for subclinical mastitis indicators. Electrical conductivity being tested twice daily.',
    assessments: [
      {
        id: 'asm-009-1',
        date: '18 Oct 2024, 11:20 AM',
        result: 'Watch',
        status: 'watch',
        condition: 'Low feed intake & mild milk conductivity variance. Somatic cells marginally elevated.',
        confidence: '78%',
        assessedBy: 'Ramesh Patil (Routine Scan)',
      },
    ],
    feverLogs: [
      {
        id: 'fever-009-1',
        date: '2024-10-18',
        time: '11:00 AM',
        temperature: '38.9',
        symptoms: ['Drop in Milk Yield', 'Loss of Appetite / Low Feed'],
        notes: 'Mild temperature rise. Monitored in stall.',
        recordedAt: '2024-10-18T11:00:00.000Z',
      },
    ],
    milkLogs: [
      {
        id: 'milk-009-1',
        date: '2024-10-20',
        morningMilk: 6,
        eveningMilk: 4,
        totalMilk: 10,
        notes: 'Subclinical monitoring session.',
        recordedAt: '2024-10-20T17:30:00.000Z',
      },
    ],
    vaccinations: [
      { id: 'vac-8', title: 'FMD Vaccination', date: '2024-04-10', nextDueDate: '2024-10-25', status: 'Due Soon', administrator: 'Dr. Sharma', notes: 'Upcoming booster dose.' },
      { id: 'vac-9', title: 'Deworming (Ivermectin)', date: '2024-08-05', nextDueDate: '2024-11-05', status: 'Scheduled', administrator: 'Farm Staff', notes: 'Subcutaneous injection.' },
    ],
  },
  {
    id: 'cow-012',
    tagId: 'Tag 012',
    name: 'Gauri',
    breed: 'Sahiwal',
    gender: 'Female (Milking Cow)',
    ageYears: 6,
    dateOfBirth: '2018-05-14',
    weightKg: 450,
    milkYieldPerDay: 14,
    milkToday: '14 L',
    morningMilk: 8,
    eveningMilk: 6,
    dateOfRegistration: '2024-01-15',
    lactationStatus: 'Lactating (4th Lactation)',
    status: 'healthy',
    statusLabel: 'Healthy',
    temperature: '38.4 °C',
    lastAssessment: '14 Oct 2024 · Normal',
    photoUrl: null,
    avatarColor: '#17733E',
    notes: 'Very healthy senior dairy cow with consistent high solids content in milk.',
    assessments: [
      {
        id: 'asm-012-1',
        date: '14 Oct 2024, 08:45 AM',
        result: 'Low Risk',
        status: 'healthy',
        condition: 'Clean teat ends, zero inflammation, normal temperature.',
        confidence: '96%',
        assessedBy: 'Ramesh Patil',
      },
    ],
    feverLogs: [
      {
        id: 'fever-012-1',
        date: '2024-10-14',
        time: '08:30 AM',
        temperature: '38.4',
        symptoms: ['Normal Behavior / Alert'],
        notes: 'Resting temperature normal.',
        recordedAt: '2024-10-14T08:30:00.000Z',
      },
    ],
    milkLogs: [
      {
        id: 'milk-012-1',
        date: '2024-10-20',
        morningMilk: 8,
        eveningMilk: 6,
        totalMilk: 14,
        notes: 'High butterfat content, consistent flow.',
        recordedAt: '2024-10-20T17:30:00.000Z',
      },
    ],
    vaccinations: [
      { id: 'vac-10', title: 'FMD Vaccination', date: '2024-04-10', nextDueDate: '2024-10-10', status: 'Completed', administrator: 'Dr. Sharma', notes: 'Annual immunization.' },
      { id: 'vac-11', title: 'Anthrax Spore Vaccine', date: '2024-02-18', nextDueDate: '2025-02-18', status: 'Scheduled', administrator: 'Veterinary Dept', notes: 'Prophylactic immunization.' },
    ],
  },
];

export function CowsProvider({ children }) {
  const [cows, setCows] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(ensureCowDefaults);
        }
      }
    } catch (e) {
      console.warn('Could not read cows from localStorage:', e);
    }
    return INITIAL_DEMO_COWS.map(ensureCowDefaults);
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cows));
    } catch (e) {
      console.warn('Could not save cows to localStorage:', e);
    }
  }, [cows]);

  /**
   * Normalize tag for duplicate comparisons
   */
  const normalizeTag = (tag) => {
    return (tag || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  /**
   * Add a new cow with required validation & duplicate check
   */
  const addCow = (cowData) => {
    const trimmedName = (cowData.name || '').trim();
    const rawTag = (cowData.tagId || '').trim();
    const cleanTag = normalizeTag(rawTag);

    if (!trimmedName) {
      return { success: false, error: 'Cow name is required.' };
    }
    if (!rawTag) {
      return { success: false, error: 'Unique Cow Tag / ID is required.' };
    }
    if (!cowData.breed) {
      return { success: false, error: 'Please select or enter a breed.' };
    }

    // Check duplicate tag ID
    const duplicate = cows.find(
      (c) => normalizeTag(c.tagId) === cleanTag
    );
    if (duplicate) {
      return {
        success: false,
        error: `A cow with Tag ID "${rawTag}" already exists in your herd (${duplicate.name}). Each cow must have a unique identifier.`,
      };
    }

    const formattedTag = rawTag.toLowerCase().startsWith('tag') ? rawTag : `Tag ${rawTag}`;
    const newId = `cow-${Date.now().toString(36)}`;
    const milkNum = parseFloat(cowData.milkYieldPerDay) || 0;

    const newCow = {
      id: newId,
      tagId: formattedTag,
      name: trimmedName,
      breed: cowData.breed,
      gender: cowData.gender || 'Female (Milking Cow)',
      ageYears: parseFloat(cowData.ageYears) || 3,
      dateOfBirth: cowData.dateOfBirth || '',
      weightKg: cowData.weightKg ? parseFloat(cowData.weightKg) : null,
      milkYieldPerDay: milkNum,
      milkToday: `${milkNum} L`,
      morningMilk: Math.round(milkNum * 0.55 * 10) / 10,
      eveningMilk: Math.round(milkNum * 0.45 * 10) / 10,
      dateOfRegistration: cowData.dateOfRegistration || new Date().toISOString().split('T')[0],
      lactationStatus: cowData.lactationStatus || 'Lactating (In Milk)',
      status: 'healthy',
      statusLabel: 'Healthy',
      temperature: '38.5 °C',
      lastAssessment: 'Registered Today · Baseline Normal',
      photoUrl: cowData.photoUrl || null,
      avatarColor: '#17733E',
      notes: cowData.notes || '',
      assessments: [
        {
          id: `asm-${Date.now()}`,
          date: 'Today, Just Registered',
          result: 'Baseline Normal',
          status: 'healthy',
          condition: 'Initial intake baseline established. No signs of infection.',
          confidence: '100%',
          assessedBy: 'Herd Operator (Registration)',
        },
      ],
      vaccinations: [
        {
          id: `vac-${Date.now()}`,
          title: 'Intake Health & Tagging Inspection',
          date: new Date().toISOString().split('T')[0],
          status: 'Completed',
          administrator: 'Farm Registration',
        },
      ],
    };

    setCows((prev) => [newCow, ...prev]);
    return { success: true, cow: newCow };
  };

  /**
   * Update existing cow details
   */
  const updateCow = (id, updatedFields) => {
    // If tag is changing, verify no duplicate
    if (updatedFields.tagId) {
      const cleanTag = normalizeTag(updatedFields.tagId);
      const duplicate = cows.find(
        (c) => c.id !== id && normalizeTag(c.tagId) === cleanTag
      );
      if (duplicate) {
        return {
          success: false,
          error: `Another cow (${duplicate.name}) is already using Tag ID "${updatedFields.tagId}".`,
        };
      }
    }

    let updatedCow = null;
    setCows((prev) =>
      prev.map((cow) => {
        if (cow.id === id) {
          const milkNum = updatedFields.milkYieldPerDay !== undefined 
            ? parseFloat(updatedFields.milkYieldPerDay) || 0
            : cow.milkYieldPerDay;

          updatedCow = {
            ...cow,
            ...updatedFields,
            milkYieldPerDay: milkNum,
            milkToday: `${milkNum} L`,
          };
          return updatedCow;
        }
        return cow;
      })
    );

    return { success: true, cow: updatedCow };
  };

  /**
   * Delete a cow from the herd
   */
  const deleteCow = (id) => {
    setCows((prev) => prev.filter((c) => c.id !== id));
    return { success: true };
  };

  /**
   * Add a new fever/temperature measurement for a cow
   */
  const addFeverLog = (cowId, logData) => {
    const tempNum = parseFloat(logData.temperature);
    if (isNaN(tempNum)) {
      return { success: false, error: 'Valid body temperature is required.' };
    }

    const newEntry = {
      id: `fever-${Date.now()}`,
      date: logData.date || new Date().toISOString().split('T')[0],
      time: logData.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: tempNum.toFixed(1),
      symptoms: Array.isArray(logData.symptoms) ? logData.symptoms : [],
      notes: (logData.notes || '').trim(),
      recordedAt: new Date().toISOString(),
    };

    let updatedCow = null;
    setCows((prev) =>
      prev.map((cow) => {
        if (cow.id === cowId) {
          const currentLogs = Array.isArray(cow.feverLogs) ? cow.feverLogs : [];
          const updatedLogs = [newEntry, ...currentLogs];

          // Temperature state updates
          let newStatus = cow.status;
          let newStatusLabel = cow.statusLabel;
          let newIssue = cow.issue;

          if (tempNum > 39.5) {
            newStatus = 'alert';
            newStatusLabel = 'Needs Attention';
            newIssue = `Elevated temperature (${tempNum.toFixed(1)} °C)`;
          } else if (tempNum > 39.3 && newStatus === 'healthy') {
            newStatus = 'watch';
            newStatusLabel = 'Under Observation';
            newIssue = `Mildly elevated temp (${tempNum.toFixed(1)} °C)`;
          }

          updatedCow = {
            ...cow,
            temperature: `${tempNum.toFixed(1)} °C`,
            status: newStatus,
            statusLabel: newStatusLabel,
            issue: newIssue,
            feverLogs: updatedLogs,
          };
          return updatedCow;
        }
        return cow;
      })
    );

    return { success: true, entry: newEntry, cow: updatedCow };
  };

  /**
   * Add a new milk production log entry for a cow
   */
  const addMilkLog = (cowId, logData) => {
    const morning = parseFloat(logData.morningMilk) || 0;
    const evening = parseFloat(logData.eveningMilk) || 0;
    const total = Math.round((morning + evening) * 10) / 10;

    const newEntry = {
      id: `milk-${Date.now()}`,
      date: logData.date || new Date().toISOString().split('T')[0],
      morningMilk: morning,
      eveningMilk: evening,
      totalMilk: total,
      notes: (logData.notes || '').trim(),
      recordedAt: new Date().toISOString(),
    };

    let updatedCow = null;
    setCows((prev) =>
      prev.map((cow) => {
        if (cow.id === cowId) {
          const currentLogs = Array.isArray(cow.milkLogs) ? cow.milkLogs : [];
          const updatedLogs = [newEntry, ...currentLogs];

          updatedCow = {
            ...cow,
            morningMilk: morning,
            eveningMilk: evening,
            milkYieldPerDay: total,
            milkToday: `${total} L`,
            milkLogs: updatedLogs,
          };
          return updatedCow;
        }
        return cow;
      })
    );

    return { success: true, entry: newEntry, cow: updatedCow };
  };

  /**
   * Add a new vaccination/treatment record for a cow
   */
  const addVaccinationRecord = (cowId, recordData) => {
    const title = (recordData.vaccineName || '').trim();
    if (!title) {
      return { success: false, error: 'Vaccine or treatment name is required.' };
    }

    const newEntry = {
      id: `vac-${Date.now()}`,
      title,
      date: recordData.dateAdministered || new Date().toISOString().split('T')[0],
      nextDueDate: recordData.nextDueDate || '',
      administrator: (recordData.administrator || '').trim() || 'Farm Staff',
      notes: (recordData.notes || '').trim(),
      status: recordData.nextDueDate ? 'Scheduled' : 'Completed',
      recordedAt: new Date().toISOString(),
    };

    let updatedCow = null;
    setCows((prev) =>
      prev.map((cow) => {
        if (cow.id === cowId) {
          const currentVac = Array.isArray(cow.vaccinations) ? cow.vaccinations : [];
          const updatedVac = [newEntry, ...currentVac];

          updatedCow = {
            ...cow,
            vaccinations: updatedVac,
          };
          return updatedCow;
        }
        return cow;
      })
    );

    return { success: true, entry: newEntry, cow: updatedCow };
  };

  /**
   * Look up cow by ID
   */
  const getCowById = (id) => {
    return cows.find((c) => c.id === id);
  };

  /**
   * Reset to default demo herd
   */
  const resetDemoCows = () => {
    setCows(INITIAL_DEMO_COWS.map(ensureCowDefaults));
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  // Aggregated live statistics
  const stats = {
    total: cows.length,
    healthy: cows.filter((c) => c.status === 'healthy').length,
    watch: cows.filter((c) => c.status === 'watch').length,
    alert: cows.filter((c) => c.status === 'alert').length,
    totalMilkToday: cows.reduce((sum, c) => sum + (c.milkYieldPerDay || 0), 0),
  };

  const value = {
    cows,
    addCow,
    updateCow,
    deleteCow,
    getCowById,
    resetDemoCows,
    addFeverLog,
    addMilkLog,
    addVaccinationRecord,
    stats,
  };

  return <CowsContext.Provider value={value}>{children}</CowsContext.Provider>;
}

export function useCows() {
  const context = useContext(CowsContext);
  if (!context) {
    throw new Error('useCows must be used within a CowsProvider');
  }
  return context;
}
