import { useState, useEffect } from 'react';
import { Medication } from '@/types/medication';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';

interface MedicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (medication: Medication) => void;
  editingMedication?: Medication | null;
}

export default function MedicationForm({
  open,
  onOpenChange,
  onSave,
  editingMedication
}: MedicationFormProps) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<Medication['frequency']>('daily');
  const [times, setTimes] = useState<string[]>(['09:00']);
  const [inventoryCount, setInventoryCount] = useState(30);
  const [inventoryAlert, setInventoryAlert] = useState(5);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingMedication) {
      setName(editingMedication.name);
      setDosage(editingMedication.dosage);
      setFrequency(editingMedication.frequency);
      setTimes(editingMedication.times);
      setInventoryCount(editingMedication.inventoryCount);
      setInventoryAlert(editingMedication.inventoryAlert);
      setNotes(editingMedication.notes || '');
    } else {
      resetForm();
    }
  }, [editingMedication, open]);

  const resetForm = () => {
    setName('');
    setDosage('');
    setFrequency('daily');
    setTimes(['09:00']);
    setInventoryCount(30);
    setInventoryAlert(5);
    setNotes('');
  };

  const handleAddTime = () => {
    setTimes([...times, '09:00']);
  };

  const handleRemoveTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const medication: Medication = {
      id: editingMedication?.id || crypto.randomUUID(),
      name,
      dosage,
      frequency,
      times: times.sort(),
      inventoryCount,
      inventoryAlert,
      notes,
      createdAt: editingMedication?.createdAt || new Date().toISOString(),
      isActive: editingMedication?.isActive ?? true
    };

    onSave(medication);
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingMedication ? 'Edit Medication' : 'Add New Medication'}
          </DialogTitle>
          <DialogDescription>
            Enter the medication details and schedule
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medication Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Aspirin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g., 100mg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={frequency} onValueChange={(value: Medication['frequency']) => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Once Daily</SelectItem>
                <SelectItem value="twice-daily">Twice Daily</SelectItem>
                <SelectItem value="three-times-daily">Three Times Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="as-needed">As Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reminder Times *</Label>
            {times.map((time, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(index, e.target.value)}
                  required
                />
                {times.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveTime(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTime}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inventory">Inventory Count *</Label>
              <Input
                id="inventory"
                type="number"
                min="0"
                value={inventoryCount}
                onChange={(e) => setInventoryCount(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert">Alert When Below *</Label>
              <Input
                id="alert"
                type="number"
                min="0"
                value={inventoryAlert}
                onChange={(e) => setInventoryAlert(parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingMedication ? 'Update' : 'Add'} Medication
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}