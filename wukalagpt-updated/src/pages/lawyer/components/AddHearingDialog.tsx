import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface AddHearingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: any[];
  initialCaseId?: string;
  initialDate?: string;
  onSuccess?: () => void;
}

const courtColors: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  high: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary', label: 'High Court' },
  sessions: { bg: 'bg-secondary', text: 'text-foreground', dot: 'bg-foreground/40', label: 'Sessions Court' },
  civil: { bg: 'bg-accent', text: 'text-accent-foreground', dot: 'bg-accent-foreground/50', label: 'Civil Court' },
  special: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning', label: 'Special Court' },
};

export function AddHearingDialog({ open, onOpenChange, cases, initialCaseId, initialDate, onSuccess }: AddHearingDialogProps) {
  const [newHearing, setNewHearing] = useState({
    caseId: initialCaseId || '',
    hearingDate: initialDate || '',
    startTime: '09:00',
    courtName: '',
    courtType: 'civil',
    courtRoom: '',
    judgeName: '',
    hearingType: 'Hearing',
    priority: 'medium',
    notes: ''
  });

  // Keep state updated if props change when opening
  React.useEffect(() => {
    if (open) {
      setNewHearing(prev => ({
        ...prev,
        caseId: initialCaseId || prev.caseId,
        hearingDate: initialDate || prev.hearingDate
      }));
    }
  }, [open, initialCaseId, initialDate]);

  const handleAddHearing = async () => {
    if (!newHearing.caseId || !newHearing.hearingDate || !newHearing.startTime || !newHearing.courtName) return;
    
    try {
      await api.createHearing({
        caseId: newHearing.caseId,
        hearingDate: newHearing.hearingDate,
        startTime: newHearing.startTime + ':00',
        durationMins: 60,
        courtName: newHearing.courtName,
        courtType: newHearing.courtType,
        courtRoom: newHearing.courtRoom,
        judgeName: newHearing.judgeName,
        hearingType: newHearing.hearingType,
        priority: newHearing.priority,
        notes: newHearing.notes
      });
      toast({ title: "Success", description: "Hearing scheduled successfully." });
      onOpenChange(false);
      setNewHearing({ ...newHearing, caseId: '', hearingDate: '', startTime: '09:00', courtName: '', courtRoom: '', judgeName: '', notes: '' });
      if (onSuccess) onSuccess();
    } catch (e) {
      toast({ title: "Error", description: "Could not schedule hearing.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base font-sans">Schedule New Hearing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-sans">Link to Case *</Label>
              <Select value={newHearing.caseId} onValueChange={(val) => setNewHearing({ ...newHearing, caseId: val })}>
                <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Select case file..." /></SelectTrigger>
                <SelectContent>
                  {cases.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs font-sans">{c.title} ({c.caseNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Hearing Date *</Label>
              <Input type="date" className="text-xs font-sans h-9" value={newHearing.hearingDate} onChange={e => setNewHearing({ ...newHearing, hearingDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Time *</Label>
              <Input type="time" className="text-xs font-sans h-9" value={newHearing.startTime} onChange={e => setNewHearing({ ...newHearing, startTime: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Court *</Label>
              <Select value={newHearing.courtName} onValueChange={(val) => setNewHearing({ ...newHearing, courtName: val })}>
                <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Select court..." /></SelectTrigger>
                <SelectContent>
                  {['Lahore High Court', 'Sessions Court, Islamabad', 'Supreme Court of Pakistan', 'Civil Court, Lahore', 'Banking Court, Lahore', 'Labour Court, Faisalabad'].map(c => (
                    <SelectItem key={c} value={c} className="text-xs font-sans">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Court Type *</Label>
              <Select value={newHearing.courtType} onValueChange={(val) => setNewHearing({ ...newHearing, courtType: val })}>
                <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(courtColors).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs font-sans">
                      <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${v.dot}`} />{v.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Courtroom</Label>
              <Input placeholder="e.g. Court 3" className="text-xs font-sans h-9" value={newHearing.courtRoom} onChange={e => setNewHearing({ ...newHearing, courtRoom: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Judge</Label>
              <Input placeholder="Judge name" className="text-xs font-sans h-9" value={newHearing.judgeName} onChange={e => setNewHearing({ ...newHearing, judgeName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Hearing Type</Label>
              <Select value={newHearing.hearingType} onValueChange={(val) => setNewHearing({ ...newHearing, hearingType: val })}>
                <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Type..." /></SelectTrigger>
                <SelectContent>
                  {['Arguments', 'Evidence', 'Hearing', 'Discovery', 'Mediation', 'Constitutional Petition', 'Tax Appeal', 'Bail', 'Judgment'].map(t => (
                    <SelectItem key={t} value={t} className="text-xs font-sans">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Priority</Label>
              <Select value={newHearing.priority} onValueChange={(val) => setNewHearing({ ...newHearing, priority: val })}>
                <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Priority..." /></SelectTrigger>
                <SelectContent>
                  {['critical', 'high', 'medium', 'low'].map(p => (
                    <SelectItem key={p} value={p} className="text-xs font-sans capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-sans">Notes</Label>
              <Textarea placeholder="Any special instructions or preparation notes..." className="text-xs font-sans min-h-[60px]" value={newHearing.notes} onChange={e => setNewHearing({ ...newHearing, notes: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="text-xs font-sans" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-xs font-sans bg-gradient-primary gap-1.5" onClick={handleAddHearing}>
            <Plus className="h-3 w-3" /> Schedule Hearing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
