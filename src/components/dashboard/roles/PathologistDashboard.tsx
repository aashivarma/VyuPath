import { useState } from "react";
import { useSamples, useTestResults } from "../../../hooks/useApiData";
import { useAuth } from "../../../hooks/useAuth";
import StatsCards from "../StatsCards";
import AISlideViewer from "../pathologist/AISlideViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, FileCheck, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePathologistDashboard } from "../../../hooks/usePathologistDashboard";
import { useReviewQueue } from "../../../hooks/useReviewQueue";
import { useRecentActivity } from "../../../hooks/useRecentActivity";

interface PathologistDashboardProps {
  currentView: string;
}

const PathologistDashboard = ({ currentView }: PathologistDashboardProps) => {
  const { samples, loading: samplesLoading, error } = useSamples();
  const { testResults } = useTestResults();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, loading: dashboardLoading } = usePathologistDashboard();
  const { samples: reviewQueue } = useReviewQueue();
  const { activities } = useRecentActivity();

  const [diagnosis, setDiagnosis] = useState<{ [key: string]: string }>({});
  const [recommendations, setRecommendations] = useState<{
    [key: string]: string;
  }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});

  // Filter samples assigned to this pathologist or pending review
  const pathologistSamples = samples.filter(
    (sample) =>
      sample.assigned_pathologist === user?.id ||
      (sample.status === "review" && !sample.assigned_pathologist),
  );

  const pendingReviews = pathologistSamples.filter(
    (sample) => sample.status === "review",
  );
  const completedSamples = pathologistSamples.filter(
    (sample) => sample.status === "completed",
  );

  // ---------------- FINALIZE REPORT (SUPABASE REMOVED) ----------------
  const handleFinalizeReport = async (sampleId: string) => {
    const sampleDiagnosis = diagnosis[sampleId];
    const sampleRecommendations = recommendations[sampleId];

    if (!sampleDiagnosis) {
      toast({
        title: "Error",
        description: "Please provide a diagnosis before finalizing the report",
        variant: "destructive",
      });
      return;
    }

    setSubmitting((prev) => ({ ...prev, [sampleId]: true }));

    try {
      // 1️⃣ Update sample status
      const updateSampleRes = await fetch(`/api/samples/${sampleId}/finalize`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status: "completed",
          assigned_pathologist: user?.id,
        }),
      });

      if (!updateSampleRes.ok) throw new Error("Failed to update sample");

      // 2️⃣ Update or create test result
      const existingResult = testResults.find(
        (tr) => tr.sample_id === sampleId,
      );

      if (existingResult) {
        const updateResultRes = await fetch(
          `/api/test-results/${existingResult.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              diagnosis: sampleDiagnosis,
              recommendations: sampleRecommendations,
              report_generated: true,
              reviewed_by: user?.id,
            }),
          },
        );

        if (!updateResultRes.ok)
          throw new Error("Failed to update test result");
      } else {
        const sample = samples.find((s) => s.id === sampleId);

        const createResultRes = await fetch("/api/test-results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            sample_id: sampleId,
            patient_id: sample?.patient_id || null,
            diagnosis: sampleDiagnosis,
            recommendations: sampleRecommendations,
            report_generated: true,
            reviewed_by: user?.id,
          }),
        });

        if (!createResultRes.ok)
          throw new Error("Failed to create test result");
      }

      toast({
        title: "Success",
        description: "Report finalized successfully",
      });

      setDiagnosis((prev) => ({ ...prev, [sampleId]: "" }));
      setRecommendations((prev) => ({ ...prev, [sampleId]: "" }));

      // Keep existing behavior
      window.location.reload();
    } catch (err) {
      console.error("Error finalizing report:", err);
      toast({
        title: "Error",
        description: "Failed to finalize report",
        variant: "destructive",
      });
    } finally {
      setSubmitting((prev) => ({ ...prev, [sampleId]: false }));
    }
  };

  // ---------------- UI (UNCHANGED) ----------------
  const renderContent = () => {
    if (dashboardLoading) {
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

    switch (currentView) {
      case "dashboard": {
        if (dashboardLoading) return <div>Loading...</div>;

        return (
          <div className="space-y-6">
            {/* Title */}
            <h1 className="text-3xl font-bold">Pathologist Dashboard</h1>

            {/* Stats Cards */}
            <StatsCards role="pathologist" />

            {/* Reviews + Activities Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT SIDE — Pending AI Reviews */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-4">
                  Pending AI Reviews ({reviewQueue.length})
                </h2>

                {reviewQueue.length === 0 ? (
                  <div className="text-gray-500">No pending reviews</div>
                ) : (
                  reviewQueue.map((sample) => (
                    <div
                      key={sample.id}
                      className="border bg-white p-4 rounded-lg shadow-sm mb-3"
                    >
                      <div className="font-semibold text-lg">
                        {sample.barcode}
                      </div>

                      <div className="text-gray-600">{sample.sample_type}</div>

                      <div className="text-sm text-gray-500">
                        Patient: {sample.patient_name}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* RIGHT SIDE — Recent Activities */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Recent Activities</h2>

                <div className="bg-white border rounded-lg p-4 shadow-sm space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-gray-500 text-sm">
                      No recent activities
                    </div>
                  ) : (
                    activities.map((act, index) => (
                      <div key={index} className="text-green-600 text-sm">
                        • Completed review for {act.barcode}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "review-queue":
        return <AISlideViewer />;

      case "finalize":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Finalize Reports</h2>
            {pendingReviews.map((sample) => (
              <Card key={sample.id}>
                <CardHeader>
                  <CardTitle>{sample.barcode}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Label>Diagnosis *</Label>
                  <Textarea
                    value={diagnosis[sample.id] || ""}
                    onChange={(e) =>
                      setDiagnosis((prev) => ({
                        ...prev,
                        [sample.id]: e.target.value,
                      }))
                    }
                  />
                  <Label>Recommendations</Label>
                  <Textarea
                    value={recommendations[sample.id] || ""}
                    onChange={(e) =>
                      setRecommendations((prev) => ({
                        ...prev,
                        [sample.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    onClick={() => handleFinalizeReport(sample.id)}
                    disabled={submitting[sample.id]}
                  >
                    {submitting[sample.id] ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileCheck className="h-4 w-4 mr-2" />
                    )}
                    Finalize Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      default:
        return (
          <div>
            <h1 className="text-3xl font-bold">Pathologist Dashboard</h1>
            <StatsCards role="pathologist" />
          </div>
        );
    }
  };

  return <div>{renderContent()}</div>;
};

export default PathologistDashboard;
