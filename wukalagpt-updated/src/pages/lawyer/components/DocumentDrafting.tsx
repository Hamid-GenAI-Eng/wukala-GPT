import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search,
  FileText,
  Download,
  Sparkles,
  ChevronLeft,
  Briefcase,
  Home,
  Gavel,
  Scale,
  Loader2,
  Save,
  Pencil
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const categoryIcons: Record<string, React.ReactNode> = {
  'Court Documents': <Gavel className="h-4 w-4" />,
  'Criminal Law': <Scale className="h-4 w-4" />,
  'Business': <Briefcase className="h-4 w-4" />,
  'Property': <Home className="h-4 w-4" />,
  'Civil Law': <Scale className="h-4 w-4" />,
  'Affidavit': <FileText className="h-4 w-4" />
};

interface FormField {
  id: string;
  label: string;
}

export default function DocumentDrafting() {
  const { toast } = useToast();
  const loadState = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(`drafting_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [view, setView] = useState<'list' | 'workspace'>(() => loadState('view', 'list'));
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedTemplateFile, setSelectedTemplateFile] = useState<string>(() => loadState('selectedTemplateFile', ''));
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>(() => loadState('selectedTemplateName', ''));
  
  const [fields, setFields] = useState<FormField[]>(() => loadState('fields', []));
  const [formValues, setFormValues] = useState<Record<string, string>>(() => loadState('formValues', {}));
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftContent, setDraftContent] = useState<string>(() => loadState('draftContent', ''));
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => { localStorage.setItem('drafting_view', JSON.stringify(view)); }, [view]);
  useEffect(() => { localStorage.setItem('drafting_selectedTemplateFile', JSON.stringify(selectedTemplateFile)); }, [selectedTemplateFile]);
  useEffect(() => { localStorage.setItem('drafting_selectedTemplateName', JSON.stringify(selectedTemplateName)); }, [selectedTemplateName]);
  useEffect(() => { localStorage.setItem('drafting_fields', JSON.stringify(fields)); }, [fields]);
  useEffect(() => { localStorage.setItem('drafting_formValues', JSON.stringify(formValues)); }, [formValues]);
  useEffect(() => { localStorage.setItem('drafting_draftContent', JSON.stringify(draftContent)); }, [draftContent]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getDraftingTemplates();
      if (data && data.categories) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      console.error("Failed to load templates", error);
      toast({
        title: "Error Loading Templates",
        description: error.message || "Failed to load document templates. Please try again.",
        variant: "destructive"
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const openWorkspace = async (categoryName: string, langName: string, fileName: string) => {
    const templatePath = `${categoryName}/${langName}/${fileName}`;
    setSelectedTemplateFile(templatePath);
    setSelectedTemplateName(fileName);
    setFormValues({});
    setDraftContent('');
    setView('workspace');
    
    setIsExtracting(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/document-drafting/extract-fields`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ template_path: templatePath })
      });
      if (response.ok) {
        const data = await response.json();
        setFields(data.fields || []);
      }
    } catch (err) {
      console.error("Extraction failed", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateDraft = async () => {
    setIsDrafting(true);
    try {
      const factsString = Object.entries(formValues)
        .map(([key, value]) => `${key.replace(/_/g, ' ').toUpperCase()}: ${value}`)
        .join('\n');

      const response = await fetch(`${getBaseUrl()}/api/document-drafting/generate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_path: selectedTemplateFile,
          case_facts: factsString
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDraftContent(data.draft);
      }
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/document-drafting/export`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown_content: draftContent,
          document_title: selectedTemplateName.replace('.pdf', '')
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTemplateName.replace('.pdf', '')}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const handleSaveToVault = async () => {
    setIsSaving(true);
    try {
      const exportResp = await fetch(`${getBaseUrl()}/api/document-drafting/export`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdown_content: draftContent,
          document_title: selectedTemplateName.replace('.pdf', '')
        })
      });
      
      if (exportResp.ok) {
        const blob = await exportResp.blob();
        const file = new File([blob], `${selectedTemplateName.replace('.pdf', '')}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', 'Draft');
        formData.append('title', `${selectedTemplateName.replace('.pdf', '')} - Generated Draft`);

        const uploadResp = await fetch(`${getBaseUrl()}/api/documents/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${getToken()}` },
          body: formData
        });

        if (uploadResp.ok) {
          alert('Document successfully saved to vault!');
        } else {
          alert('Failed to save document to vault.');
        }
      }
    } catch (err) {
      console.error("Save to vault failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  let displayedFiles: any[] = [];
  categories.forEach(cat => {
    cat.languages.forEach((lang: any) => {
      lang.files.forEach((file: string) => {
        if (file.toLowerCase().includes(searchQuery.toLowerCase())) {
          displayedFiles.push({
            category: cat.name,
            language: lang.language,
            file: file
          });
        }
      });
    });
  });

  const renderListView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-sans text-foreground">AI Document Drafting</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Select a template, provide the facts, and let AI draft the document</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input 
          placeholder="Search all templates..." 
          className="w-full pl-8 h-9 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          {displayedFiles.map((item, idx) => (
            <Card key={idx} className="border-border/50 shadow-sm hover:border-primary/50 transition-all cursor-pointer group" onClick={() => openWorkspace(item.category, item.language, item.file)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    {categoryIcons[item.category] || <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                  </div>
                  <Badge variant="outline" className="text-[9px]">{item.language}</Badge>
                </div>
                <p className="text-xs font-semibold font-sans text-foreground truncate">{item.file.replace('.pdf', '').replace(/-/g, ' ')}</p>
                <Badge variant="secondary" className="text-[9px] mt-2">{item.category}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );

  const renderWorkspaceView = () => {
    return (
      <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '-100%' }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex h-[calc(100vh-100px)] overflow-hidden shadow-premium bg-background">
        
        {/* LEFT PANEL: CONFIGURATION & FORM */}
        <div className="w-[450px] shrink-0 bg-white border-r border-border flex flex-col relative overflow-hidden">
          {/* Header Area */}
          <div className="p-6 pb-4 border-b border-border bg-slate-50/50">
            <button onClick={() => setView('list')} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-fit mb-6">
              <ChevronLeft className="h-4 w-4" /> Back to Templates
            </button>
            
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold font-serif text-foreground tracking-tight">{selectedTemplateName.replace('.pdf', '')}</h2>
              </div>
              <p className="text-muted-foreground text-xs">Fill in the required details accurately to generate the draft.</p>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" className="w-full text-xs h-9 shadow-sm" onClick={handleGenerateDraft} disabled={isDrafting}>
                {isDrafting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />} 
                {isDrafting ? 'Drafting Document...' : 'Generate Draft'}
              </Button>
            </div>
          </div>

          {/* Form Container */}
          <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
            <AnimatePresence mode="wait">
              {isExtracting ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm font-medium">Analyzing template and extracting fields...</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pb-10">
                  {fields.length === 0 && !isExtracting && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                      No specific fields extracted. Please provide general case facts below.
                    </div>
                  )}
                  
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label htmlFor={field.id} className="text-xs font-semibold text-foreground">{field.label}</Label>
                      {field.id.toLowerCase().includes('reason') || field.id.toLowerCase().includes('fact') || field.id.toLowerCase().includes('detail') || field.id.toLowerCase().includes('desc') ? (
                        <Textarea 
                          id={field.id}
                          className="min-h-[100px] text-sm resize-y focus-visible:ring-primary shadow-sm bg-slate-50/50"
                          value={formValues[field.id] || ''}
                          onChange={e => setFormValues({...formValues, [field.id]: e.target.value})}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      ) : (
                        <Input 
                          id={field.id}
                          type={field.id.toLowerCase().includes('date') ? 'date' : 'text'}
                          className="h-9 text-sm focus-visible:ring-primary shadow-sm bg-slate-50/50"
                          value={formValues[field.id] || ''}
                          onChange={e => setFormValues({...formValues, [field.id]: e.target.value})}
                          placeholder={field.id.toLowerCase().includes('date') ? '' : `Enter ${field.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  ))}
                  
                  {fields.length === 0 && (
                     <div className="space-y-1.5">
                       <Label htmlFor="general_facts" className="text-xs font-semibold text-foreground">General Case Facts</Label>
                       <Textarea 
                         id="general_facts"
                         className="min-h-[200px] text-sm resize-y focus-visible:ring-primary shadow-sm bg-slate-50/50"
                         value={formValues['general_facts'] || ''}
                         onChange={e => setFormValues({...formValues, ['general_facts']: e.target.value})}
                         placeholder="Enter all relevant case facts here..."
                       />
                     </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT PANEL: DOCUMENT PREVIEW */}
        <div className="flex-1 bg-muted/20 relative flex flex-col p-4 md:p-8 overflow-hidden">
          {/* Action Bar */}
          <div className="absolute top-4 right-8 z-10 flex gap-2">
            <Button size="sm" variant="outline" className="bg-white hover:bg-slate-50 text-xs h-9 shadow-sm" onClick={handleExportDocx} disabled={!draftContent}>
              <Download className="h-4 w-4 mr-2 text-primary" /> Export Word
            </Button>
            <Button size="sm" variant="outline" className="bg-white hover:bg-slate-50 text-xs h-9 shadow-sm" onClick={handleSaveToVault} disabled={!draftContent || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" /> : <Save className="h-4 w-4 mr-2 text-primary" />} Save to Vault
            </Button>
          </div>

          <div className="flex-1 bg-white shadow-xl rounded-xl overflow-hidden border border-border/50 relative flex flex-col max-w-5xl mx-auto w-full mx-auto ring-1 ring-black/5">
            <div className="py-5 border-b border-border bg-slate-50/80 flex flex-col items-center justify-center shrink-0">
               <h2 className="font-serif font-bold text-xl text-foreground tracking-tight">
                 Document Preview
               </h2>
               <div className="h-0.5 w-12 bg-primary/60 mt-3 rounded-full"></div>
            </div>
            
            <div className="flex-1 relative overflow-auto bg-[#f8f9fa] p-4 md:p-8">
               {draftContent ? (
                  <div className="p-8 md:p-12 max-w-4xl mx-auto bg-white shadow-md rounded border border-border/40 min-h-[800px] flex flex-col">
                    <div className="flex justify-end mb-6 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="h-8 shadow-sm rounded-md px-4 text-xs font-medium border-primary/20 hover:bg-primary/5 text-primary">
                        {isEditing ? 'View Formatted Document' : 'Edit Raw Content'}
                      </Button>
                    </div>
                    {isEditing ? (
                      <Textarea 
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        className="flex-1 w-full min-h-[700px] resize-none font-mono text-sm leading-relaxed border focus-visible:ring-primary/40 p-6 rounded shadow-inner bg-slate-50/50"
                        placeholder="Edit the document text directly here..."
                      />
                    ) : (
                      <div className="flex-1 prose prose-slate max-w-none font-serif marker:text-black prose-headings:font-serif prose-headings:font-bold prose-p:text-justify prose-p:leading-relaxed prose-a:text-primary">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{draftContent}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full w-full bg-white shadow-sm rounded border border-border/40 flex items-center justify-center">
                    {selectedTemplateFile ? (
                      <iframe 
                        src={`${getBaseUrl()}/api/document-drafting/template-file?path=${encodeURIComponent(selectedTemplateFile)}#toolbar=0&navpanes=0&scrollbar=0`} 
                        className="w-full h-full border-0 rounded"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground opacity-50">
                        <FileText className="h-16 w-16 mb-4" />
                        <p>No template selected</p>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-[calc(100vh-80px)]">
      <AnimatePresence mode="wait">
        {view === 'list' && <motion.div key="list" className="h-full">{renderListView()}</motion.div>}
        {view === 'workspace' && <motion.div key="workspace" className="h-full">{renderWorkspaceView()}</motion.div>}
      </AnimatePresence>
    </div>
  );
}
