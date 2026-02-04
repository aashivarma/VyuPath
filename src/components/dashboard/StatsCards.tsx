import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSamples } from "../../hooks/useSamples";
import { useAuth } from "../../hooks/useAuth";
import { Loader2 } from "lucide-react";

interface StatsCardsProps {
  role: "admin" | "accession" | "technician" | "pathologist" | "customer";
}

const StatsCards = ({ role }: StatsCardsProps) => {
  const { samples, loading, error } = useSamples();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading statistics: {error}</p>
      </div>
    );
  }

  const getStatsForRole = () => {
    switch (role) {
      case "admin":
        return [
          {
            title: "Total Samples",
            value: samples.length.toString(),
            description: "All samples in system",
          },
          {
            title: "Completed",
            value: samples
              .filter((s) => s.status === "completed")
              .length.toString(),
            description: "Ready for delivery",
          },
        ];

      case "accession":
        return [
          {
            title: "Pending",
            value: samples
              .filter((s) => s.status === "pending")
              .length.toString(),
            description: "Awaiting processing",
          },
          {
            title: "Total Samples",
            value: samples.length.toString(),
            description: "All samples",
          },
        ];

      case "technician":
        const techSamples = samples.filter(
          (s) => s.assigned_technician === user?.id,
        );
        return [
          {
            title: "Assigned to Me",
            value: techSamples.length.toString(),
            description: "My samples",
          },
          {
            title: "Completed",
            value: techSamples
              .filter((s) => s.status === "completed")
              .length.toString(),
            description: "Finished work",
          },
        ];

      case "pathologist":
        const pathSamples = samples.filter(
          (s) =>
            s.assigned_pathologist === user?.id ||
            s.status === "pending" ||
            s.status === "urgent",
        );

        return [
          {
            title: "Pending Review",
            value: samples
              .filter((s) => s.status === "pending")
              .length.toString(),
            description: "Awaiting review",
          },
          {
            title: "Completed",
            value: samples
              .filter((s) => s.status === "completed")
              .length.toString(),
            description: "Reports finalized",
          },
          {
            title: "High Priority",
            value: samples
              .filter((s) => s.status === "urgent")
              .length.toString(),
            description: "Urgent samples",
          },
          {
            title: "Total Assigned",
            value: samples.length.toString(),
            description: "All assigned samples",
          },
        ];

      case "customer":
        return [
          {
            title: "Submitted",
            value: samples.length.toString(),
            description: "Total samples",
          },
          {
            title: "Completed",
            value: samples
              .filter((s) => s.status === "completed")
              .length.toString(),
            description: "Reports ready",
          },
        ];

      default:
        return [];
    }
  };

  const stats = getStatsForRole();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
