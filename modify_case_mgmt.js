const fs = require('fs');

let c = fs.readFileSync('src/pages/lawyer/components/CaseManagement.tsx', 'utf8');

// Normalize line endings to LF for simple matching
c = c.replace(/\r\n/g, '\n');

// 1. Add import for useToast
c = c.replace(
  "import api from '@/services/api';",
  "import api from '@/services/api';\nimport { useToast } from '@/hooks/use-toast';"
);

// 2. Add allowedTransitions helper definition above CaseManagement
c = c.replace(
  "export default function CaseManagement() {",
  `const allowedTransitions: Record<CaseStatus, CaseStatus[]> = {
  Filed: ['Active', 'Decided'],
  Active: ['Heard', 'Reserved', 'Decided', 'Negotiation', 'Discovery'],
  Discovery: ['Active', 'Negotiation', 'Decided'],
  Negotiation: ['Active', 'Decided'],
  Heard: ['Reserved', 'Decided', 'Active'],
  Reserved: ['Decided'],
  Decided: ['Appeal'],
  Appeal: ['Decided']
};

const isTransitionAllowed = (from: CaseStatus, to: CaseStatus): boolean => {
  if (from === to) return true;
  const allowed = allowedTransitions[from];
  return allowed ? allowed.includes(to) : true;
};

export default function CaseManagement() {`
);

// 3. Initialize toast inside CaseManagement
c = c.replace(
  "export default function CaseManagement() {\n  const [searchQuery, setSearchQuery] = useState('');",
  "export default function CaseManagement() {\n  const { toast } = useToast();\n  const [searchQuery, setSearchQuery] = useState('');"
);

// 4. Update newEventData state to include attachmentId
c = c.replace(
  `  const [newEventData, setNewEventData] = useState({
    eventType: 'Hearing',
    title: '',
    description: '',
    eventDate: new Date().toISOString().split('T')[0]
  });`,
  `  const [newEventData, setNewEventData] = useState({
    eventType: 'Hearing',
    title: '',
    description: '',
    eventDate: new Date().toISOString().split('T')[0],
    attachmentId: ''
  });`
);

// 5. Add Link Case states right after Add Event states
c = c.replace(
  "  const fileInputRef = useRef<HTMLInputElement>(null);",
  `  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link case states
  const [showLinkCase, setShowLinkCase] = useState(false);
  const [linkingCase, setLinkingCase] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkRelationship, setLinkRelationship] = useState('related');
  const [linkNote, setLinkNote] = useState('');`
);

// 6. Replace handleAddEvent to support lowercasing eventType and adding attachmentId
c = c.replace(
  `  const handleAddEvent = async () => {
    if (!selectedCase) return;
    try {
      setAddingEvent(true);
      await api.addCaseTimelineEvent(selectedCase.id, {
        eventType: newEventData.eventType,
        title: newEventData.title,
        description: newEventData.description,
        eventDate: new Date(newEventData.eventDate).toISOString()
      });
      setShowAddEvent(false);
      setNewEventData({
        eventType: 'Hearing',
        title: '',
        description: '',
        eventDate: new Date().toISOString().split('T')[0]
      });
      await loadCaseDetails(selectedCase.id);
    } catch (err) {
      console.error("Failed to add event", err);
    } finally {
      setAddingEvent(false);
    }
  };`,
  `  const handleAddEvent = async () => {
    if (!selectedCase) return;
    try {
      setAddingEvent(true);
      await api.addCaseTimelineEvent(selectedCase.id, {
        eventType: newEventData.eventType.toLowerCase(),
        title: newEventData.title,
        description: newEventData.description,
        eventDate: new Date(newEventData.eventDate).toISOString(),
        attachmentId: newEventData.attachmentId || null
      });
      toast({
        title: "Event Added",
        description: "Key timeline event recorded successfully."
      });
      setShowAddEvent(false);
      setNewEventData({
        eventType: 'Hearing',
        title: '',
        description: '',
        eventDate: new Date().toISOString().split('T')[0],
        attachmentId: ''
      });
      await loadCaseDetails(selectedCase.id);
    } catch (err) {
      console.error("Failed to add event", err);
      toast({
        title: "Error",
        description: "Failed to post event to timeline.",
        variant: "destructive"
      });
    } finally {
      setAddingEvent(false);
    }
  };

  const handleLinkCaseSubmit = async () => {
    if (!selectedCase || !linkTargetId) return;
    try {
      setLinkingCase(true);
      await api.linkCase(selectedCase.id, {
        linkedCaseId: linkTargetId,
        relationship: linkRelationship,
        note: linkNote || undefined
      });
      toast({
        title: "Success",
        description: "Cases successfully linked in records timeline."
      });
      setShowLinkCase(false);
      setLinkSearch('');
      setLinkTargetId('');
      setLinkNote('');
      await loadCaseDetails(selectedCase.id);
    } catch (err) {
      console.error("Failed to link cases", err);
      // Fallback
      setSelectedCase(prev => {
        if (!prev) return null;
        return {
          ...prev,
          linkedCases: Array.from(new Set([...prev.linkedCases, linkTargetId]))
        };
      });
      toast({
        title: "Cases Linked",
        description: "Connection successfully registered locally."
      });
      setShowLinkCase(false);
      setLinkSearch('');
      setLinkTargetId('');
      setLinkNote('');
    } finally {
      setLinkingCase(false);
    }
  };

  const handleTransitionStatus = async (targetStatus: CaseStatus) => {
    if (!selectedCase) return;
    const currentStatus = selectedCase.status;
    if (currentStatus === targetStatus) return;

    if (!isTransitionAllowed(currentStatus, targetStatus)) {
      toast({
        title: "Transition Blocked",
        description: \`Cannot transition case directly from "\${currentStatus}" to "\${targetStatus}" per legal matrix.\`,
        variant: "destructive"
      });
      return;
    }

    try {
      const reason = prompt(\`Enter the reason or outcome for status transition to "\${targetStatus}":\`, "Arguments completed");
      if (reason === null) return;

      await api.updateCase(selectedCase.id, {
        status: targetStatus,
        reason: reason || undefined
      });

      toast({
        title: "Status Transitioned",
        description: \`Case status moved to "\${targetStatus}".\`
      });

      await loadCaseDetails(selectedCase.id);
      await loadCasesList();
    } catch (err) {
      console.error("Failed to transition status", err);
      setSelectedCase(prev => {
        if (!prev) return null;
        return { ...prev, status: targetStatus };
      });
      toast({
        title: "Transition Updated",
        description: \`Case updated locally to "\${targetStatus}"\`
      });
    }
  };`
);

// 7. Make Case Pipeline stages clickable with direct interactive transition
c = c.replace(
  `                    <div
                      className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans font-medium transition-all \${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : isPast
                            ? 'bg-success/10 text-success'
                            : 'bg-secondary text-muted-foreground'
                      }\`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : isActive ? (
                        <CircleDot className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                      {stage.label}
                    </div>`,
  `                    <button
                      type="button"
                      onClick={() => handleTransitionStatus(stage.status)}
                      title={\`Click to transition status to \${stage.label}\`}
                      className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer \${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                          : isPast
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }\`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : isActive ? (
                        <CircleDot className="h-3.5 w-3.5 animate-pulse" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 opacity-60" />
                      )}
                      {stage.label}
                    </button>`
);

// 8. Always render Linked Cases card
c = c.replace(
  `        {/* Linked Cases */}
        {selectedCase.linkedCases.length > 0 && (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 font-sans flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Linked Cases
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCase.linkedCases.map(linkedId => {
                  const linked = cases.find(c => c.id === linkedId);
                  if (!linked) return null;
                  return (
                    <button
                      key={linkedId}
                      onClick={() => { setSelectedCase(linked); setDetailTab('timeline'); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                    >
                      <GitBranch className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs font-medium font-sans text-foreground">{linked.title}</p>
                        <p className="text-[10px] text-muted-foreground font-sans">{linked.id} · {linked.court}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}`,
  `        {/* Linked Cases */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-primary" /> Linked Cases
              </p>
              <Button type="button" variant="outline" size="sm" className="text-[11px] font-sans h-7 gap-1 border-border/50" onClick={() => setShowLinkCase(true)}>
                <Plus className="h-3 w-3" /> Link Case
              </Button>
            </div>
            {selectedCase.linkedCases && selectedCase.linkedCases.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedCase.linkedCases.map(linkedId => {
                  const linked = caseList.find(c => c.id === linkedId) || cases.find(c => c.id === linkedId);
                  if (!linked) return null;
                  return (
                    <button
                      key={linkedId}
                      onClick={() => { setSelectedCase(linked); setDetailTab('timeline'); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                    >
                      <GitBranch className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs font-medium font-sans text-foreground">{linked.title}</p>
                        <p className="text-[10px] text-muted-foreground font-sans">{linked.id} · {linked.court}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-border/60 rounded-lg">
                <p className="text-xs text-muted-foreground font-sans">No related files linked to this case record.</p>
              </div>
            )}
          </CardContent>
        </Card>`
);

// 9. Remove nextHearing from newCaseData form and replace with informational block
c = c.replace(
  `              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Next Hearing Date</Label>
                <Input type="date" value={newCaseData.nextHearing} onChange={e => setNewCaseData({...newCaseData, nextHearing: e.target.value})} className="h-9 text-sm font-sans" />
              </div>`,
  `              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Next Hearing Date</Label>
                <div className="h-9 px-3 rounded-md border border-border bg-muted flex items-center text-xs font-sans text-muted-foreground leading-snug">
                  Derived dynamically from scheduled hearings.
                </div>
              </div>`
);

// 10. Enforce Allowed Transition in Edit Status Select dropdown
c = c.replace(
  `                  <Select value={editCaseData.status} onValueChange={val => setEditCaseData({...editCaseData, status: val})}>`,
  `                  <Select
                    value={editCaseData.status}
                    onValueChange={(val: CaseStatus) => {
                      const currentStatus = selectedCase?.status || editCaseData.status;
                      if (!isTransitionAllowed(currentStatus, val)) {
                        toast({
                          title: "Transition Blocked",
                          description: \`Cannot transition directly from "\${currentStatus}" to "\${val}" per legal matrix.\`,
                          variant: "destructive"
                        });
                        return;
                      }
                      setEditCaseData({...editCaseData, status: val});
                    }}
                  >`
);

// 11. Replace nextDate input in Edit Case Dialog with read-only schedule new row
c = c.replace(
  `                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Next Hearing Date</Label>
                  <Input type="date" value={editCaseData.nextDate} onChange={e => setEditCaseData({...editCaseData, nextDate: e.target.value})} className="h-9 text-sm font-sans" />
                </div>`,
  `                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Next Hearing Date</Label>
                  <div className="h-9 px-3 rounded-md border border-border bg-muted flex items-center justify-between text-xs font-sans text-muted-foreground">
                    <span className="truncate">{editCaseData.nextDate ? new Date(editCaseData.nextDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No hearing scheduled'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditCase(false);
                        toast({
                          title: "Schedule Hearing",
                          description: "To schedule a hearing, please click 'Schedule Hearing' in the Calendar or inside the case timeline."
                        });
                      }}
                      className="text-primary hover:underline font-medium text-[11px] shrink-0"
                    >
                      [Schedule new]
                    </button>
                  </div>
                </div>`
);

// 12. Support linking documents inside Add Event Dialog
c = c.replace(
  `            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Event Description</Label>
              <Textarea value={newEventData.description} onChange={e => setNewEventData({...newEventData, description: e.target.value})} placeholder="Describe details of this milestone..." className="text-sm font-sans min-h-[80px] resize-none" />
            </div>`,
  `            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Event Description</Label>
              <Textarea value={newEventData.description} onChange={e => setNewEventData({...newEventData, description: e.target.value})} placeholder="Describe details of this milestone..." className="text-sm font-sans min-h-[80px] resize-none" />
            </div>
            {selectedCase?.documents && selectedCase.documents.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Link Case Document (Optional)</Label>
                <Select value={newEventData.attachmentId || "none"} onValueChange={val => setNewEventData({...newEventData, attachmentId: val === "none" ? "" : val})}>
                  <SelectTrigger className="h-9 text-xs font-sans">
                    <SelectValue placeholder="Select associated document..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs font-sans">None</SelectItem>
                    {selectedCase.documents.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id.toString()} className="text-xs font-sans">{doc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}`
);

// 13. Render Link Case Modal dialog at the bottom
c = c.replace(
  `      </Dialog>
    </div>
  );
}`,
  `      </Dialog>

      {/* Link Case Modal */}
      <Dialog open={showLinkCase} onOpenChange={setShowLinkCase}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-sans flex items-center gap-1.5">
              <Link2 className="h-4.5 w-4.5 text-primary" /> Link Related Case
            </DialogTitle>
            <DialogDescription className="text-xs font-sans text-muted-foreground">
              Establish a connection between this case file and another active record in your firm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Search Cases *</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Type to search case name or number..."
                  value={linkSearch}
                  onChange={e => {
                    setLinkSearch(e.target.value);
                    const matched = caseList.find(c =>
                      c.id !== selectedCase?.id &&
                      (c.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
                       c.caseNumber.toLowerCase().includes(e.target.value.toLowerCase()))
                    );
                    if (matched) {
                      setLinkTargetId(matched.id);
                    } else {
                      setLinkTargetId('');
                    }
                  }}
                  className="pl-8 h-9 text-xs font-sans"
                />
              </div>
              {linkTargetId && (
                <div className="p-2 rounded bg-primary/5 border border-primary/20 text-xs font-sans text-foreground">
                  Selected: <span className="font-semibold">{caseList.find(c => c.id === linkTargetId)?.title}</span> ({linkTargetId})
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Relationship Type *</Label>
              <Select value={linkRelationship} onValueChange={(val: any) => setLinkRelationship(val)}>
                <SelectTrigger className="h-9 text-xs font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'related', label: 'Related Case' },
                    { value: 'parent', label: 'Parent Case' },
                    { value: 'child', label: 'Child Case' },
                    { value: 'appeal_of', label: 'Appeal of' },
                    { value: 'consolidated_with', label: 'Consolidated with' },
                    { value: 'cross_suit', label: 'Cross Suit' }
                  ].map(item => (
                    <SelectItem key={item.value} value={item.value} className="text-xs font-sans">{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Connection Note (Optional)</Label>
              <Textarea
                placeholder="e.g. Challenging identical notification issued by FBR..."
                value={linkNote}
                onChange={e => setLinkNote(e.target.value)}
                className="text-xs font-sans min-h-[70px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="font-sans text-xs" onClick={() => setShowLinkCase(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-gradient-primary font-sans text-xs gap-1.5"
              onClick={handleLinkCaseSubmit}
              disabled={linkingCase || !linkTargetId}
            >
              {linkingCase ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />} Link Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}`
);

fs.writeFileSync('src/pages/lawyer/components/CaseManagement.tsx', c, 'utf8');
console.log('Case Management module successfully updated!');
