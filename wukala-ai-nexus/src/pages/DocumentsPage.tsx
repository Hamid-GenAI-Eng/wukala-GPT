import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  File, 
  Image, 
  Download, 
  Trash2, 
  Search,
  Grid3X3,
  List,
  Filter,
  SortDesc,
  Calendar,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  category: 'contract' | 'legal-document' | 'image' | 'other';
  preview?: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Property Purchase Agreement.pdf',
    type: 'pdf',
    size: 2.4 * 1024 * 1024, // 2.4 MB
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    category: 'contract'
  },
  {
    id: '2',
    name: 'Legal Notice Draft.docx',
    type: 'docx',
    size: 0.8 * 1024 * 1024, // 0.8 MB
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    category: 'legal-document'
  },
  {
    id: '3',
    name: 'Court Summons.jpg',
    type: 'jpg',
    size: 1.2 * 1024 * 1024, // 1.2 MB
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
    category: 'image'
  },
  {
    id: '4',
    name: 'Business Registration Certificate.pdf',
    type: 'pdf',
    size: 0.5 * 1024 * 1024, // 0.5 MB
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
    category: 'legal-document'
  },
  {
    id: '5',
    name: 'Employment Contract Template.txt',
    type: 'txt',
    size: 0.1 * 1024 * 1024, // 0.1 MB
    uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
    category: 'contract'
  }
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-8 w-8 text-green-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contract':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'legal-document':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'image':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
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

  const handleFilesUpload = (files: File[]) => {
    files.forEach(file => {
      const newDocument: Document = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.name.split('.').pop() || 'unknown',
        size: file.size,
        uploadDate: new Date(),
        category: file.type.includes('image') ? 'image' : 'other'
      };
      
      setDocuments(prev => [newDocument, ...prev]);
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (document: Document) => {
    // In a real app, this would download the actual file
    console.log('Downloading:', document.name);
  };

  const handleDelete = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
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
                className="bg-gradient-primary hover:shadow-md transition-all duration-200"
              >
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
        {filteredDocuments.length === 0 ? (
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
            {filteredDocuments.map((document) => (
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
                        {getFileIcon(document.type)}
                      </div>
                      
                      <div className="w-full">
                        <h3 className="font-medium text-sm truncate" title={document.name}>
                          {document.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(document.size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(document.uploadDate)}
                        </p>
                      </div>

                      <Badge className={cn('text-xs', getCategoryColor(document.category))}>
                        {document.category.replace('-', ' ')}
                      </Badge>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="h-8">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => handleDownload(document)}>
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8" onClick={() => handleDelete(document.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-muted/50">
                      {getFileIcon(document.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{document.name}</h3>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(document.size)}</span>
                        <span>{formatDate(document.uploadDate)}</span>
                        <Badge className={cn('text-xs', getCategoryColor(document.category))}>
                          {document.category.replace('-', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" className="h-8">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => handleDownload(document)}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => handleDelete(document.id)}>
                        <Trash2 className="h-3 w-3" />
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