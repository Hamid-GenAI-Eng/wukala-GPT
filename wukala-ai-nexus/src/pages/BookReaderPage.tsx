import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Bookmark, 
  Download, 
  ZoomIn, 
  ZoomOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface BookData {
  title: string;
  author: string;
  totalPages: number;
  content: string;
}

// This would normally come from your data source
const mockBookContent: Record<string, BookData> = {
  "1": {
    title: "Constitution of Islamic Republic of Pakistan",
    author: "Government of Pakistan",
    totalPages: 150,
    content: `# Constitution of Islamic Republic of Pakistan

## Part I - Introductory

### Article 1: The Republic and its territories
Pakistan shall be a Federal Republic to be known as the Islamic Republic of Pakistan, hereinafter referred to as Pakistan.

The territories of Pakistan shall comprise:
(a) The Provinces of Balochistan, the Khyber Pakhtunkhwa, the Punjab and Sindh;
(b) The Islamabad Capital Territory, hereinafter referred to as the Federal Capital;
(c) Federally Administered Tribal Areas; and
(d) Such States and territories as are or may be included in Pakistan, whether by accession or otherwise.

### Article 2: Islam to be State religion
Islam shall be the State religion of Pakistan.

### Article 2A: The Objectives Resolution
The Objectives Resolution is a substantive part of the Constitution and shall govern its interpretation.

## Part II - Fundamental Rights and Principles of Policy

### Chapter 1 - Fundamental Rights

#### Article 8: Laws inconsistent with or in derogation of Fundamental Rights to be void
Any law, or any custom or usage having the force of law, in so far as it is inconsistent with the rights conferred by this Chapter, shall, to the extent of such inconsistency, be void.

#### Article 9: Security of person
No person shall be deprived of life or liberty save in accordance with law.

#### Article 10: Safeguards as to arrest and detention
(1) No person who is arrested shall be detained in custody without being informed, as soon as may be, of the grounds for such arrest, nor shall he be denied the right to consult and be defended by a legal practitioner of his choice.

(2) Every person who is arrested and detained in custody shall be produced before a magistrate within a period of twenty-four hours of such arrest, excluding the time of journey from the place of arrest to the court of the magistrate, and no such person shall be detained in custody beyond the said period without the authority of a magistrate.`
  },
  "2": {
    title: "Pakistan Penal Code, 1860",
    author: "Government of Pakistan",
    totalPages: 200,
    content: `# Pakistan Penal Code, 1860

## Chapter I - Introduction

### Section 1: Title and extent of operation of the Code
This Act shall be called the Pakistan Penal Code, and shall extend to the whole of Pakistan.

### Section 2: Punishment of offences committed within Pakistan
Every person shall be liable to punishment under this Code and not otherwise for every act or omission contrary to the provisions thereof, of which he shall be guilty within Pakistan.

### Section 3: Punishment of offences committed beyond Pakistan
Any person liable, by any Pakistan law, to be tried for an offence committed beyond Pakistan shall be dealt with according to the provisions of this Code for any act committed beyond Pakistan in the same manner as if such act had been committed within Pakistan.

## Chapter II - General Explanations

### Section 4: Extension of Code to extra-territorial offences
The provisions of this Code apply also to any offence committed by:
(a) Any citizen of Pakistan in any place without and beyond Pakistan;
(b) Any person on any ship or aircraft registered in Pakistan wherever it may be.

### Section 5: Certain laws not to be affected by this Act
Nothing in this Act shall affect the provisions of any Act for punishing mutiny and desertion of officers, soldiers, sailors or airmen in the service of Pakistan.

## Chapter IV - General Exceptions

### Section 76: Act done by a person bound, or by mistake of fact believing himself bound, by law
Nothing is an offence which is done by a person who is, or who by reason of a mistake of fact and not by reason of a mistake of law in good faith believes himself to be, bound by law to do it.`
  }
};

export default function BookReaderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const book = id ? mockBookContent[id] : undefined;

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Book Not Found</h2>
          <Button onClick={() => navigate('/dictionary')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Library
          </Button>
        </Card>
      </div>
    );
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleDownload = () => {
    // Download logic would go here
    alert('Download feature will be implemented');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dictionary')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">{book.title}</h1>
                <p className="text-sm text-muted-foreground">{book.author}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reader Controls */}
      <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Page {currentPage} of {book.totalPages}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[60px] text-center">{zoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto bg-background">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div 
              className="p-8 prose prose-slate dark:prose-invert max-w-none"
              style={{ fontSize: `${zoom}%` }}
            >
              <div dangerouslySetInnerHTML={{ __html: book.content.replace(/\n/g, '<br />') }} />
            </div>
          </ScrollArea>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6 max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, book.totalPages))}
            disabled={currentPage >= book.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}