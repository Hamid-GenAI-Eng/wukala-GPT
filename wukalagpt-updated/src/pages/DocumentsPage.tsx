import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  File, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Search,
  Grid3X3,
  List,
  Filter,
  SortDesc,
  Calendar,
  Eye,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, DocumentResponse, DocumentClassification } from '@/services/api';
import { toast } from 'sonner';

// Mapping from Category String to Enum (used for API requests)
const categoryToEnum: Record<string, number> = {
  'all': -1,
  'contract': DocumentClassification.Contract,
  'legal-document': DocumentClassification.LegalDoc,
  'image': DocumentClassification.Image,
  'other': DocumentClassification.Other,
};

// Colors for the classification labels returned by backend
const getCategoryColor = (classification: string) => {
  switch (classification) {
    case 'Contract':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'LegalDoc':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'Image':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const fetchDocuments = async (query: string = searchQuery) => {
    setIsLoading(true);
    try {
      const typeEnum = categoryToEnum[selectedCategory];
      const data = await api.getDocuments(typeEnum === -1 ? undefined : typeEnum, query);
      setDocuments(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (mimeType?: string) => {
    const t = (mimeType || '').toLowerCase();
    if (t.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (t.includes('doc') || t.includes('msword')) return <FileText className="h-8 w-8 text-blue-500" />;
    if (t.includes('image/') || t.includes('jpg') || t.includes('jpeg') || t.includes('png')) return <ImageIcon className="h-8 w-8 text-green-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFilesUpload(files);
  };

  const handleFilesUpload = async (files: File[]) => {
    setIsUploading(true);
    const promise = Promise.all(
      files.map(async (file) => {
        try {
          const uploaded = await api.uploadDocument(file);
          setDocuments(prev => [uploaded, ...prev]);
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          throw error;
        }
      })
    );

    toast.promise(promise, {
      loading: 'Uploading documents...',
      success: 'All documents uploaded successfully',
      error: 'Failed to upload some documents',
    });

    try {
      await promise;
    } catch (e) {
      // Errors handled by toast.promise
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (document: DocumentResponse) => {
    try {
      if (document.url) {
        window.open(document.url, '_blank');
        return;
      }
      
      // Fallback: Get document info and try to open/download
      const data = await api.getDocument(document.id);
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        toast.info('No direct URL available for this document.');
      }
    } catch (error: any) {
      toast.error('Failed to retrieve document for download');
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await api.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-2">Document Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Upload, organize, and manage your legal documents securely.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div
              className={cn(
                'border-2 border-dashed border-border rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-200',
                isDragging ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Drop files here or click to upload
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Supports PDF, DOCX, TXT, JPG, PNG up to 10MB
              </p>
              <Button 
                onClick={handleFileUpload}
                disabled={isUploading}
                className="bg-gradient-primary hover:shadow-md transition-all duration-200"
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Choose Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Controls */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-accent' : ''}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory('contract')}
              className={selectedCategory === 'contract' ? 'bg-accent' : ''}
            >
              Contracts
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory('legal-document')}
              className={selectedCategory === 'legal-document' ? 'bg-accent' : ''}
            >
              Legal Docs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCategory('image')}
              className={selectedCategory === 'image' ? 'bg-accent' : ''}
            >
              Images
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-accent' : ''}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-accent' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Documents */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search terms.' : 'Upload your first document to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'
              : 'space-y-3 sm:space-y-4'
          )}>
            {documents.map((document) => (
              <Card 
                key={document.id} 
                className={cn(
                  'group hover:shadow-lg transition-all duration-200 animate-fade-in',
                  viewMode === 'list' ? 'p-4' : ''
                )}
              >
                {viewMode === 'grid' ? (
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-xl bg-muted/50">
                        {getFileIcon(document.mimeType)}
                      </div>
                      
                      <div className="w-full text-center">
                        <h3 className="font-medium text-sm truncate px-2" title={document.name}>
                          {document.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {document.sizeFormatted}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {document.timeAgo || formatDate(document.uploadedAt)}
                        </p>
                      </div>

                      <Badge className={cn('text-xs', getCategoryColor(document.classification))}>
                        {document.classification}
                      </Badge>

                      <div className="flex items-center justify-center space-x-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Download" onClick={() => handleDownload(document)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" title="Delete" onClick={() => handleDelete(document.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-muted/50">
                      {getFileIcon(document.mimeType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{document.name}</h3>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span>{document.sizeFormatted}</span>
                        <span>{document.timeAgo || formatDate(document.uploadedAt)}</span>
                        <Badge className={cn('text-xs', getCategoryColor(document.classification))}>
                          {document.classification}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Download" onClick={() => handleDownload(document)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" title="Delete" onClick={() => handleDelete(document.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesUpload(Array.from(e.target.files));
          }
        }}
      />
    </div>
  );
}