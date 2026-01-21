import { useState } from "react";
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
} from "lucide-react";
import SlideViewer from "./SlideViewer";
import SlideGridView from "./SlideGridView";
import PatientInformation from "./PatientInformation";
import CompactAIAnalysis from "./CompactAIAnalysis";
import EnhancedActionPanel from "./EnhancedActionPanel";
import CaseNavigation from "./CaseNavigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const API_URL = "http://localhost:5000";

const AISlideViewer = () => {
  const [selectedSlide, setSelectedSlide] = useState("slide-001");
  const [activeTab, setActiveTab] = useState("viewer");
  const { toast } = useToast();
  const { user } = useAuth();

  const mockSlideData: any = {
    "slide-001": {
      id: "slide-001",
      barcode: "VYU2024001234",
      patientData: {
        id: "patient-001",
        name: "Priya Sharma",
        age: 32,
        gender: "Female",
        contactNumber: "+91-9876543210",
        address: "123 MG Road, Bangalore, Karnataka",
        medicalHistory: "No significant past medical history",
        lastMenstrualPeriod: "2024-05-25",
        contraceptiveUse: "Oral contraceptive pills for 2 years",
        pregnancyHistory: "G2P2, Normal vaginal deliveries",
        clinicalHistory:
          "Routine screening. Patient asymptomatic. Regular screening every 3 years.",
        symptoms: "None reported",
        riskFactors: [
          "Multiple sexual partners",
          "Early age at first intercourse",
        ],
        previousCytology: [],
        previousBiopsy: [],
      },
      sampleData: {
        barcode: "VYU2024001234",
        testType: "LBC",
        collectionDate: "2024-06-08",
        clinicalIndication: "Routine cervical screening",
        specimenAdequacy: "Satisfactory for evaluation",
      },
      aiAnalysis: {
        status: "completed",
        confidence: 92,
        findings: [
          { type: "HSIL", probability: 92 },
          { type: "LSIL", probability: 78 },
        ],
        cellsAnalyzed: 15420,
        suspiciousCells: 23,
        recommendations:
          "Manual review recommended. Consider HPV co-testing.",
      },
      currentStatus: "pending" as const,
    },
  };

  const mockCases = [
    {
      id: "slide-001",
      barcode: "VYU2024001234",
      patientName: "Priya Sharma",
      age: 32,
      testType: "LBC",
      status: "pending" as const,
      priority: "normal" as const,
      collectionDate: "2024-06-08",
      assignedDate: "2024-06-09",
    },
  ];

  const currentSlide = mockSlideData[selectedSlide];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "processing":
        return "text-blue-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Microscope className="h-4 w-4" />;
    }
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const handleVerifyAnalysis = async (notes?: string) => {
    try {
      const res = await fetch(`${API_URL}/samples/verify`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          barcode: currentSlide.barcode,
          reviewed_by: user?.id,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Verification failed");

      toast({
        title: "Analysis Verified",
        description: "Case marked for final approval",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify analysis",
        variant: "destructive",
      });
    }
  };

  const handleApproveAnalysis = async (
    diagnosis: string,
    recommendations?: string
  ) => {
    try {
      const res = await fetch(`${API_URL}/test-results`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          sample_id: currentSlide.id,
          patient_id: currentSlide.patientData.id,
          diagnosis,
          recommendations,
          reviewed_by: user?.id,
        }),
      });

      if (!res.ok) throw new Error("Approval failed");

      toast({
        title: "Report Generated",
        description: "Final report created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const handleRequestReview = (reason: string) => {
    toast({
      title: "Review Requested",
      description: reason,
      variant: "destructive",
    });
  };

  const handleExportReport = async () => {
    toast({
      title: "Export Started",
      description: "Report export triggered",
    });
  };

  const handleGenerateReport = async () => {
    await handleApproveAnalysis(
      "HSIL detected. CIN 2–3 suspected.",
      "Recommend colposcopy and biopsy."
    );
  };

  const handleCaseSelect = (caseId: string) => {
    setSelectedSlide(caseId);
    toast({
      title: "Case Switched",
      description: `Now viewing ${caseId}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          AI Slide Analysis
        </h2>
        <div className="flex space-x-2">
          <Badge variant="outline">
            <Microscope className="h-3 w-3 mr-1" />
            Digital Pathology
          </Badge>
          <Badge variant="outline">QuPath Compatible</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[800px]">
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Slide Analysis – {currentSlide.barcode}
                </CardTitle>
                <div
                  className={`flex items-center ${getStatusColor(
                    currentSlide.aiAnalysis.status
                  )}`}
                >
                  {getStatusIcon(currentSlide.aiAnalysis.status)}
                  <span className="ml-1 capitalize">
                    {currentSlide.aiAnalysis.status}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 h-full">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="h-full"
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="viewer">
                    <Eye className="h-4 w-4 mr-1" />
                    Viewer
                  </TabsTrigger>
                  <TabsTrigger value="grid">
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Grid
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="viewer" className="h-full">
                  <SlideViewer slideData={currentSlide} />
                </TabsContent>

                <TabsContent value="grid" className="h-full p-4">
                  <SlideGridView
                    slideData={currentSlide}
                    onSlideSelect={handleCaseSelect}
                    onGenerateReport={handleGenerateReport}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 overflow-y-auto">
          <CaseNavigation
            currentCaseId={selectedSlide}
            cases={mockCases}
            onCaseSelect={handleCaseSelect}
          />

          <PatientInformation
            patientData={currentSlide.patientData}
            sampleData={currentSlide.sampleData}
          />

          <CompactAIAnalysis
            aiAnalysis={currentSlide.aiAnalysis}
          />

          <EnhancedActionPanel
            sampleId={currentSlide.id}
            currentStatus={currentSlide.currentStatus}
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
