import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import StatsCards from "../StatsCards";
import { useToast } from "@/hooks/use-toast";

// ✅ Correct hooks (NO useApiData)
import { useSamples } from "../../../hooks/useSamples";
import { usePatients } from "../../../hooks/usePatients";
import { useCustomers } from "../../../hooks/useCustomers";

interface AccessionDashboardProps {
  currentView: string;
}

const AccessionDashboard = ({ currentView }: AccessionDashboardProps) => {
  const { samples, loading: samplesLoading, error: samplesError } = useSamples();
  const { patients } = usePatients();
  const { customers } = useCustomers();
  const { toast } = useToast();

  /* ===============================
     LOADING STATE
  ================================ */
  if (samplesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading data...</span>
      </div>
    );
  }

  /* ===============================
     ERROR STATE
  ================================ */
  if (samplesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">
          Error loading samples. Please check backend.
        </p>
      </div>
    );
  }

  /* ===============================
     MAIN DASHBOARD
  ================================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Accession Dashboard
        </h2>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats */}
      <StatsCards role="accession" />

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Total Samples: <b>{samples.length}</b></p>
          <p>Total Patients: <b>{patients.length}</b></p>
          <p>Total Labs: <b>{customers.length}</b></p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessionDashboard;
