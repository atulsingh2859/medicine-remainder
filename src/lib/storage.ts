import { Medication, DosageHistory, UserProfile } from '@/types/medication';

const MEDICATIONS_KEY = 'medicine_reminder_medications';
const DOSAGE_HISTORY_KEY = 'medicine_reminder_dosage_history';
const USER_PROFILE_KEY = 'medicine_reminder_user_profile';

// Medication CRUD operations
export const getMedications = (): Medication[] => {
  const data = localStorage.getItem(MEDICATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveMedication = (medication: Medication): void => {
  const medications = getMedications();
  const existingIndex = medications.findIndex(m => m.id === medication.id);
  
  if (existingIndex >= 0) {
    medications[existingIndex] = medication;
  } else {
    medications.push(medication);
  }
  
  localStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
};

export const deleteMedication = (id: string): void => {
  const medications = getMedications().filter(m => m.id !== id);
  localStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  
  // Also remove related dosage history
  const history = getDosageHistory().filter(h => h.medicationId !== id);
  localStorage.setItem(DOSAGE_HISTORY_KEY, JSON.stringify(history));
};

export const updateMedicationInventory = (id: string, newCount: number): void => {
  const medications = getMedications();
  const medication = medications.find(m => m.id === id);
  
  if (medication) {
    medication.inventoryCount = newCount;
    localStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  }
};

// Dosage History operations
export const getDosageHistory = (): DosageHistory[] => {
  const data = localStorage.getItem(DOSAGE_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const addDosageRecord = (record: DosageHistory): void => {
  const history = getDosageHistory();
  history.push(record);
  localStorage.setItem(DOSAGE_HISTORY_KEY, JSON.stringify(history));
};

export const updateDosageRecord = (id: string, updates: Partial<DosageHistory>): void => {
  const history = getDosageHistory();
  const index = history.findIndex(h => h.id === id);
  
  if (index >= 0) {
    history[index] = { ...history[index], ...updates };
    localStorage.setItem(DOSAGE_HISTORY_KEY, JSON.stringify(history));
  }
};

export const getTodayDosageHistory = (): DosageHistory[] => {
  const today = new Date().toISOString().split('T')[0];
  return getDosageHistory().filter(h => h.date === today);
};

// User Profile operations
export const getUserProfile = (): UserProfile | null => {
  const data = localStorage.getItem(USER_PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

// Initialize default user profile if none exists
export const initializeUserProfile = (): UserProfile => {
  let profile = getUserProfile();
  
  if (!profile) {
    profile = {
      id: crypto.randomUUID(),
      name: 'User',
      createdAt: new Date().toISOString()
    };
    saveUserProfile(profile);
  }
  
  return profile;
};

// Generate scheduled doses for today
export const generateTodaySchedule = (): void => {
  const medications = getMedications().filter(m => m.isActive);
  const today = new Date().toISOString().split('T')[0];
  const existingHistory = getTodayDosageHistory();
  
  medications.forEach(med => {
    med.times.forEach(time => {
      const scheduleId = `${med.id}-${today}-${time}`;
      const exists = existingHistory.find(h => h.id === scheduleId);
      
      if (!exists) {
        const scheduledDateTime = new Date(`${today}T${time}`);
        const now = new Date();
        
        const record: DosageHistory = {
          id: scheduleId,
          medicationId: med.id,
          medicationName: med.name,
          scheduledTime: time,
          takenAt: null,
          status: scheduledDateTime > now ? 'upcoming' : 'missed',
          date: today
        };
        
        addDosageRecord(record);
      }
    });
  });
};

// Mark medication as taken
export const markAsTaken = (recordId: string): void => {
  const now = new Date().toISOString();
  updateDosageRecord(recordId, {
    takenAt: now,
    status: 'taken'
  });
  
  // Decrease inventory count
  const history = getDosageHistory();
  const record = history.find(h => h.id === recordId);
  
  if (record) {
    const medications = getMedications();
    const medication = medications.find(m => m.id === record.medicationId);
    
    if (medication && medication.inventoryCount > 0) {
      updateMedicationInventory(medication.id, medication.inventoryCount - 1);
    }
  }
};

// Update missed medications
export const updateMissedMedications = (): void => {
  const today = new Date().toISOString().split('T')[0];
  const history = getDosageHistory();
  const now = new Date();
  
  history.forEach(record => {
    if (record.date === today && record.status === 'upcoming' && !record.takenAt) {
      const scheduledDateTime = new Date(`${today}T${record.scheduledTime}`);
      
      if (scheduledDateTime < now) {
        updateDosageRecord(record.id, { status: 'missed' });
      }
    }
  });
};