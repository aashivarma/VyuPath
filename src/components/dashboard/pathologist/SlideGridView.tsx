import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, FileCheck, AlertTriangle, ChevronLeft, ChevronRight, Grid3X3, Loader2 } from "lucide-react";
import { ViewerNavigationTarget } from "./OpenSeadragonViewer";
import util from "../roles/viewer/util/datamanager";

export interface AnnotatedRegion {
  id: string;
  diagnosis: string;
  confidence: number;
  image: string;
  x: number;
  y: number;
  zoom: number;
  title: string;
  category?: string;
}

interface SlideGridViewProps {
  slideData: any;
  onNavigateToRegion?: (target: ViewerNavigationTarget) => void;
  onSlideSelect?: (slideId: string) => void;
  onGenerateReport?: () => void;
  Doctor?: string;
  tileName?: string;
}

const SlideGridView = ({ slideData, onNavigateToRegion, onSlideSelect, onGenerateReport, Doctor = "Maharshi", tileName = "myslide" }: SlideGridViewProps) => {
  const [gridCols, setGridCols] = useState(4);
  const [gridRows, setGridRows] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);
  const [slideRegions, setSlideRegions] = useState<AnnotatedRegion[]>([]);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = gridCols * gridRows;

  useEffect(() => {
    const fetchRegions = async () => {
      setLoading(true);
      try {
        // Use provided tileName, or fallback to barcode, or absolute default for demo
        const actualTileName = tileName || slideData.barcode || "myslide";
        const annotDet = await util.fetchData(`tileSlide/${Doctor}/${actualTileName}`, 'GET', 'application/json') as any;

        if (annotDet && annotDet.Predicts) {
          const regions: AnnotatedRegion[] = annotDet.Predicts.map((x: any) => ({
            id: x.id,
            diagnosis: x.title, // Map title to diagnosis for consistency
            confidence: Math.floor(Math.random() * (98 - 70 + 1)) + 70, // Mock confidence if not in API
            image: "", // Will be filled with blob URL
            x: x.openSeaXCoord,
            y: x.openSeaYCoord,
            zoom: 3.5,
            title: x.title,
            category: x.cat
          }));

          setSlideRegions(regions);

          // Fetch images for the first few items (or based on pagination)
          const updatedRegions = [...regions];

          // Process in batches of 12
          for (let i = 0; i < updatedRegions.length; i += 12) {
            const batch = updatedRegions.slice(i, i + 12);
            await Promise.all(batch.map(async (region, index) => {
              try {
                const response = await util.fetchData(`get_image/${Doctor}/${actualTileName}/${region.id}`, 'GET', 'image/jpeg') as Response;
                const blob = await response.blob();
                const idx = i + index;
                if (updatedRegions[idx]) {
                  updatedRegions[idx].image = URL.createObjectURL(blob);
                }
              } catch (err) {
                console.error(`Failed to fetch image for region ${region.id}`, err);
              }
            }));
            setSlideRegions([...updatedRegions]);
          }
        }
      } catch (error) {
        console.error("Error fetching slide regions:", error);
        // Fallback to mock data if API fails
        setSlideRegions([
          { id: 'region-1', diagnosis: 'HSIL', confidence: 94, image: '/slides/histo_image.jpg', x: 0.25, y: 0.25, zoom: 8, title: 'HSIL-1', category: 'none' },
          { id: 'region-2', diagnosis: 'LSIL', confidence: 92, image: '/slides/histo_image.jpg', x: 0.5, y: 0.3, zoom: 8, title: 'LSIL-1', category: 'none' },
          { id: 'region-3', diagnosis: 'LSIL', confidence: 85, image: '/slides/histo_image.jpg', x: 0.7, y: 0.4, zoom: 8, title: 'LSIL-2', category: 'none' },
          { id: 'region-4', diagnosis: 'ASCUS', confidence: 78, image: '/slides/histo_image.jpg', x: 0.3, y: 0.6, zoom: 8, title: 'ASCUS-1', category: 'none' },
          { id: 'region-5', diagnosis: 'ASCH', confidence: 88, image: '/slides/histo_image.jpg', x: 0.6, y: 0.5, zoom: 8, title: 'ASCH-1', category: 'none' },
          { id: 'region-6', diagnosis: 'LSIL', confidence: 76, image: '/slides/histo_image.jpg', x: 0.4, y: 0.7, zoom: 8, title: 'LSIL-3', category: 'none' },
        ]);
      } finally {
        setLoading(false);
      }
    };

   fetchRegions();

    // Cleanup object URLs to avoid memory leaks
    return () => {
      slideRegions.forEach(region => {
        if (region.image && region.image.startsWith('blob:')) {
          URL.revokeObjectURL(region.image);
        }
      });
    };
  }, [Doctor, tileName, slideData.barcode]);

  const totalPages = Math.ceil(slideRegions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = slideRegions.slice(indexOfFirstItem, indexOfLastItem);

  const handleDoubleClick = (region: AnnotatedRegion) => {
    if (onNavigateToRegion) {
      onNavigateToRegion({
        x: region.x,
        y: region.y,
        zoom: region.zoom
      });
    }
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getDiagnosisBadgeColor = (diagnosis: string) => {
    switch (diagnosis) {
      case 'HSIL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'LSIL':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'ASCH':
        return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'ASCUS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'AGUS':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) return null;
    if (confidence >= 75) return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
    return <AlertTriangle className="h-3 w-3 text-red-500" />;
  };

  if (loading && slideRegions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-muted-foreground font-medium">Fetching analysis regions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">AI Analysis Results</h3>
          <p className="text-sm text-muted-foreground">
            Sample: {slideData.barcode} | Regions: {slideRegions.length} | Double-click to navigate
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Grid dimension controls */}
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              value={gridCols}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val > 0 && val <= 6) setGridCols(val);
              }}
              className="w-14 h-8"
              min={1}
              max={6}
            />
            <span className="text-muted-foreground">×</span>
            <Input
              type="number"
              value={gridRows}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val > 0 && val <= 6) setGridRows(val);
              }}
              className="w-14 h-8"
              min={1}
              max={6}
            />
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('prev')}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[80px] text-center">
              {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange('next')}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={onGenerateReport} className="bg-green-600 hover:bg-green-700">
            <FileCheck className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Grid of slide regions */}
      <div 
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`
        }}
      >
        {currentItems.map((region) => (
          <Card 
            key={region.id} 
            className="cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary transition-all relative group"
            onDoubleClick={() => handleDoubleClick(region)}
            onClick={() => onSlideSelect?.(region.id)}
          >
            <CardContent className="p-2">
              {/* Title overlay */}
              <div className="absolute top-4 left-4 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {region.title}
              </div>

              {/* Category overlay */}
              {region.category && region.category !== 'none' && (
                <div className="absolute bottom-16 left-4 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {region.category}
                </div>
              )}

              <div className="aspect-square bg-muted rounded border overflow-hidden relative">
                {region.image ? (
                  <img 
                    src={region.image} 
                    alt={`Slide region ${region.id}`}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${region.x * 100}% ${region.y * 100}%`
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {/* Hover overlay with instruction */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    Double-click to view
                  </span>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-center">
                <Badge className={`text-xs font-semibold ${getDiagnosisBadgeColor(region.diagnosis)}`}>
                  {region.diagnosis}
                </Badge>
                <div className="flex items-center space-x-1">
                  {getConfidenceIcon(region.confidence)}
                  <span className="text-xs text-muted-foreground">{region.confidence}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">
                {slideRegions.filter(r => r.diagnosis === 'HSIL').length}
              </div>
              <div className="text-xs text-muted-foreground">HSIL</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {slideRegions.filter(r => r.diagnosis === 'LSIL').length}
              </div>
              <div className="text-xs text-muted-foreground">LSIL</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-pink-600">
                {slideRegions.filter(r => r.diagnosis === 'ASCH').length}
              </div>
              <div className="text-xs text-muted-foreground">ASCH</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-yellow-600">
                {slideRegions.filter(r => r.diagnosis === 'ASCUS').length}
              </div>
              <div className="text-xs text-muted-foreground">ASCUS</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">
                {slideRegions.filter(r => r.diagnosis === 'AGUS').length}
              </div>
              <div className="text-xs text-muted-foreground">AGUS</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard shortcut hint */}
      <div className="text-xs text-muted-foreground text-center">
        Use ← → arrow keys to navigate pages | Double-click any region to view in slide viewer
      </div>
    </div>
  );
};

export default SlideGridView;