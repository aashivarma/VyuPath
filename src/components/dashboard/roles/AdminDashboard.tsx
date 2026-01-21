import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  FileText,
  Settings,
  CreditCard,
  Loader2,
} from "lucide-react";
import StatsCards from "../StatsCards";
import UserManagement from "../admin/UserManagement";
import CustomerManagement from "../admin/CustomerManagement";
import PricingTiers from "../admin/PricingTiers";
import LabManagement from "../admin/LabManagement";
import RevenueManagement from "../RevenueManagement";

interface AdminDashboardProps {
  currentView: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

const AdminDashboard = ({ currentView }: AdminDashboardProps) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  console.log("AdminDashboard - Current view:", currentView);

  // ---------------- FETCH AUDIT LOGS (API) ----------------
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      console.log("Fetching audit logs...");

      const res = await fetch("/api/audit-logs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await res.json();

      console.log(
        "Audit logs fetched successfully:",
        data?.length || 0
      );
      setAuditLogs(data || []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "audit") {
      fetchAuditLogs();
    }
  }, [currentView]);

  // ---------------- VIEW SWITCHES ----------------
  if (currentView === "users") {
    return <UserManagement />;
  }

  if (currentView === "customers") {
    return <CustomerManagement />;
  }

  if (currentView === "pricing") {
    return <PricingTiers />;
  }

  if (currentView === "labs") {
    return <LabManagement />;
  }

  if (currentView === "revenue") {
    return <RevenueManagement />;
  }

  if (currentView === "reports") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Reports Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Lab Performance
              </CardTitle>
              <CardDescription>
                Turnaround time analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                2.3 days
              </p>
              <p className="text-sm text-gray-600">
                Average TAT
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Monthly Volume
              </CardTitle>
              <CardDescription>
                Samples processed this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                1,247
              </p>
              <p className="text-sm text-gray-600">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Quality Metrics
              </CardTitle>
              <CardDescription>
                Accuracy and reprocessing rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-teal-600">
                98.7%
              </p>
              <p className="text-sm text-gray-600">
                Accuracy rate
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === "audit") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Audit Logs
          </h2>
          <button
            onClick={fetchAuditLogs}
            className="text-blue-600 hover:text-blue-700 text-sm"
            disabled={auditLoading}
          >
            {auditLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <Card>
          <CardContent className="p-6">
            {auditLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No audit logs found
                  </p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <div>
                        <p className="font-medium">
                          {log.action}
                        </p>
                        <p className="text-sm text-gray-600">
                          {log.entity_type}{" "}
                          {log.entity_id
                            ? `(${log.entity_id.slice(0, 8)}...)`
                            : ""}{" "}
                          by {log.users?.name || "Unknown User"}
                        </p>
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {JSON.stringify(
                              log.details,
                              null,
                              0
                            ).slice(0, 100)}
                            ...
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(
                          log.created_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------- DEFAULT DASHBOARD ----------------
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Admin Dashboard
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

      <StatsCards role="admin" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                "New sample VYU-001234 accessioned",
                "Pathologist completed 15 reviews",
                "Customer ABC Hospital registered",
                "Technician marked 8 samples complete",
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-sm"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{activity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database</span>
                <span className="text-green-600 text-sm font-medium">
                  Healthy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">API Services</span>
                <span className="text-green-600 text-sm font-medium">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Lab Connectivity</span>
                <span className="text-green-600 text-sm font-medium">
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Backup Status</span>
                <span className="text-blue-600 text-sm font-medium">
                  Last: 2 hours ago
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
