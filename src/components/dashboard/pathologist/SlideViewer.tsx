
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OpenSeadragon from "openseadragon";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Move,
  Home,
  Square,
  Circle,
  Ruler,
  MousePointer
} from "lucide-react";

interface SlideViewerProps {
  slideData: any;
  onAnnotationChange?: (annotations: any[]) => void;
}
console.log("SlideViewer mounted");
const SlideViewer = ({ slideData, onAnnotationChange }: SlideViewerProps) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'pointer' | 'move' | 'rectangle' | 'circle' | 'ruler'>('pointer');
  const [annotations, setAnnotations] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const zoomLevels = [25, 50, 75, 100, 150, 200, 300, 400, 600, 800, 1200, 1600];
  const osdInstance = useRef<any>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewerRef.current) return;
  
    console.log("Initializing OSD...");
  
    osdInstance.current = OpenSeadragon({
      element: viewerRef.current,
      prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
      showNavigator: true,
      tileSources: {
        width: 1,
        height: 1,
        tileSize: 512,
        minLevel: 0,
        maxLevel: 9,
        getTileUrl: function (level: number, x: number, y: number) {
          const url = `http://localhost:8000/api/fastapi/tile/Maharshi/myslide/${level}/${y}_${x}.jpeg`;
          console.log("Requesting:", url);
          return url;
        }
      }
    });
  
    return () => {
      if (osdInstance.current) {
        osdInstance.current.destroy();
      }
    };
  }, []);
  

  const handleZoomIn = () => {
    if (osdInstance.current) {
      osdInstance.current.viewport.zoomBy(1.2);
      osdInstance.current.viewport.applyConstraints();
    }
  };
  const handleZoomOut = () => {
    if (osdInstance.current) {
      osdInstance.current.viewport.zoomBy(0.8);
      osdInstance.current.viewport.applyConstraints();
    }
  };
  const handleZoomFit = () => {
    if (osdInstance.current) {
      osdInstance.current.viewport.goHome();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'move' || e.button === 1) { // Middle mouse button or move tool
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && (tool === 'move' || e.button === 1)) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Simulated slide regions with different magnifications
  const slideRegions = [
    { id: 'region1', x: 20, y: 15, width: 80, height: 60, type: 'normal', cells: 'Epithelial cells' },
    { id: 'region2', x: 45, y: 35, width: 30, height: 25, type: 'abnormal', cells: 'LSIL cells' },
    { id: 'region3', x: 75, y: 60, width: 20, height: 15, type: 'suspicious', cells: 'Atypical cells' },
  ];

  const getRegionColor = (type: string) => {
    switch (type) {
      case 'abnormal': return 'border-red-500 bg-red-500/10';
      case 'suspicious': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-green-500 bg-green-500/10';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          <Button
            variant={tool === 'pointer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pointer')}
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'move' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('move')}
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('rectangle')}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('circle')}
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === 'ruler' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('ruler')}
          >
            <Ruler className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 25}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium min-w-[60px] text-center">{zoomLevel}%</span>
            <select 
              value={zoomLevel} 
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="text-sm border rounded px-1"
            >
              {zoomLevels.map(level => (
                <option key={level} value={level}>{level}%</option>
              ))}
            </select>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 1600}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleZoomFit}>
            <Home className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Viewer Area */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-gray-900"
      >
        <div
          ref={viewerRef}
          className="w-full h-full"
        />

      </div>


      {/* Status bar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-t text-sm">
        <div className="flex items-center space-x-4">
          <span>Objective: 20x</span>
          <span>Pixel Size: 0.5μm/pixel</span>
          <span>Field: {Math.round(500 / (zoomLevel / 100))}μm</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-red-50">
            HSIL: 2 regions
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            LSIL: 1 region
          </Badge>
          <Badge variant="outline" className="bg-blue-50">
            Normal: 15 regions
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default SlideViewer;
