import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Upload,
  FolderOpen,
  FileText,
  File,
  Image,
  MoreVertical,
  Download,
  Lock,
  Eye,
  Clock,
  HardDrive,
  Grid3X3,
  List,
  ChevronRight,
  ChevronLeft,
  Share2,
  History,
  ScanSearch,
  Folder,
  Users,
  Shield,
  Link2,
  Copy,
  Trash2,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ── Types ──
interface VaultFolder {
  id: string;
  name: string;
  files: number;
  size: string;
  icon: React.ElementType;
  color: string;
  subfolders: string[];
}

interface VaultFile {
  id: number;
  name: string;
  folder: string;
  client: string;
  caseRef: string;
  size: string;
  modified: string;
  type: string;
  confidential: boolean;
  ocrIndexed: boolean;
  versions: number;
  sharedWith: string[];
}

// ── Data ──
const folders: VaultFolder[] = [
  { id: 'pleadings', name: 'Pleadings', files: 47, size: '234 MB', icon: FileText, color: 'text-primary', subfolders: ['Plaints', 'Written Statements', 'Applications'] },
  { id: 'evidence', name: 'Evidence', files: 29, size: '1.2 GB', icon: Lock, color: 'text-destructive', subfolders: ['Photographs', 'Documents', 'Expert Reports'] },
  { id: 'orders', name: 'Court Orders', files: 83, size: '512 MB', icon: FolderOpen, color: 'text-gold', subfolders: ['Interim Orders', 'Final Orders', 'Directions'] },
  { id: 'correspondence', name: 'Correspondence', files: 36, size: '189 MB', icon: File, color: 'text-success', subfolders: ['Client Letters', 'Court Notices', 'Opponent Correspondence'] },
  { id: 'identity', name: 'Client Documents', files: 22, size: '98 MB', icon: Users, color: 'text-primary-muted', subfolders: ['CNICs', 'Power of Attorney', 'Contracts'] },
];

const vaultFiles: VaultFile[] = [
  { id: 1, name: 'Wakalatnama - Khan Industries.pdf', folder: 'Pleadings', client: 'Khan Industries Pvt Ltd', caseRef: 'Civil Suit #1247', size: '245 KB', modified: '2 hours ago', type: 'PDF', confidential: true, ocrIndexed: true, versions: 3, sharedWith: [] },
  { id: 2, name: 'Evidence Bundle - State v. Ali Raza.zip', folder: 'Evidence', client: 'Ali Raza', caseRef: 'Criminal Case #892', size: '48 MB', modified: '5 hours ago', type: 'ZIP', confidential: true, ocrIndexed: false, versions: 1, sharedWith: [] },
  { id: 3, name: 'Sale Agreement - Islamabad Realty.docx', folder: 'Correspondence', client: 'Islamabad Developers', caseRef: 'Civil Suit #2847', size: '890 KB', modified: 'Yesterday', type: 'DOCX', confidential: false, ocrIndexed: true, versions: 5, sharedWith: ['client'] },
  { id: 4, name: 'Property Survey Report.pdf', folder: 'Evidence', client: 'Ahmed Real Estate Group', caseRef: 'Civil Suit #1893', size: '3.2 MB', modified: 'Yesterday', type: 'PDF', confidential: false, ocrIndexed: true, versions: 1, sharedWith: [] },
  { id: 5, name: 'Tax Return Filing - FY2024.xlsx', folder: 'Client Documents', client: 'Khan Industries Pvt Ltd', caseRef: 'Tax Reference #445', size: '156 KB', modified: '3 days ago', type: 'XLSX', confidential: true, ocrIndexed: false, versions: 2, sharedWith: [] },
  { id: 6, name: 'Court Order - Civil Suit #2847.pdf', folder: 'Court Orders', client: 'Islamabad Developers', caseRef: 'Civil Suit #2847', size: '1.1 MB', modified: '4 days ago', type: 'PDF', confidential: false, ocrIndexed: true, versions: 1, sharedWith: ['client', 'opponent'] },
  { id: 7, name: 'CNIC - Fatima Bibi.jpg', folder: 'Client Documents', client: 'Fatima Bibi', caseRef: 'Family Suit #331', size: '420 KB', modified: '5 days ago', type: 'IMG', confidential: true, ocrIndexed: true, versions: 1, sharedWith: [] },
  { id: 8, name: 'Written Statement - Ahmed Real Estate.pdf', folder: 'Pleadings', client: 'Ahmed Real Estate Group', caseRef: 'Civil Suit #1893', size: '2.8 MB', modified: '1 week ago', type: 'PDF', confidential: false, ocrIndexed: true, versions: 4, sharedWith: [] },
];

const versionHistory = [
  { version: 'v5', date: '10 Jul 2025, 3:15 PM', author: 'Adv. Sara Malik', change: 'Updated clause 4.2 — payment terms revised' },
  { version: 'v4', date: '8 Jul 2025, 11:00 AM', author: 'Adv. Ayesha Khan', change: 'Added arbitration clause per client request' },
  { version: 'v3', date: '5 Jul 2025, 2:45 PM', author: 'Adv. Sara Malik', change: 'Incorporated opposing counsel feedback' },
  { version: 'v2', date: '2 Jul 2025, 10:30 AM', author: 'Adv. Sara Malik', change: 'Initial draft reviewed by senior partner' },
  { version: 'v1', date: '28 Jun 2025, 4:00 PM', author: 'Adv. Ayesha Khan', change: 'First draft created from template' },
];

const storageTiers = [
  { plan: 'Basic', storage: '5 GB', used: '2.1 GB', pct: 42, price: 'Free' },
  { plan: 'Pro', storage: '50 GB', used: '—', pct: 0, price: '₨ 2,500/mo' },
  { plan: 'Firm', storage: '500 GB', used: '—', pct: 0, price: '₨ 8,000/mo' },
];

const typeIcon: Record<string, React.ElementType> = {
  PDF: FileText,
  DOCX: File,
  ZIP: HardDrive,
  XLSX: File,
  IMG: Image,
};

type ViewMode = 'folders' | 'folder-detail' | 'file-detail';

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.25 } };

export default function DocumentVault() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentView, setCurrentView] = useState<ViewMode>('folders');
  const [selectedFolder, setSelectedFolder] = useState<VaultFolder | null>(null);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'search' | 'storage'>('browse');

  const filteredFiles = vaultFiles.filter(f => {
    const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.client.toLowerCase().includes(searchQuery.toLowerCase()) || f.caseRef.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || f.folder === selectedFolder.name;
    return matchesSearch && matchesFolder;
  });

  const openFolder = (folder: VaultFolder) => {
    setSelectedFolder(folder);
    setCurrentView('folder-detail');
  };

  const openFile = (file: VaultFile) => {
    setSelectedFile(file);
    setCurrentView('file-detail');
  };

  const goBack = () => {
    if (currentView === 'file-detail') {
      setSelectedFile(null);
      setCurrentView(selectedFolder ? 'folder-detail' : 'folders');
    } else {
      setSelectedFolder(null);
      setCurrentView('folders');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-sans text-foreground">Secure Document Vault</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Encrypted cloud storage with OCR search</p>
        </div>
        <Button size="sm" className="bg-gradient-primary font-sans text-xs gap-1.5 h-9">
          <Upload className="h-3.5 w-3.5" /> Upload Files
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'browse' | 'search' | 'storage')}>
        <TabsList className="bg-secondary/50 h-9 p-0.5 w-full justify-start">
          <TabsTrigger value="browse" className="text-[11px] font-sans gap-1 px-2.5 data-[state=active]:bg-background">
            <FolderOpen className="h-3 w-3" /> Browse
          </TabsTrigger>
          <TabsTrigger value="search" className="text-[11px] font-sans gap-1 px-2.5 data-[state=active]:bg-background">
            <ScanSearch className="h-3 w-3" /> Full-Text Search
          </TabsTrigger>
          <TabsTrigger value="storage" className="text-[11px] font-sans gap-1 px-2.5 data-[state=active]:bg-background">
            <HardDrive className="h-3 w-3" /> Storage
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <AnimatePresence mode="wait">
        {/* ═══ BROWSE TAB ═══ */}
        {activeTab === 'browse' && (
          <motion.div key="browse" {...fadeIn} className="space-y-5">
            {/* Storage Bar */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-sans text-muted-foreground">Storage Used</span>
                  <span className="text-xs font-semibold font-sans text-foreground">2.1 GB / 5 GB</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: '42%' }} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] font-sans text-muted-foreground">
                  <span>{vaultFiles.length} files</span>
                  <span>{folders.length} folders</span>
                  <span>{vaultFiles.filter(f => f.confidential).length} confidential</span>
                  <span>{vaultFiles.filter(f => f.ocrIndexed).length} OCR indexed</span>
                </div>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {/* Folder Grid */}
              {currentView === 'folders' && (
                <motion.div key="folders" {...fadeIn}>
                  <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Folders — Client → Case → Document Type</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {folders.map(f => (
                      <Card key={f.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => openFolder(f)}>
                        <CardContent className="p-4">
                          <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3 ${f.color} group-hover:scale-105 transition-transform`}>
                            <f.icon className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-semibold font-sans text-foreground">{f.name}</p>
                          <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{f.files} files · {f.size}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {f.subfolders.map(sf => (
                              <Badge key={sf} variant="secondary" className="text-[8px] font-sans">{sf}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Recent Files */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold font-sans text-foreground">Recent Files</h3>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs font-sans w-40 bg-card border-border/50" />
                        </div>
                        <div className="flex bg-secondary/50 rounded-md p-0.5">
                          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5" /></Button>
                          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}><Grid3X3 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                    <FileList files={filteredFiles.slice(0, 5)} onFileClick={openFile} />
                  </div>
                </motion.div>
              )}

              {/* Folder Detail */}
              {currentView === 'folder-detail' && selectedFolder && (
                <motion.div key="folder-detail" {...fadeIn}>
                  <button onClick={goBack} className="flex items-center gap-1 text-xs text-primary font-sans mb-3 hover:underline">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back to Folders
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${selectedFolder.color}`}>
                      <selectedFolder.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold font-sans text-foreground">{selectedFolder.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-sans">{selectedFolder.files} files · {selectedFolder.size}</p>
                    </div>
                  </div>
                  {/* Subfolders */}
                  <div className="flex gap-2 mb-4">
                    {selectedFolder.subfolders.map(sf => (
                      <div key={sf} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/50 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors">
                        <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-sans text-foreground">{sf}</span>
                      </div>
                    ))}
                  </div>
                  <FileList files={filteredFiles} onFileClick={openFile} />
                </motion.div>
              )}

              {/* File Detail */}
              {currentView === 'file-detail' && selectedFile && (
                <motion.div key="file-detail" {...fadeIn}>
                  <button onClick={goBack} className="flex items-center gap-1 text-xs text-primary font-sans mb-3 hover:underline">
                    <ChevronLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                            {(() => { const Icon = typeIcon[selectedFile.type] || FileText; return <Icon className="h-6 w-6 text-muted-foreground" />; })()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-base font-semibold font-sans text-foreground">{selectedFile.name}</h3>
                              {selectedFile.confidential && <Lock className="h-3.5 w-3.5 text-destructive" />}
                            </div>
                            <p className="text-xs text-muted-foreground font-sans">{selectedFile.folder} · {selectedFile.size} · {selectedFile.modified}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-8 text-xs font-sans gap-1"><Eye className="h-3 w-3" /> Preview</Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-sans gap-1"><Download className="h-3 w-3" /> Download</Button>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                        {[
                          { label: 'Client', value: selectedFile.client },
                          { label: 'Case Reference', value: selectedFile.caseRef },
                          { label: 'OCR Indexed', value: selectedFile.ocrIndexed ? 'Yes — Searchable' : 'No' },
                          { label: 'Versions', value: `${selectedFile.versions} version(s)` },
                        ].map(m => (
                          <div key={m.label} className="p-3 rounded-lg bg-secondary/30">
                            <p className="text-[10px] text-muted-foreground font-sans">{m.label}</p>
                            <p className="text-xs font-semibold font-sans text-foreground mt-0.5">{m.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-sans gap-1"><Share2 className="h-3 w-3" /> Secure Share</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="font-sans text-foreground">Secure Share Link</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 mt-2">
                              <p className="text-xs text-muted-foreground font-sans">Generate a time-limited, password-protected link to share this document securely.</p>
                              <div>
                                <label className="text-[10px] font-sans text-muted-foreground">Link Expiry</label>
                                <div className="flex gap-2 mt-1">
                                  {['24 hours', '7 days', '30 days'].map(t => (
                                    <Button key={t} variant="outline" size="sm" className="text-[10px] font-sans h-7 flex-1">{t}</Button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-sans text-muted-foreground">Password (Optional)</label>
                                <Input placeholder="Set a password" className="mt-1 text-xs font-sans h-8" type="password" />
                              </div>
                              <Button className="w-full bg-gradient-primary font-sans text-sm gap-2"><Link2 className="h-4 w-4" /> Generate Secure Link</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-sans gap-1"><Copy className="h-3 w-3" /> Duplicate</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-sans gap-1 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /> Delete</Button>
                      </div>

                      {/* Version History */}
                      {selectedFile.versions > 1 && (
                        <div>
                          <h4 className="text-sm font-semibold font-sans text-foreground mb-3 flex items-center gap-1.5"><History className="h-4 w-4" /> Version History</h4>
                          <div className="space-y-0">
                            {versionHistory.slice(0, selectedFile.versions).map((v, i) => (
                              <div key={v.version} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
                                <div className="flex flex-col items-center">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold font-sans ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                    {v.version}
                                  </div>
                                  {i < selectedFile.versions - 1 && <div className="w-px h-6 bg-border/50 mt-1" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-sans text-foreground">{v.change}</p>
                                  <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{v.author} · {v.date}</p>
                                </div>
                                {i > 0 && <Button variant="ghost" size="sm" className="h-6 text-[9px] font-sans">Restore</Button>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══ FULL-TEXT SEARCH ═══ */}
        {activeTab === 'search' && (
          <motion.div key="search" {...fadeIn} className="space-y-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-2">OCR-Powered Full-Text Search</h3>
                <p className="text-[10px] text-muted-foreground font-sans mb-3">Search across all documents including scanned files. OCR extracts text from images and handwritten Urdu court orders.</p>
                <div className="relative">
                  <ScanSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by keyword, client name, case number, or date..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 text-sm font-sans bg-card border-border/50" />
                </div>
              </CardContent>
            </Card>

            {searchQuery ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-sans">{filteredFiles.length} results for "{searchQuery}"</p>
                {filteredFiles.map(file => {
                  const Icon = typeIcon[file.type] || FileText;
                  return (
                    <Card key={file.id} className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedFile(file); setActiveTab('browse'); setCurrentView('file-detail'); }}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium font-sans text-foreground truncate">{file.name}</p>
                              {file.ocrIndexed && <Badge variant="secondary" className="text-[8px] font-sans gap-0.5"><ScanSearch className="h-2.5 w-2.5" /> OCR</Badge>}
                              {file.confidential && <Lock className="h-3 w-3 text-destructive shrink-0" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-sans">{file.client} · {file.caseRef} · {file.folder}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <ScanSearch className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-sans">Enter a search term to find documents</p>
                <p className="text-[10px] text-muted-foreground/60 font-sans mt-1">Searches across file names, OCR-extracted text, client names, and case references</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ STORAGE TIERS ═══ */}
        {activeTab === 'storage' && (
          <motion.div key="storage" {...fadeIn} className="space-y-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-1">Storage & Encryption</h3>
                <p className="text-[10px] text-muted-foreground font-sans mb-4">All files encrypted at rest (AES-256) and in transit. Virus scanned on every upload.</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {storageTiers.map((tier, i) => (
                    <div key={tier.plan} className={`p-4 rounded-lg border ${i === 0 ? 'border-primary/30 bg-primary/5' : 'border-border/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold font-sans text-foreground">{tier.plan}</h4>
                        {i === 0 && <Badge className="text-[8px] font-sans bg-primary/10 text-primary border-0">Current</Badge>}
                      </div>
                      <p className="text-2xl font-bold font-sans text-foreground">{tier.storage}</p>
                      <p className="text-xs text-muted-foreground font-sans mb-3">{tier.price}</p>
                      {i === 0 ? (
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-sans mb-1">
                            <span className="text-muted-foreground">Used</span>
                            <span className="font-semibold text-foreground">{tier.used}</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${tier.pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full text-xs font-sans h-8">
                          <ArrowUpRight className="h-3 w-3 mr-1" /> Upgrade
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Security Features</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {[
                    { icon: Shield, title: 'AES-256 Encryption', desc: 'All files encrypted at rest using military-grade encryption' },
                    { icon: ScanSearch, title: 'OCR Text Extraction', desc: 'Scanned documents and Urdu handwriting automatically indexed' },
                    { icon: History, title: 'Version Control', desc: 'Full version history preserved — never lose a previous draft' },
                    { icon: Share2, title: 'Secure Sharing', desc: 'Time-limited, password-protected sharing links for clients' },
                  ].map(s => (
                    <div key={s.title} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <s.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold font-sans text-foreground">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── File List Component ──
function FileList({ files, onFileClick }: { files: VaultFile[]; onFileClick: (f: VaultFile) => void }) {
  return (
    <div className="space-y-2">
      {files.map(file => {
        const Icon = typeIcon[file.type] || FileText;
        return (
          <Card key={file.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => onFileClick(file)}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium font-sans text-foreground truncate">{file.name}</p>
                      {file.confidential && <Lock className="h-3 w-3 text-destructive shrink-0" />}
                      {file.ocrIndexed && <Badge variant="secondary" className="text-[8px] font-sans">OCR</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-sans">
                      <span>{file.client}</span>
                      <span>·</span>
                      <span>{file.caseRef}</span>
                      <span>·</span>
                      <span>{file.size}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{file.modified}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {file.versions > 1 && <Badge variant="outline" className="text-[8px] font-sans gap-0.5"><History className="h-2.5 w-2.5" /> v{file.versions}</Badge>}
                  <Badge variant="secondary" className="text-[9px] font-sans">{file.type}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
