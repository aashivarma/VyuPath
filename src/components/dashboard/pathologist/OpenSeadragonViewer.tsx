import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import OpenSeadragon from "openseadragon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { getTileServerUrl } from "../roles/viewer/util/datamanager";
import { useLayoutEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Home,
  Square,
  Circle,
  Ruler,
  MousePointer,
  Maximize,
  SunMedium,
  Contrast,
  Palette,
  Trash2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ViewerNavigationTarget {
  x: number;
  y: number;
  zoom: number;
}

export interface OpenSeadragonViewerHandle {
  navigateToPosition: (x: number, y: number, zoom: number) => void;
  getViewer: () => OpenSeadragon.Viewer | null;
}

interface OpenSeadragonViewerProps {
  slideData?: any;
  imageUrl?: string;
  slideImageUrl?: string | null;
  onAnnotationChange?: (annotations: any[]) => void;
  initialPosition?: ViewerNavigationTarget;
  tileName?: string | null;
  Doctor?: string;
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rectangle' | 'circle' | 'measurement';
  label?: string;
  color: string;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  distance?: number;
}

const OpenSeadragonViewer = forwardRef<OpenSeadragonViewerHandle, OpenSeadragonViewerProps>(
  ({ slideData, imageUrl, slideImageUrl: propSlideImageUrl, onAnnotationChange, initialPosition, tileName, Doctor = "Maharshi" }, ref) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const osdViewerRef = useRef<OpenSeadragon.Viewer | null>(null);
    const { toast } = useToast();
    
    const [zoomLevel, setZoomLevel] = useState(1);
    const [tool, setTool] = useState<'pointer' | 'move' | 'rectangle' | 'circle' | 'ruler'>('pointer');
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [viewportInfo, setViewportInfo] = useState({ x: 0, y: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
    
    // Image adjustment filters
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    
    // Use the uploaded slide image or fallback to default
    const slideImageUrl = propSlideImageUrl || imageUrl || '/slides/histo_image.jpg';

    // Expose navigation method to parent
    useImperativeHandle(ref, () => ({
      // navigateToPosition: (x: number, y: number, zoom: number) => {
      //   if (osdViewerRef.current) {
      //     osdViewerRef.current.viewport.zoomTo(zoom);
      //     osdViewerRef.current.viewport.panTo(new OpenSeadragon.Point(x, y));
      //     osdViewerRef.current.forceRedraw();
      //   }
      // },
      navigateToPosition: (x: number, y: number, zoom: number) => {
        const viewer = osdViewerRef.current;
        if (!viewer) return;
      
        const goToLocation = () => {
          const point = new OpenSeadragon.Point(x, y);
      
          // First pan
          viewer.viewport.panTo(point, true);
      
          // Then zoom
          viewer.viewport.zoomTo(zoom || 5, point, true);
      
          viewer.viewport.applyConstraints();
        };

        // Always remove any pending open handlers first
        viewer.removeAllHandlers("open");

        // Always attach navigation AFTER open
        viewer.addOnceHandler("open", goToLocation);

        // If already open, manually trigger navigation
        if (viewer.world.getItemCount() > 0) {
          goToLocation();
        }
      
        // // If image not loaded yet, wait for it
        // if (!viewer.world.getItemAt(0)) {
        //   viewer.addOnceHandler("open", goToLocation);
        // } else {
        //   goToLocation();
        // }
      },
      getViewer: () => osdViewerRef.current
    }));

    const [slideInfo, setSlideInfo] = useState<{
      width: number;
      height: number;
      levels: number;
    } | null>(null);
    

    // Initialize OpenSeadragon
    // useEffect(() => {
      
    //   if (!tileName) return;
    
    //   const fetchSlideInfo = async () => {
    //     try {
    //       const res = await fetch(
    //         `http://localhost:8000/api/fastapi/slide_info/${Doctor}/${tileName}`
    //       );
    //       const data = await res.json();
    //       console.log("Slide info:", data);
    //       console.log("TileName:", tileName);
    //       setSlideInfo(data);
    //     } catch (err) {
    //       console.error("Failed to fetch slide info", err);
    //     }
    //   };
      
    //     fetchSlideInfo();
    //   }, [tileName, Doctor]);
    
    useEffect(() => {
    
      //if (!viewerRef.current || !slideInfo) return;
      // if (!viewerRef.current || !slideInfo || !tileName) return;
      if (!viewerRef.current || !tileName) return;
      const initializeViewer = () => {
        if (!viewerRef.current) return;
    
        console.log(
          "Viewer div size:",
          viewerRef.current.clientWidth,
          viewerRef.current.clientHeight
        );
    
        if (viewerRef.current.clientWidth === 0) {
          requestAnimationFrame(initializeViewer);
          return;
        }

        // Destroy existing viewer if any
        if (osdViewerRef.current) {
          osdViewerRef.current.destroy();
          osdViewerRef.current = null;
        }

        // Determine tileSource based on tileName
        let tileSource: any;
        // Use NDPI tile API directly (NO DZI)
        //const actualTileName = tileName || "4007";
        //console.log("TileName:", tileName);

        // tileSource = {
        //   type: "legacy-image-pyramid",
        //   width: slideInfo.width,
        //   height: slideInfo.height,
        //   tileSize: 512,
        //   minLevel: 0,
        //   maxLevel: slideInfo.levels - 1,
        //   getTileUrl: function (level: number, x: number, y: number) {
        //     console.log("Requesting tile:", level, x, y);
        //     return `http://localhost:8000/api/fastapi/tile/${Doctor}/${tileName}/${level}/${y}_${x}.jpeg`;
        //   }
        // };


        // Create OpenSeadragon viewer
        const viewer = OpenSeadragon({
          element: viewerRef.current,
          prefixUrl: "https://cdn.jsdelivr.net/npm/openseadragon@4.1/build/openseadragon/images/",
          // tileSources: tileSource,
          tileSources: `http://localhost:8000/api/fastapi/dzi/${Doctor}/${tileName}.dzi`,
          animationTime: 0.5,
          blendTime: 0.1,
          constrainDuringPan: true,
          maxZoomPixelRatio: 20,
          minZoomImageRatio: 0.5,
          visibilityRatio: 0.5,
          zoomPerScroll: 1.4,
          //maxZoomLevel: 2,
          minZoomLevel: 0.5,
          showNavigator: true,
          navigatorPosition: 'BOTTOM_RIGHT',
          navigatorSizeRatio: 0.15,
          navigatorMaintainSizeRatio: true,
          navigatorAutoFade: false,
          showNavigationControl: false,
          gestureSettingsMouse: {
            clickToZoom: false,
            dblClickToZoom: true,
          },
          gestureSettingsTouch: {
            pinchToZoom: true,
            flickEnabled: true,
          },
          crossOriginPolicy: "Anonymous",
          ajaxWithCredentials: false,
        });

        osdViewerRef.current = viewer;


        // Add zoom handler
        viewer.addHandler('zoom', (event) => {
          setZoomLevel(event.zoom || 1);
        });

        // Add viewport change handler for position tracking
        viewer.addHandler('animation', () => {
          const center = viewer.viewport.getCenter();
          if (center) {
            setViewportInfo({ x: center.x, y: center.y });
          }
        });
        // viewer.addHandler("open", () => {
        //   console.log("OpenSeadragon viewer opened");
        
        //   const image = viewer.world.getItemAt(0);
        
        //   // Home zoom = fit to screen
        //   const homeZoom = viewer.viewport.getHomeZoom();
        
        //   // Compute maximum zoom based on pyramid highest level
        //   const maxZoom = image.viewportToImageZoom(
        //     image.getMaxZoom()
        //   );
        
        //   // Clamp viewport zoom properly
        //   viewer.viewport.setMinZoom(homeZoom);
        //   viewer.viewport.setMaxZoom(maxZoom);
        
        //   viewer.viewport.goHome();
        // });
        viewer.addHandler("open", () => {
          const homeZoom = viewer.viewport.getHomeZoom();
          viewer.viewport.setMinZoom(homeZoom);
          viewer.viewport.setMaxZoom(homeZoom * 20);
          viewer.viewport.goHome();
        });


        // viewer.addHandler('open', () => {
        //   console.log('OpenSeadragon viewer opened');
        
        //   const maxZoom = viewer.viewport.getMaxZoom();
        //   const minZoom = viewer.viewport.getMinZoom();
        
        //   viewer.viewport.setMaxZoom(maxZoom);
        //   viewer.viewport.setMinZoom(minZoom);
        
        //   if (initialPosition) {
        //     const clampedZoom = Math.min(initialPosition.zoom, maxZoom);
        //     viewer.viewport.zoomTo(clampedZoom);
        //     viewer.viewport.panTo(
        //       new OpenSeadragon.Point(initialPosition.x, initialPosition.y)
        //     );
        //   } else {
        //     viewer.viewport.zoomTo(minZoom);
        //   }
        // });

        // Add open handler
        // viewer.addHandler('open', () => {
        //   console.log('OpenSeadragon viewer opened');
          
        //   // Navigate to initial position if provided
        //   if (initialPosition) {
        //     viewer.viewport.zoomTo(initialPosition.zoom);
        //     viewer.viewport.panTo(new OpenSeadragon.Point(initialPosition.x, initialPosition.y));
        //   } else {
        //     viewer.viewport.zoomTo(1);
        //   }
        // });
      };
      requestAnimationFrame(initializeViewer);

      // Cleanup
      return () => {
        if (osdViewerRef.current) {
          osdViewerRef.current.destroy();
          osdViewerRef.current = null;
        }
      };
    }, [slideInfo, tileName, Doctor, initialPosition]);

    // Apply image filters
    useEffect(() => {
      if (osdViewerRef.current && osdViewerRef.current.canvas) {
        osdViewerRef.current.canvas.style.filter = 
          `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      }
    }, [brightness, contrast, saturation]);

    // Handle tool changes
    useEffect(() => {
      if (!osdViewerRef.current) return;
      
      const viewer = osdViewerRef.current;
      
      if (tool === 'move' || tool === 'pointer') {
        viewer.setMouseNavEnabled(true);
      } else {
        viewer.setMouseNavEnabled(false);
      }
    }, [tool]);

    // Calculate distance between two points (simulated μm)
    const calculateDistance = (start: { x: number; y: number }, end: { x: number; y: number }): number => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const pixelDistance = Math.sqrt(dx * dx + dy * dy);
      // Convert to μm (assuming 0.5μm per pixel at base zoom)
      return Math.round(pixelDistance * 500 / zoomLevel);
    };

    // Handle annotation drawing
    const handleOverlayMouseDown = useCallback((e: React.MouseEvent) => {
      if (tool === 'pointer' || tool === 'move') return;
      
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setIsDrawing(true);
      setDrawStart({ x, y });
      
      const color = tool === 'rectangle' ? '#ef4444' : tool === 'circle' ? '#3b82f6' : '#22c55e';
      
      setCurrentAnnotation({
        id: `ann-${Date.now()}`,
        x,
        y,
        width: 0,
        height: 0,
        type: tool === 'ruler' ? 'measurement' : tool,
        color,
        startPoint: { x, y },
      });
    }, [tool, zoomLevel]);

    const handleOverlayMouseMove = useCallback((e: React.MouseEvent) => {
      if (!isDrawing || !drawStart || !currentAnnotation) return;
      
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const width = Math.abs(x - drawStart.x);
      const height = Math.abs(y - drawStart.y);
      const minX = Math.min(x, drawStart.x);
      const minY = Math.min(y, drawStart.y);
      
      if (currentAnnotation.type === 'measurement') {
        const distance = calculateDistance(drawStart, { x, y });
        setCurrentAnnotation({
          ...currentAnnotation,
          endPoint: { x, y },
          distance,
        });
      } else {
        setCurrentAnnotation({
          ...currentAnnotation,
          x: minX,
          y: minY,
          width,
          height,
        });
      }
    }, [isDrawing, drawStart, currentAnnotation, zoomLevel]);

    const handleOverlayMouseUp = useCallback(() => {
      if (!isDrawing || !currentAnnotation) return;
      
      setIsDrawing(false);
      
      // Only add if annotation has size
      if (currentAnnotation.type === 'measurement') {
        if (currentAnnotation.distance && currentAnnotation.distance > 0) {
          const newAnnotations = [...annotations, currentAnnotation];
          setAnnotations(newAnnotations);
          onAnnotationChange?.(newAnnotations);
          toast({
            title: "Measurement Added",
            description: `Distance: ${currentAnnotation.distance}μm`,
          });
        }
      } else if (currentAnnotation.width > 5 && currentAnnotation.height > 5) {
        const newAnnotations = [...annotations, currentAnnotation];
        setAnnotations(newAnnotations);
        onAnnotationChange?.(newAnnotations);
        toast({
          title: "Annotation Added",
          description: `${currentAnnotation.type} annotation created`,
        });
      }
      
      setCurrentAnnotation(null);
      setDrawStart(null);
    }, [isDrawing, currentAnnotation, annotations, onAnnotationChange, toast]);

    const clearAnnotations = useCallback(() => {
      setAnnotations([]);
      onAnnotationChange?.([]);
      toast({
        title: "Annotations Cleared",
        description: "All annotations have been removed",
      });
    }, [onAnnotationChange, toast]);

    const handleZoomIn = useCallback(() => {
      if (osdViewerRef.current) {
        const currentZoom = osdViewerRef.current.viewport.getZoom();
        osdViewerRef.current.viewport.zoomTo(currentZoom * 1.5);
      }
    }, []);

    const handleZoomOut = useCallback(() => {
      if (osdViewerRef.current) {
        const currentZoom = osdViewerRef.current.viewport.getZoom();
        osdViewerRef.current.viewport.zoomTo(currentZoom / 1.5);
      }
    }, []);

    const handleZoomFit = useCallback(() => {
      if (osdViewerRef.current) {
        osdViewerRef.current.viewport.goHome();
      }
    }, []);

    const handleRotate = useCallback(() => {
      if (osdViewerRef.current) {
        const currentRotation = osdViewerRef.current.viewport.getRotation();
        osdViewerRef.current.viewport.setRotation(currentRotation + 90);
      }
    }, []);

    const handleFullScreen = useCallback(() => {
      if (osdViewerRef.current) {
        osdViewerRef.current.setFullScreen(!isFullScreen);
        setIsFullScreen(!isFullScreen);
      }
    }, [isFullScreen]);

    const handleZoomChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const newZoom = parseFloat(e.target.value);
      if (osdViewerRef.current) {
        osdViewerRef.current.viewport.zoomTo(newZoom);
      }
    }, []);

    const resetFilters = useCallback(() => {
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
    }, []);

    const zoomLevels = [0.5, 1, 2, 4, 8, 16, 20, 32, 40];
    const zoomPercentage = Math.round(zoomLevel * 100);

    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 bg-muted border-b flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Button
              variant={tool === 'pointer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('pointer')}
              title="Pointer Tool"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'move' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('move')}
              title="Pan Tool"
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('rectangle')}
              title="Rectangle Annotation"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('circle')}
              title="Circle Annotation"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'ruler' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('ruler')}
              title="Measurement Tool"
            >
            <Ruler className="h-4 w-4" />
            </Button>

            {/* Clear Annotations */}
            {annotations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAnnotations}
                title="Clear All Annotations"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {/* Image Adjustments Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" title="Image Adjustments">
                  <SunMedium className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Image Adjustments</h4>
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <SunMedium className="h-4 w-4" /> Brightness
                      </span>
                      <span className="text-sm text-muted-foreground">{brightness}%</span>
                    </div>
                    <Slider
                      value={[brightness]}
                      onValueChange={([val]) => setBrightness(val)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Contrast className="h-4 w-4" /> Contrast
                      </span>
                      <span className="text-sm text-muted-foreground">{contrast}%</span>
                    </div>
                    <Slider
                      value={[contrast]}
                      onValueChange={([val]) => setContrast(val)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Saturation
                      </span>
                      <span className="text-sm text-muted-foreground">{saturation}%</span>
                    </div>
                    <Slider
                      value={[saturation]}
                      onValueChange={([val]) => setSaturation(val)}
                      min={0}
                      max={200}
                      step={1}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium min-w-[60px] text-center">{zoomPercentage}%</span>
              <select
                value={zoomLevel}
                onChange={handleZoomChange}
                className="text-sm border rounded px-1 bg-background"
              >
                {zoomLevels.map((level) => (
                  <option key={level} value={level}>
                    {level * 100}%
                  </option>
                ))}
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleZoomFit} title="Fit to View">
              <Home className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleRotate} title="Rotate 90°">
              <RotateCw className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleFullScreen} title="Full Screen">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* OpenSeadragon Viewer Container */}
        <div className="flex-1 relative bg-background min-h-[400px]">
          <div
            ref={viewerRef}
            className="absolute inset-0 w-full h-full"
            style={{ background: '#1a1a1a', minHeight: '400px' }}
          />

          {/* Annotation Overlay */}
          <div
            ref={overlayRef}
            className="absolute inset-0 w-full h-full z-10"
            style={{ 
              pointerEvents: tool !== 'pointer' && tool !== 'move' ? 'auto' : 'none',
              cursor: tool === 'rectangle' || tool === 'circle' ? 'crosshair' : tool === 'ruler' ? 'crosshair' : 'default'
            }}
            onMouseDown={handleOverlayMouseDown}
            onMouseMove={handleOverlayMouseMove}
            onMouseUp={handleOverlayMouseUp}
            onMouseLeave={handleOverlayMouseUp}
          >
            {/* Render existing annotations */}
            {annotations.map((ann) => (
              <React.Fragment key={ann.id}>
                {ann.type === 'rectangle' && (
                  <div
                    className="absolute border-2 pointer-events-none"
                    style={{
                      left: ann.x,
                      top: ann.y,
                      width: ann.width,
                      height: ann.height,
                      borderColor: ann.color,
                      backgroundColor: `${ann.color}20`,
                    }}
                  />
                )}
                {ann.type === 'circle' && (
                  <div
                    className="absolute border-2 rounded-full pointer-events-none"
                    style={{
                      left: ann.x,
                      top: ann.y,
                      width: ann.width,
                      height: ann.height,
                      borderColor: ann.color,
                      backgroundColor: `${ann.color}20`,
                    }}
                  />
                )}
                {ann.type === 'measurement' && ann.startPoint && ann.endPoint && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1={ann.startPoint.x}
                      y1={ann.startPoint.y}
                      x2={ann.endPoint.x}
                      y2={ann.endPoint.y}
                      stroke={ann.color}
                      strokeWidth="2"
                    />
                    <circle cx={ann.startPoint.x} cy={ann.startPoint.y} r="4" fill={ann.color} />
                    <circle cx={ann.endPoint.x} cy={ann.endPoint.y} r="4" fill={ann.color} />
                    <text
                      x={(ann.startPoint.x + ann.endPoint.x) / 2}
                      y={(ann.startPoint.y + ann.endPoint.y) / 2 - 10}
                      fill={ann.color}
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {ann.distance}μm
                    </text>
                  </svg>
                )}
              </React.Fragment>
            ))}

            {/* Current annotation being drawn */}
            {currentAnnotation && (
              <>
                {currentAnnotation.type === 'rectangle' && (
                  <div
                    className="absolute border-2 pointer-events-none"
                    style={{
                      left: currentAnnotation.x,
                      top: currentAnnotation.y,
                      width: currentAnnotation.width,
                      height: currentAnnotation.height,
                      borderColor: currentAnnotation.color,
                      backgroundColor: `${currentAnnotation.color}20`,
                      borderStyle: 'dashed',
                    }}
                  />
                )}
                {currentAnnotation.type === 'circle' && (
                  <div
                    className="absolute border-2 rounded-full pointer-events-none"
                    style={{
                      left: currentAnnotation.x,
                      top: currentAnnotation.y,
                      width: currentAnnotation.width,
                      height: currentAnnotation.height,
                      borderColor: currentAnnotation.color,
                      backgroundColor: `${currentAnnotation.color}20`,
                      borderStyle: 'dashed',
                    }}
                  />
                )}
                {currentAnnotation.type === 'measurement' && currentAnnotation.startPoint && currentAnnotation.endPoint && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1={currentAnnotation.startPoint.x}
                      y1={currentAnnotation.startPoint.y}
                      x2={currentAnnotation.endPoint.x}
                      y2={currentAnnotation.endPoint.y}
                      stroke={currentAnnotation.color}
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <circle cx={currentAnnotation.startPoint.x} cy={currentAnnotation.startPoint.y} r="4" fill={currentAnnotation.color} />
                    <circle cx={currentAnnotation.endPoint.x} cy={currentAnnotation.endPoint.y} r="4" fill={currentAnnotation.color} />
                    {currentAnnotation.distance && (
                      <text
                        x={(currentAnnotation.startPoint.x + currentAnnotation.endPoint.x) / 2}
                        y={(currentAnnotation.startPoint.y + currentAnnotation.endPoint.y) / 2 - 10}
                        fill={currentAnnotation.color}
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {currentAnnotation.distance}μm
                      </text>
                    )}
                  </svg>
                )}
              </>
            )}
          </div>

          {/* Coordinates and info overlay */}
          <div className="absolute bottom-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded z-20">
            Zoom: {zoomPercentage}% | Position: ({viewportInfo.x.toFixed(3)}, {viewportInfo.y.toFixed(3)}) | Tool: {tool}
            {annotations.length > 0 && ` | Annotations: ${annotations.length}`}
          </div>

          {/* Scale bar */}
          {zoomLevel > 1 && (
            <div className="absolute bottom-2 right-24 bg-black/75 text-white text-xs px-2 py-1 rounded z-20">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-1 bg-white"></div>
                <span>{Math.round(100 / zoomLevel)}μm</span>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between p-2 bg-muted border-t text-sm flex-wrap gap-2">
          <div className="flex items-center space-x-4">
            <span>Objective: 20x</span>
            <span>Pixel Size: 0.5μm/pixel</span>
            <span>Field: {Math.round(500 / zoomLevel)}μm</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-muted">
              {annotations.filter(a => a.type === 'rectangle').length} Rectangles
            </Badge>
            <Badge variant="outline" className="bg-muted">
              {annotations.filter(a => a.type === 'circle').length} Circles
            </Badge>
            <Badge variant="outline" className="bg-muted">
              {annotations.filter(a => a.type === 'measurement').length} Measurements
            </Badge>
          </div>
        </div>
      </div>
    );
  }
);

OpenSeadragonViewer.displayName = 'OpenSeadragonViewer';

export default OpenSeadragonViewer;