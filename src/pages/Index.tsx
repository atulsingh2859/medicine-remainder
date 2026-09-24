import { useState, useEffect } from 'react';
import { Medication, DosageHistory, MedicationStats } from '@/types/medication';
import {
  getMedications,
  saveMedication,
  deleteMedication,
  initializeUserProfile,
  generateTodaySchedule,
  getTodayDosageHistory,
  updateMissedMedications,
  markAsTaken
} from '@/lib/storage';
import {
  requestNotificationPermission,
  scheduleNotificationCheck,
  getNotificationStatus
} from '@/lib/notifications';
import MedicationForm from '@/components/MedicationForm';
import MedicationList from '@/components/MedicationList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Pill,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Bell,
  BellOff,
  Activity,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayHistory, setTodayHistory] = useState<DosageHistory[]>([]);
  const [stats, setStats] = useState<MedicationStats>({
    totalMedications: 0,
    takenToday: 0,
    missedToday: 0,
    upcomingToday: 0,
    lowInventoryCount: 0
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    // Initialize user profile
    initializeUserProfile();
    
    // Load data
    loadData();
    
    // Check notification permission
    const permission = getNotificationStatus();
    setNotificationEnabled(permission === 'granted');
    
    // Set up intervals
    const updateInterval = setInterval(() => {
      updateMissedMedications();
      loadData();
    }, 60000); // Update every minute

    let notificationInterval: NodeJS.Timeout | null = null;
    if (permission === 'granted') {
      notificationInterval = scheduleNotificationCheck(getMedications());
    }

    return () => {
      clearInterval(updateInterval);
      if (notificationInterval) clearInterval(notificationInterval);
    };
  }, []);

  const loadData = () => {
    const meds = getMedications();
    setMedications(meds);
    
    generateTodaySchedule();
    const history = getTodayDosageHistory();
    setTodayHistory(history);
    
    // Calculate stats
    const takenToday = history.filter(h => h.status === 'taken').length;
    const missedToday = history.filter(h => h.status === 'missed').length;
    const upcomingToday = history.filter(h => h.status === 'upcoming').length;
    const lowInventoryCount = meds.filter(
      m => m.inventoryCount <= m.inventoryAlert
    ).length;
    
    setStats({
      totalMedications: meds.length,
      takenToday,
      missedToday,
      upcomingToday,
      lowInventoryCount
    });
  };

  const handleSaveMedication = (medication: Medication) => {
    saveMedication(medication);
    loadData();
    toast.success(
      editingMedication ? 'Medication updated successfully' : 'Medication added successfully'
    );
    setEditingMedication(null);
  };

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setIsFormOpen(true);
  };

  const handleDeleteMedication = (id: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      deleteMedication(id);
      loadData();
      toast.success('Medication deleted successfully');
    }
  };

  const handleTakeMedication = (medicationId: string, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    const recordId = `${medicationId}-${today}-${time}`;
    
    markAsTaken(recordId);
    loadData();
    
    const medication = medications.find(m => m.id === medicationId);
    toast.success(`Marked ${medication?.name} as taken`);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    
    if (granted) {
      toast.success('Notifications enabled successfully');
      scheduleNotificationCheck(medications);
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingMedication(null);
    }
  };

  return (
    <div className="min-h-screen medical-gradient medical-scrollbar">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header with medical theme */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Medicine Reminder
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Stay healthy, stay on track
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!notificationEnabled && (
              <Button
                variant="outline"
                onClick={handleEnableNotifications}
                className="gap-2 border-primary/30 hover:bg-primary/5"
              >
                <BellOff className="h-4 w-4" />
                Enable Reminders
              </Button>
            )}
            {notificationEnabled && (
              <Badge variant="secondary" className="gap-2 px-3 py-2 bg-green-50 text-green-700 border-green-200">
                <Bell className="h-4 w-4 pulse-medical" />
                Reminders Active
              </Badge>
            )}
            <Button onClick={() => setIsFormOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 pill-shape shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </div>
        </div>

        {/* Alert for low inventory with medical theme */}
        {stats.lowInventoryCount > 0 && (
          <Alert className="mb-6 status-low-inventory border-2 pill-shape">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="font-medium">
              {stats.lowInventoryCount} medication{stats.lowInventoryCount > 1 ? 's' : ''} running low on inventory. Please refill soon.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards with medical theme */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="medical-card border-primary/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Pill className="h-3.5 w-3.5 text-blue-600" />
                </div>
                Total Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">{stats.totalMedications}</span>
                <span className="text-xs text-muted-foreground">active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                </div>
                Taken Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-green-600">{stats.takenToday}</span>
                <span className="text-xs text-muted-foreground">doses</span>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card border-red-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <XCircle className="h-3.5 w-3.5 text-red-600" />
                </div>
                Missed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-red-600">{stats.missedToday}</span>
                <span className="text-xs text-muted-foreground">doses</span>
              </div>
            </CardContent>
          </Card>

          <Card className="medical-card border-orange-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <Clock className="h-3.5 w-3.5 text-orange-600" />
                </div>
                Upcoming Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-orange-600">{stats.upcomingToday}</span>
                <span className="text-xs text-muted-foreground">doses</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medication List */}
        {medications.length === 0 ? (
          <Card className="medical-card border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-6 bg-primary/10 rounded-full mb-4">
                <Pill className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary">No medications yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Start managing your health by adding your first medication. We'll help you stay on track with timely reminders.
              </p>
              <Button onClick={() => setIsFormOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 pill-shape shadow-lg shadow-primary/20" size="lg">
                <Plus className="h-5 w-5" />
                Add Your First Medication
              </Button>
            </CardContent>
          </Card>
        ) : (
          <MedicationList
            medications={medications}
            todayHistory={todayHistory}
            onEdit={handleEditMedication}
            onDelete={handleDeleteMedication}
            onTake={handleTakeMedication}
          />
        )}

        {/* Medication Form Dialog */}
        <MedicationForm
          open={isFormOpen}
          onOpenChange={handleFormOpenChange}
          onSave={handleSaveMedication}
          editingMedication={editingMedication}
        />
      </div>
    </div>
  );
}