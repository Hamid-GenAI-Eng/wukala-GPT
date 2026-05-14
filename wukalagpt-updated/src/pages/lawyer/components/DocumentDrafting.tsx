import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Loader2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const categoryIcons: Record<string, React.ReactNode> = {
  'Court Documents': <Gavel className="h-4 w-4" />,
  'Criminal Law': <Scale className="h-4 w-4" />,
  'Business': <Briefcase className="h-4 w-4" />,
  'Property': <Home className="h-4 w-4" />,
  'Civil Law': <Scale className="h-4 w-4" />,
  'Affidavit': <FileText className="h-4 w-4" />
};

export default function DocumentDrafting() {
  const [view, setView] = useState<'list' | 'draft-editor'>('list');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedTemplateFile, setSelectedTemplateFile] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [showFactDialog, setShowFactDialog] = useState(false);
  const [caseFacts, setCaseFacts] = useState('');
  
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftContent, setDraftContent] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      // Using WukalaGPT Backend URL
      const response = await fetch('http://localhost:5169/api/document-drafting/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to load templates", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!caseFacts.trim()) return;
    
    setIsDrafting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5169/api/document-drafting/generate', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templatePath: selectedTemplateFile,
          caseFacts: caseFacts
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDraftContent(data.draft);
        setShowFactDialog(false);
        setView('draft-editor');
      }
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleExportDocx = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5169/api/document-drafting/export', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markdownContent: draftContent,
          documentTitle: selectedTemplateName.replace('.pdf', '')
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

  const openFactDialog = (categoryName: string, langName: string, fileName: string) => {
    setSelectedTemplateFile(`${categoryName}/${langName}/${fileName}`);
    setSelectedTemplateName(fileName);
    setCaseFacts('');
    setShowFactDialog(true);
  };

  // Filter logic
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
            <Card key={idx} className="border-border/50 shadow-sm hover:border-primary/50 transition-all cursor-pointer group" onClick={() => openFactDialog(item.category, item.language, item.file)}>
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

  const renderDraftEditor = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <button onClick={() => setView('list')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-sans">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to Templates
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold font-sans text-foreground">Draft Editor</h2>
          <p className="text-[10px] text-muted-foreground font-sans">Edit the generated draft below, then export to .docx to preserve formatting.</p>
        </div>
        <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8" onClick={handleExportDocx}>
          <Download className="h-3 w-3" /> Download as .docx
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <Textarea 
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="min-h-[60vh] font-serif text-sm p-4 leading-relaxed"
          />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {view === 'list' && <motion.div key="list">{renderListView()}</motion.div>}
        {view === 'draft-editor' && <motion.div key="editor">{renderDraftEditor()}</motion.div>}
      </AnimatePresence>

      <Dialog open={showFactDialog} onOpenChange={setShowFactDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">Draft Document with AI</DialogTitle>
            <DialogDescription className="text-xs font-sans">
              Provide the specific facts, names, dates, and arguments for <b>{selectedTemplateName.replace('.pdf', '')}</b>. The AI will inject these perfectly into the template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea 
              placeholder="E.g., Client Name: Hamid Ali, Court: District Court Lahore, Dispute: Unpaid rent of 50,000 PKR for 3 months..."
              className="min-h-[150px] text-xs font-sans"
              value={caseFacts}
              onChange={(e) => setCaseFacts(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={() => setShowFactDialog(false)}>Cancel</Button>
            <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5" onClick={handleGenerateDraft} disabled={isDrafting || !caseFacts.trim()}>
              {isDrafting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} 
              {isDrafting ? 'Drafting...' : 'Generate Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
