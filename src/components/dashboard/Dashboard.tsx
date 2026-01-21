import { useState } from "react";
import { AppUser } from "../../hooks/useAuth"; // ✅ correct user type
import Sidebar from "./Sidebar";
import AdminDashboard from "./roles/AdminDashboard";
import AccessionDashboard from "./roles/AccessionDashboard";
import TechnicianDashboard from "./roles/TechnicianDashboard";
import PathologistDashboard from "./roles/PathologistDashboard";
import CustomerDashboard from "./roles/CustomerDashboard";
import TopBar from "./TopBar";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface DashboardProps {
  user: AppUser | null; // ✅ matches useAuth.ts
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [currentView, setCurrentView] = useState("dashboard");

  // Show loading if user is null (safety fallback)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (user.role) {
      case "admin":
        return <AdminDashboard currentView={currentView} />;

      case "accession":
        return <AccessionDashboard currentView={currentView} />;

      case "technician":
        return <TechnicianDashboard currentView={currentView} />;

      case "pathologist":
        return <PathologistDashboard currentView={currentView} />;

      case "customer":
        return <CustomerDashboard currentView={currentView} />;

      default:
        return <div>Invalid role</div>;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 w-full">
        <Sidebar
          user={user}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />

        <SidebarInset className="flex flex-col">
          <TopBar user={user} onLogout={onLogout} />

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
