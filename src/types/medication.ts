export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice-daily' | 'three-times-daily' | 'weekly' | 'as-needed';
  times: string[]; // Array of time strings like "09:00", "14:00"
  inventoryCount: number;
  inventoryAlert: number; // Alert when inventory falls below this number
  notes?: string;
  createdAt: string;
  isActive: boolean;
}

export interface DosageHistory {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenAt: string | null;
  status: 'taken' | 'missed' | 'upcoming';
  date: string; // YYYY-MM-DD format
}

export interface UserProfile {
  id: string;
  name: string;
  createdAt: string;
}

export interface MedicationStats {
  totalMedications: number;
  takenToday: number;
  missedToday: number;
  upcomingToday: number;
  lowInventoryCount: number;
}