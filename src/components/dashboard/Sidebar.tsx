
import { cn } from "@/lib/utils";
import { AppUser } from "../../hooks/useAuth";

import { 
  Home, 
  Users, 
  Settings, 
  FileText, 
  Beaker, 
  Search, 
  Upload,
  CreditCard,
  User as UserIcon,
  AlertCircle,
  Camera
} from "lucide-react";
import {
  Sidebar as SidebarBase,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

interface SidebarProps {
  user: AppUser;
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Sidebar = ({ user, currentView, setCurrentView }: SidebarProps) => {
  const getMenuItems = () => {
    // Add safety check for user.role
    if (!user || !user.role) {
      return [];
    }

    switch (user.role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'labs', label: 'Lab Management', icon: Settings },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'customers', label: 'Customer Management', icon: UserIcon },
          { id: 'pricing', label: 'Pricing Tiers', icon: CreditCard },
          { id: 'reports', label: 'Reports Overview', icon: FileText },
          { id: 'audit', label: 'Audit Logs', icon: AlertCircle },
        ];
      case 'accession':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'add-sample', label: 'Add New Sample', icon: Upload },
          { id: 'sample-queue', label: 'Sample Queue', icon: FileText },
          { id: 'rejected', label: 'Rejected Samples', icon: AlertCircle },
          { id: 'track', label: 'Track Samples', icon: Search },
        ];
      case 'technician':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'assigned', label: 'Assigned Samples', icon: FileText },
          { id: 'processing', label: 'Sample Processing', icon: Beaker },
          { id: 'imaging', label: 'Digital Imaging', icon: Camera },
          { id: 'completed', label: 'Completed Samples', icon: FileText },
        ];
      case 'pathologist':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'review-queue', label: 'AI Review Queue', icon: FileText },
          { id: 'finalize', label: 'Finalize Reports', icon: Upload },
          { id: 'history', label: 'Patient History', icon: Search },
        ];
      case 'customer':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'submit', label: 'Submit Sample', icon: Upload },
          { id: 'track', label: 'Track Samples', icon: Search },
          { id: 'reports', label: 'Download Reports', icon: FileText },
          { id: 'billing', label: 'Billing Summary', icon: CreditCard },
          { id: 'support', label: 'Support Tickets', icon: AlertCircle },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <SidebarBase>
      <SidebarHeader className="p-4">
        <div className="text-lg font-semibold text-gray-900">
          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)} Portal
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setCurrentView(item.id)}
                    isActive={currentView === item.id}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarBase>
  );
};

export default Sidebar;
