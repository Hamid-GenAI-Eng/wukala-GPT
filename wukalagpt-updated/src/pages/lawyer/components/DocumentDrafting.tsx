import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Briefcase, ChevronLeft, Download, FileText, Gavel, Home, Loader2, Pencil, Save, Scale, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import JoditEditor from 'jodit-react';

const categoryIcons: Record<string, React.ReactNode> = {
  'Court Documents': <Gavel className="h-4 w-4" />,
  'Criminal Law': <Scale className="h-4 w-4" />,
  'Business': <Briefcase className="h-4 w-4" />,
  'Property': <Home className="h-4 w-4" />,
  'Civil Law': <Scale className="h-4 w-4" />,
  'Affidavit': <FileText className="h-4 w-4" />,
};

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    try { return new URL(envUrl).origin; } catch { /* fall through */ }
  }
  return 'http://localhost:5285';
};

const getToken = () =>
  sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');

export default function DocumentDrafting() {
  const { toast } = useToast();
  const { encodedPath } = useParams();
  const navigate = useNavigate();
  const isWorkspace = !!encodedPath;
  const editorRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Workspace states
  const [docHtml, setDocHtml] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── Load templates and drafts on mount ──────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesResp, draftsResp] = await Promise.all([
        fetch(`${getBaseUrl()}/api/v1/document-drafting/templates`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
        fetch(`${getBaseUrl()}/api/v1/document-drafts`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
      ]);
      if (templatesResp.ok) {
        const data = await templatesResp.json();
        setCategories(data.categories || []);
      }
      if (draftsResp.ok) {
        const draftsData = await draftsResp.json();
        setDrafts(draftsData || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Load document or draft when URL param changes ───────────────────────
  useEffect(() => {
    if (!encodedPath) return;
    const decodedPath = decodeURIComponent(encodedPath);
    setDocHtml('');
    setContentError('');

    if (decodedPath.startsWith('draft:')) {
      const draftId = decodedPath.replace('draft:', '');
      setActiveDraftId(draftId);
      const found = drafts.find(d => d.id === draftId);
      if (found) {
        setSelectedTemplateName(found.templateName || 'Draft');
        setDocHtml(found.htmlContent || '');
      } else {
        fetchDraftById(draftId);
      }
    } else {
      setActiveDraftId(null);
      setSelectedTemplateName(decodedPath.split('/').pop() ?? '');
      loadDocxAsHtml(decodedPath);
    }
  }, [encodedPath, drafts]);

  const fetchDraftById = async (draftId: string) => {
    setIsLoadingContent(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/v1/document-drafts/${draftId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSelectedTemplateName(data.templateName || 'Draft');
      setDocHtml(data.htmlContent || '');
    } catch (err: any) {
      console.error('Failed to load draft', err);
      setContentError('Could not load the draft. ' + (err.message ?? ''));
    } finally {
      setIsLoadingContent(false);
    }
  };

  const loadDocxAsHtml = useCallback(async (templatePath: string) => {
    setIsLoadingContent(true);
    try {
      const response = await fetch(
        `${getBaseUrl()}/api/v1/document-drafting/template-content?path=${encodeURIComponent(templatePath)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setDocHtml(data.content || '');
    } catch (err: any) {
      console.error('Failed to load docx', err);
      setContentError('Could not load the document. ' + (err.message ?? ''));
    } finally {
      setIsLoadingContent(false);
    }
  }, []);

  // Detect if current template is Urdu to adjust editor formatting
  const isUrdu = useMemo(() => {
    return selectedTemplateName.includes('/Urdu/') || selectedTemplateName.toLowerCase().includes('urdu');
  }, [selectedTemplateName]);

  const editorConfig = useMemo(() => ({
    readonly: false,
    toolbar: true,
    toolbarSticky: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    height: 'auto',
    minHeight: 800,
    direction: isUrdu ? 'rtl' : 'ltr',
    language: isUrdu ? 'ur' : 'en',
    buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'outdent', 'indent', '|', 'font', 'fontsize', 'brush', 'paragraph', '|', 'table', 'link', '|', 'align', 'undo', 'redo'],
    style: {
      background: '#fff',
      padding: '25.4mm',
      fontFamily: isUrdu ? '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", Arial, sans-serif' : '"Times New Roman", Times, serif',
      fontSize: isUrdu ? '14pt' : '12pt',
      color: '#000',
      textAlign: isUrdu ? 'right' : 'left',
    }
  }), [isUrdu]);

  // ── Navigation ──────────────────────────────────────────────────────────
  const openWorkspace = (categoryName: string, langName: string, fileName: string) => {
    const templatePath = `${categoryName}/${langName}/${fileName}`;
    navigate(`/lawyer-dashboard/documents/workspace/${encodeURIComponent(templatePath)}`);
  };

  const openDraftWorkspace = (draftId: string) => {
    navigate(`/lawyer-dashboard/documents/workspace/${encodeURIComponent(`draft:${draftId}`)}`);
  };

  // ── Export as Word ──────────────────────────────────────────────────────
  const handleExportDocx = async () => {
    if (!docHtml) return;
    try {
      const response = await fetch(`${getBaseUrl()}/api/v1/document-drafting/export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown_content: docHtml,
          document_title: selectedTemplateName.replace('.docx', ''),
        }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTemplateName.replace('.docx', '')}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Could not export the document.', variant: 'destructive' });
    }
  };

  // ── Save Document Draft ───────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!docHtml) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/v1/document-drafts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeDraftId, // Send active draft ID if it exists
          templateName: selectedTemplateName,
          htmlContent: docHtml
        }),
      });
      if (response.ok) {
        const savedDraft = await response.json();
        setActiveDraftId(savedDraft.id);
        toast({ title: 'Draft Saved', description: 'Your draft has been saved successfully.' });
        loadData(); // Refresh drafts list behind the scenes
      } else {
        toast({ title: 'Save Failed', description: 'Could not save draft.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Failed to save draft', err);
      toast({ title: 'Save Error', description: 'An error occurred while saving.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // â”€â”€ Save to Vault â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSaveToVault = async () => {
    setIsSaving(true);
    try {
      const exportResp = await fetch(`${getBaseUrl()}/api/v1/document-drafting/export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown_content: docHtml,
          document_title: selectedTemplateName.replace('.docx', ''),
        }),
      });
      if (exportResp.ok) {
        const blob = await exportResp.blob();
        const file = new File([blob], `${selectedTemplateName.replace('.docx', '')}.docx`, {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', 'Draft');
        formData.append('title', `${selectedTemplateName.replace('.docx', '')} - Generated Draft`);
        const uploadResp = await fetch(`${getBaseUrl()}/api/v1/documents/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        });
        toast({
          title: uploadResp.ok ? 'Saved to Vault' : 'Upload Failed',
          description: uploadResp.ok ? 'Document saved to vault!' : 'Could not save to vault.',
          variant: uploadResp.ok ? 'default' : 'destructive',
        });
      }
    } catch (err) {
      console.error('Save to vault failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  // â”€â”€ Filtered file list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const displayedFiles: any[] = [];
  categories.forEach(cat => {
    cat.languages.forEach((lang: any) => {
      lang.files.forEach((file: string) => {
        const q = searchQuery.toLowerCase();
        if (!q || file.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)) {
          displayedFiles.push({ category: cat.name, language: lang.language, file });
        }
      });
    });
  });

  // â”€â”€ RENDER: template list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderListView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold font-sans text-foreground">Document Drafting</h2>
        <p className="text-xs text-muted-foreground font-sans mt-0.5">Select a template to open and edit it.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          placeholder="Search templates..."
          className="w-full pl-8 h-9 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <>
          {drafts.length > 0 && !searchQuery && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" /> Resume Drafting
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {drafts.map((draft) => (
                  <Card
                    key={draft.id}
                    className="border-primary/20 bg-primary/5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => openDraftWorkspace(draft.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">Draft</Badge>
                      </div>
                      <p className="text-xs font-semibold font-sans text-foreground truncate">
                        {draft.templateName.replace('.docx', '').replace(/-/g, ' ')}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Last edited: {new Date(draft.lastModifiedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-semibold mb-3">All Templates</h3>
            <div className="grid sm:grid-cols-3 gap-3">
          {displayedFiles.map((item, idx) => (
            <Card
              key={idx}
              className="border-border/50 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => openWorkspace(item.category, item.language, item.file)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    {categoryIcons[item.category] || <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                  </div>
                  <Badge variant="outline" className="text-[9px]">{item.language}</Badge>
                </div>
                <p className="text-xs font-semibold font-sans text-foreground truncate">
                  {item.file.replace('.docx', '').replace(/-/g, ' ')}
                </p>
                <Badge variant="secondary" className="text-[9px] mt-2">{item.category}</Badge>
              </CardContent>
            </Card>
          ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );

  // â”€â”€ RENDER: document workspace â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const renderWorkspaceView = () => (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-[calc(100vh-100px)] overflow-hidden bg-background"
    >
      {/* Toolbar */}
      <div className="flex-none px-4 py-2.5 border-b border-border bg-white flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lawyer-dashboard/documents')}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2 border-l pl-4 border-border">
            <Pencil className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold font-serif text-foreground tracking-tight truncate max-w-xs">
              {selectedTemplateName.replace('.docx', '').replace(/-/g, ' ')}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs h-9" onClick={handleExportDocx} disabled={isLoadingContent || !!contentError}>
            <Download className="h-4 w-4 mr-1.5 text-primary" /> Export Word
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-9 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary" onClick={handleSaveDraft} disabled={isSaving || isLoadingContent || !!contentError}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Draft
          </Button>
          <Button size="sm" className="text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSaveToVault} disabled={isSaving || isLoadingContent || !!contentError}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save to Vault
          </Button>
        </div>
      </div>

      {/* Document body */}
      <div className="flex-1 overflow-auto bg-[#e8e8e8] p-8 flex justify-center items-start">

        {/* Loading overlay */}
        {isLoadingContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#e8e8e8] z-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Opening document…</p>
          </div>
        )}

        {/* Error state */}
        {!isLoadingContent && contentError && (
          <div className="flex flex-col items-center justify-center text-destructive mt-24 gap-3">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-medium">{contentError}</p>
          </div>
        )}

        {/* Editor */}
        {!isLoadingContent && !contentError && (
          <div className="w-full max-w-[210mm] shadow-2xl">
            <JoditEditor
              ref={editorRef}
              value={docHtml}
              config={editorConfig}
              onBlur={newContent => setDocHtml(newContent)}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex-none px-4 py-1.5 border-t border-border bg-white flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><Pencil className="h-3 w-3" /> Click anywhere in the document to edit</span>
        <span className="ml-auto">{selectedTemplateName}</span>
      </div>
    </motion.div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
        
        /* A4 page styles */
        .doc-editor {
          padding: 25.4mm 25.4mm 25.4mm 25.4mm;
          font-family: ${isUrdu ? '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", Arial, sans-serif' : "'Times New Roman', Times, serif"};
          font-size: ${isUrdu ? '14pt' : '12pt'};
          line-height: 1.5;
          color: #000;
          box-sizing: border-box;
          direction: ${isUrdu ? 'rtl' : 'ltr'};
          text-align: ${isUrdu ? 'right' : 'justify'};
        }
        .doc-editor:focus { outline: none; }

        /* Headings */
        .doc-editor h1, .doc-editor h2, .doc-editor h3,
        .doc-editor h4, .doc-editor h5, .doc-editor h6 {
          font-family: 'Times New Roman', Times, serif;
          font-weight: bold;
          margin: 0.75em 0 0.3em;
          line-height: 1.3;
        }
        .doc-editor h1 { font-size: 16pt; text-align: center; }
        .doc-editor h2 { font-size: 14pt; text-align: center; }
        .doc-editor h3 { font-size: 13pt; }
        .doc-editor h4 { font-size: 12pt; }

        /* Paragraphs */
        .doc-editor p { margin: 0 0 0.5em 0; text-align: justify; }

        /* Tables */
        .doc-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.8em 0;
          font-size: 11pt;
        }
        .doc-editor td, .doc-editor th {
          border: 1px solid #888;
          padding: 5px 8px;
          vertical-align: top;
        }
        .doc-editor th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }

        /* Inline styles */
        .doc-editor strong, .doc-editor b { font-weight: bold; }
        .doc-editor em, .doc-editor i { font-style: italic; }
        .doc-editor u { text-decoration: underline; }
        .doc-editor s { text-decoration: line-through; }

        /* Lists */
        .doc-editor ul, .doc-editor ol { margin: 0.3em 0 0.3em 2em; }
        .doc-editor li { margin: 0.2em 0; }
      `}</style>

      <div className="h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {!isWorkspace && <motion.div key="list" className="h-full">{renderListView()}</motion.div>}
          {isWorkspace && <motion.div key="workspace" className="h-full">{renderWorkspaceView()}</motion.div>}
        </AnimatePresence>
      </div>
    </>
  );
}
