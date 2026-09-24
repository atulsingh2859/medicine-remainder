import { Medication } from '@/types/medication';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Pill, AlertCircle, Edit, Trash2, Check } from 'lucide-react';

interface MedicationCardProps {
  medication: Medication;
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
  onTake?: (medicationId: string, time: string) => void;
  showTakeButton?: boolean;
  nextScheduledTime?: string;
}

export default function MedicationCard({
  medication,
  onEdit,
  onDelete,
  onTake,
  showTakeButton = false,
  nextScheduledTime
}: MedicationCardProps) {
  const isLowInventory = medication.inventoryCount <= medication.inventoryAlert;
  
  const frequencyLabels: Record<string, string> = {
    'daily': 'Once Daily',
    'twice-daily': 'Twice Daily',
    'three-times-daily': 'Three Times Daily',
    'weekly': 'Weekly',
    'as-needed': 'As Needed'
  };

  return (
    <Card className={`${!medication.isActive ? 'opacity-60' : ''} ${isLowInventory ? 'border-orange-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-500" />
              {medication.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{medication.dosage}</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(medication)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(medication.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{frequencyLabels[medication.frequency]}</span>
          <Badge variant="secondary" className="ml-auto">
            {medication.times.join(', ')}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Inventory:</span>
          <div className="flex items-center gap-2">
            {isLowInventory && (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
            <span className={isLowInventory ? 'text-orange-500 font-medium' : ''}>
              {medication.inventoryCount} remaining
            </span>
          </div>
        </div>

        {medication.notes && (
          <p className="text-sm text-muted-foreground italic border-t pt-2">
            {medication.notes}
          </p>
        )}

        {showTakeButton && nextScheduledTime && onTake && (
          <Button
            onClick={() => onTake(medication.id, nextScheduledTime)}
            className="w-full mt-2"
            size="sm"
          >
            <Check className="h-4 w-4 mr-2" />
            Mark as Taken
          </Button>
        )}
      </CardContent>
    </Card>
  );
}