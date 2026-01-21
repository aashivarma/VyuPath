import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useSamples } from "../../../hooks/useApiData";
import { useAuth } from "../../../hooks/useAuth";
import StatsCards from "../StatsCards";
import { Beaker, Upload, CheckCircle, Loader2, Camera, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TechnicianDashboardProps {
  currentView: string;
}

const TechnicianDashboard = ({ currentView }: TechnicianDashboardProps) => {
  const { samples, loading, error } = useSamples();
  const { user } = useAuth();
  const { toast } = useToast();

  const [processingNotes, setProcessingNotes] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});

  const technicianSamples = samples.filter(
    sample =>
      sample.assigned_technician === user?.id ||
      (sample.status === "pending" && !sample.assigned_technician)
  );

  const assignedSamples = technicianSamples.filter(s => s.assigned_technician === user?.id);
  const processingSamples = assignedSamples.filter(s => s.status === "processing");
  const imagingSamples = assignedSamples.filter(s => s.status === "imaging");
  const completedSamples = assignedSamples.filter(
    s => s.status === "review" || s.status === "completed"
  );

  // ---------------- START PROCESSING ----------------
  const handleStartProcessing = async (sampleId: string) => {
    setSubmitting(prev => ({ ...prev, [sampleId]: true }));
    try {
      const res = await fetch(`/api/samples/${sampleId}/assign-technician`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status: "processing",
          assigned_technician: user?.id,
        }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Success",
        description: "Sample processing started",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error starting processing:", error);
      toast({
        title: "Error",
        description: "Failed to start processing",
        variant: "destructive",
      });
    } finally {
      setSubmitting(prev => ({ ...prev, [sampleId]: false }));
    }
  };

  // ---------------- COMPLETE PROCESSING ----------------
  const handleCompleteProcessing = async (sampleId: string) => {
    setSubmitting(prev => ({ ...prev, [sampleId]: true }));
    try {
      const notes = processingNotes[sampleId] || "";

      const res = await fetch(`/api/samples/${sampleId}/send-to-imaging`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status: "imaging",
          processing_notes: notes,
        }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Success",
        description: "Sample processing completed. Sent to digital imaging.",
      });

      setProcessingNotes(prev => ({ ...prev, [sampleId]: "" }));
      window.location.reload();
    } catch (error) {
      console.error("Error completing processing:", error);
      toast({
        title: "Error",
        description: "Failed to complete processing",
        variant: "destructive",
      });
    } finally {
      setSubmitting(prev => ({ ...prev, [sampleId]: false }));
    }
  };

  // ---------------- COMPLETE IMAGING ----------------
  const handleCompleteImaging = async (sampleId: string) => {
    setSubmitting(prev => ({ ...prev, [sampleId]: true }));
    try {
      const notes = processingNotes[sampleId] || "";
      const sample = samples.find(s => s.id === sampleId);

      const res = await fetch(`/api/samples/${sampleId}/send-to-review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status: "review",
          processing_notes: notes
            ? `${notes} | Imaging completed`
            : "Imaging completed",
          test_result: {
            sample_id: sampleId,
            patient_id: sample?.patient_id || null,
            test_findings: "Digital imaging completed. Ready for pathologist review.",
            images_uploaded: true,
            completed_by: user?.id,
          },
        }),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Success",
        description: "Digital imaging completed. Sent to pathologist for review.",
      });

      setProcessingNotes(prev => ({ ...prev, [sampleId]: "" }));
      window.location.reload();
    } catch (error) {
      console.error("Error completing imaging:", error);
      toast({
        title: "Error",
        description: "Failed to complete imaging",
        variant: "destructive",
      });
    } finally {
      setSubmitting(prev => ({ ...prev, [sampleId]: false }));
    }
  };

  // ---------------- LOADING / ERROR ----------------
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading samples...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading samples: {error}</p>
      </div>
    );
  }

  /* ---------------- ALL UI BELOW IS UNCHANGED ---------------- */

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Technician Dashboard</h2>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      <StatsCards role="technician" />
    </div>
  );
};

export default TechnicianDashboard;
