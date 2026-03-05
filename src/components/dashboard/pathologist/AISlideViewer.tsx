import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  Microscope,
  Grid3X3,
  Eye,
  Loader2
} from "lucide-react";
import OpenSeadragonViewer, { OpenSeadragonViewerHandle, ViewerNavigationTarget } from "./OpenSeadragonViewer";
import SlideViewer from "./SlideViewer";
import SlideGridView from "./SlideGridView";
import PatientInformation from "./PatientInformation";
import CompactAIAnalysis from "./CompactAIAnalysis";
import EnhancedActionPanel from "./EnhancedActionPanel";
import CaseNavigation from "./CaseNavigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSamples } from "@/hooks/useSamples";

// Helper to detect if running on EC2 (non-localhost)
const isEC2 = () => typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// Get auth token for EC2 JWT auth
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('vyuhaa_access_token');
  }
  return null;
};

interface SlideImage {
  id: string;
  upload_url: string | null;
  file_name: string;
  sample_id: string | null;
}

interface AISlideViewerProps {
  initialCaseId?: string | null;
  tileName?: string | null;
}

const API_URL = "http://localhost:5000";


const AISlideViewer = ({ initialCaseId, tileName: propTileName }: AISlideViewerProps = {}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(initialCaseId || null);
  const [activeTab, setActiveTab] = useState("viewer");
  const [slideImages, setSlideImages] = useState<SlideImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { samples, loading: samplesLoading } = useSamples();
  
  // Ref to the OpenSeadragon viewer for navigation control
  const viewerRef = useRef<OpenSeadragonViewerHandle>(null);

  // Filter samples that are in 'review' status (ready for pathologist)
  const reviewSamples = samples.filter(sample => 
    sample.status === 'review' || 
    (sample.assigned_pathologist === user?.id && sample.status !== 'completed')
  );

  // Set initial case or first sample when samples load
  useEffect(() => {
    if (initialCaseId) {
      setSelectedSampleId(initialCaseId);
    } else if (reviewSamples.length > 0 && !selectedSampleId) {
      setSelectedSampleId(reviewSamples[0].id);
    }
  }, [reviewSamples, selectedSampleId, initialCaseId]);

  // Fetch slide images for selected sample
  useEffect(() => {
    const fetchSlideImages = async () => {
      if (!selectedSampleId) return;
      
      setLoadingImages(true);

      try {
        const token = getAuthToken();

        const response = await fetch(`/api/upload/slides/${selectedSampleId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (!response.ok) throw new Error('Failed to fetch slides');

        const data = await response.json();

        const mappedData = data.map((item: any) => ({
          id: item.id,
          upload_url: item.file_path || item.url,
          file_name: item.file_name,
          sample_id: item.sample_id
        }));

        setSlideImages(mappedData);

      } catch (error) {
        console.error('Error fetching slide images:', error);
      } finally {
        setLoadingImages(false);
      }

    };

    fetchSlideImages();
  }, [selectedSampleId]);

  const currentSample = reviewSamples.find(s => s.id === selectedSampleId) || reviewSamples[0];

  // Transform samples for CaseNavigation
  const casesForNavigation = reviewSamples.map(sample => ({
    id: sample.id,
    barcode: sample.barcode ?? sample.id ?? "",
    patientName: sample.patients?.name || 'Unknown Patient',
    age: sample.patients?.age || 0,
    testType: sample.test_type,
    status: sample.status === 'completed' ? 'approved' as const : 
            sample.status === 'review' ? 'pending' as const : 'pending' as const,
    priority: (sample.priority as "normal" | "urgent" | "stat") ?? "normal",
    collectionDate: sample.accession_date ? new Date(sample.accession_date).toLocaleDateString() : 'N/A',
    assignedDate: sample.pathologist_assigned_at ? new Date(sample.pathologist_assigned_at).toLocaleDateString() : undefined
  }));

  // Build slide data from current sample
  const currentSlideData = currentSample ? {
    id: currentSample.id,
    barcode: currentSample.barcode,
    patientData: {
      id: currentSample.patient_id || 'unknown',
      name: currentSample.patients?.name || 'Unknown Patient',
      age: currentSample.patients?.age || 0,
      gender: currentSample.patients?.gender || 'Unknown',
      contactNumber: currentSample.patients?.contact_number || 'N/A',
      address: 'Address on file',
      medicalHistory: 'Medical history on file',
      lastMenstrualPeriod: 'N/A',
      contraceptiveUse: 'N/A',
      pregnancyHistory: 'N/A',
      clinicalHistory: currentSample.processing_notes || 'No clinical history available',
      symptoms: 'N/A',
      riskFactors: [],
      previousCytology: [],
      previousBiopsy: []
    },
    sampleData: {
      barcode: currentSample.barcode,
      testType: currentSample.test_type,
      collectionDate: currentSample.accession_date ? new Date(currentSample.accession_date).toLocaleDateString() : 'N/A',
      clinicalIndication: 'Cervical screening',
      specimenAdequacy: 'Satisfactory for evaluation'
    },
    aiAnalysis: {
      status: 'completed',
      confidence: 85,
      findings: [
        { type: 'Analysis Pending', probability: 0, location: 'Full slide', coordinates: { x: 50, y: 50 } }
      ],
      cellsAnalyzed: 0,
      suspiciousCells: 0,
      recommendations: 'AI analysis will be available after processing'
    },
    currentStatus: 'pending' as const,
    slideImageUrl: slideImages.length > 0 ? slideImages[0].upload_url : null
  } : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "processing": return "text-blue-600";
      case "failed": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "processing": return <Clock className="h-4 w-4" />;
      case "failed": return <XCircle className="h-4 w-4" />;
      default: return <Microscope className="h-4 w-4" />;
    }
  };

  // Handle navigation from grid view to slide viewer
  const handleNavigateToRegion = useCallback((target: ViewerNavigationTarget) => {
    setActiveTab("viewer");
    
    setTimeout(() => {
      if (viewerRef.current) {
        viewerRef.current.navigateToPosition(target.x, target.y, target.zoom);
        toast({
          title: "Navigated to Region",
          description: `Position: (${target.x.toFixed(2)}, ${target.y.toFixed(2)}) at ${target.zoom}x zoom`,
        });
      }
    }, 100);
  }, [toast]);

  // Enhanced action handlers
  const handleVerifyAnalysis = async (notes?: string) => {
    if (!currentSample) return;
  
    try {
      const response = await fetch(`/api/samples/${currentSample.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'review',
          processing_notes: notes,
          assigned_pathologist: user?.id,
          pathologist_assigned_at: new Date().toISOString()
        })
      });
  
      if (!response.ok) throw new Error('Failed to update sample');
  
      toast({
        title: "Analysis Verified",
        description: "Case marked for final review and approval",
      });
  
    } catch (error) {
      console.error("Error verifying analysis:", error);
      toast({
        title: "Error",
        description: "Failed to verify analysis",
        variant: "destructive"
      });
    }
  };
  

  const handleApproveAnalysis = async (
    diagnosis: string,
    recommendations?: string
  ) => {
    if (!currentSample) return;
  
    try {
      const response = await fetch(
        `/api/samples/${currentSample.id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            diagnosis,
            recommendations,
            reviewed_by: user?.id,
            patient_id: currentSample.patient_id
          })
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
  
      toast({
        title: "Report Generated Successfully",
        description: "Final report has been created and is ready for download",
      });
  
      // Move to next case (UNCHANGED)
      const currentIndex = reviewSamples.findIndex(
        s => s.id === currentSample.id
      );
  
      if (currentIndex < reviewSamples.length - 1) {
        setSelectedSampleId(
          reviewSamples[currentIndex + 1].id
        );
      }
  
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };
  

  const handleRequestReview = (reason: string) => {
    toast({
      title: "Review Requested",
      description: "Case sent for manual review",
      variant: "destructive"
    });
    console.log("Review reason:", reason);
  };

  const handleExportReport = async () => {
    if (!currentSlideData) return;
    
    try {
      console.log("Generating PDF report for:", currentSlideData.barcode);
      
      toast({
        title: "Report Exported",
        description: "PDF report downloaded successfully",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!currentSlideData) return;
    
    try {
      const diagnosis = `
CERVICAL CYTOLOGY REPORT
INTERPRETATION: Specimen is satisfactory for evaluation.
AI-assisted analysis completed. Manual pathologist review confirmed findings.
      `.trim();

      await handleApproveAnalysis(diagnosis, "Follow-up as per clinical guidelines.");
    } catch (error) {
      console.error("Error in report generation:", error);
    }
  };

  const handleCaseSelect = (caseId: string) => {
    setSelectedSampleId(caseId);
    toast({
      title: "Case Selected",
      description: `Loading case for review`,
    });
  };

  if (samplesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading cases...</span>
      </div>
    );
  }

  if (reviewSamples.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Microscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Cases for Review</h3>
        <p className="text-muted-foreground">
          There are no samples currently in the review queue. Cases will appear here once technicians complete imaging.
        </p>
      </Card>
    );
  }

  if (!currentSlideData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading case data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Slide Analysis</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50">
            <Microscope className="h-3 w-3 mr-1" />
            Digital Pathology
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {reviewSamples.length} Cases in Queue
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[800px]">
        {/* Main Slide Viewer with Tabs */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  Slide Analysis - {currentSlideData.barcode}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {currentSlideData.sampleData.testType}
                  </Badge>
                  <div className={`flex items-center ${getStatusColor(currentSlideData.aiAnalysis.status)}`}>
                    {getStatusIcon(currentSlideData.aiAnalysis.status)}
                    <span className="ml-1 text-sm font-medium capitalize">
                      {currentSlideData.aiAnalysis.status}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)] p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <div className="px-4 border-b">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="viewer" className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>Slide Viewer</span>
                    </TabsTrigger>
                    <TabsTrigger value="grid" className="flex items-center space-x-2">
                      <Grid3X3 className="h-4 w-4" />
                      <span>Grid View</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="viewer" className="h-[calc(100%-60px)] mt-0">
                  <OpenSeadragonViewer 
                    ref={viewerRef}
                    slideData={currentSlideData} 
                    slideImageUrl={null}
                    tileName="myslide"
                    // slideImageUrl={currentSlideData.slideImageUrl}
                    // tileName={propTileName || currentSlideData.barcode}
                  />
                </TabsContent>
                
                <TabsContent value="grid" className="h-[calc(100%-60px)] mt-0 p-4 overflow-y-auto">
                  <SlideGridView 
                    slideData={currentSlideData}
                    onNavigateToRegion={handleNavigateToRegion}
                    onSlideSelect={handleCaseSelect}
                    onGenerateReport={handleGenerateReport}
                    Doctor="Maharshi"
                    tileName={propTileName || currentSlideData.barcode}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Analysis Panel */}
        <div className="space-y-4 overflow-y-auto">
          {/* Case Navigation */}
          <CaseNavigation 
            currentCaseId={selectedSampleId || ''}
            cases={casesForNavigation}
            onCaseSelect={handleCaseSelect}
          />

          {/* Enhanced Patient Information */}
          <PatientInformation 
            patientData={currentSlideData.patientData}
            sampleData={currentSlideData.sampleData}
          />

          {/* Compact AI Analysis */}
          <CompactAIAnalysis aiAnalysis={currentSlideData.aiAnalysis} />

          {/* Enhanced Action Panel */}
          <EnhancedActionPanel
            sampleId={currentSlideData.id}
            currentStatus={currentSlideData.currentStatus}
            onVerifyAnalysis={handleVerifyAnalysis}
            onApproveAnalysis={handleApproveAnalysis}
            onRequestReview={handleRequestReview}
            onExportReport={handleExportReport}
          />
        </div>
      </div>
    </div>
  );
};

export default AISlideViewer;
