import { useState } from 'react';
import { Medication, DosageHistory } from '@/types/medication';
import MedicationCard from './MedicationCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MedicationListProps {
  medications: Medication[];
  todayHistory: DosageHistory[];
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
  onTake: (medicationId: string, time: string) => void;
}

export default function MedicationList({
  medications,
  todayHistory,
  onEdit,
  onDelete,
  onTake
}: MedicationListProps) {
  const [activeTab, setActiveTab] = useState('all');

  const getNextScheduledTime = (medication: Medication): string | undefined => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    return medication.times.find(time => time >= currentTime);
  };

  const getUpcomingMedications = () => {
    return medications.filter(med => {
      const nextTime = getNextScheduledTime(med);
      if (!nextTime) return false;
      
      const recordId = `${med.id}-${new Date().toISOString().split('T')[0]}-${nextTime}`;
      const record = todayHistory.find(h => h.id === recordId);
      
      return record?.status === 'upcoming';
    });
  };

  const getTakenMedications = () => {
    const takenMedIds = new Set(
      todayHistory
        .filter(h => h.status === 'taken')
        .map(h => h.medicationId)
    );
    return medications.filter(med => takenMedIds.has(med.id));
  };

  const getMissedMedications = () => {
    const missedMedIds = new Set(
      todayHistory
        .filter(h => h.status === 'missed')
        .map(h => h.medicationId)
    );
    return medications.filter(med => missedMedIds.has(med.id));
  };

  const renderMedicationCards = (meds: Medication[], showTakeButton: boolean = false) => {
    if (meds.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No medications found
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {meds.map(med => (
          <MedicationCard
            key={med.id}
            medication={med}
            onEdit={onEdit}
            onDelete={onDelete}
            onTake={onTake}
            showTakeButton={showTakeButton}
            nextScheduledTime={getNextScheduledTime(med)}
          />
        ))}
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="taken">Taken</TabsTrigger>
        <TabsTrigger value="missed">Missed</TabsTrigger>
      </TabsList>

      <ScrollArea className="h-[calc(100vh-280px)] mt-4">
        <TabsContent value="all" className="mt-0">
          {renderMedicationCards(medications)}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-0">
          {renderMedicationCards(getUpcomingMedications(), true)}
        </TabsContent>

        <TabsContent value="taken" className="mt-0">
          {renderMedicationCards(getTakenMedications())}
        </TabsContent>

        <TabsContent value="missed" className="mt-0">
          {renderMedicationCards(getMissedMedications())}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}