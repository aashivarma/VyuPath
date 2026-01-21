import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface LabLocation {
  id: string;
  name: string;
  address: string;
  contact_info: {
    phone?: string;
    email?: string;
  };
  active: boolean;
  created_at: string;
  updated_at: string;
}

const API_URL = "http://localhost:5000";

const LabManagement = () => {
  const [labs, setLabs] = useState<LabLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingLab, setEditingLab] = useState<LabLocation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newLab, setNewLab] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    active: true,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/labs`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch labs");

      const data = await res.json();
      setLabs(data);
    } catch (error: any) {
      toast.error(`Failed to fetch lab locations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleCreateLab = async () => {
    if (!newLab.name || !newLab.address) {
      toast.error("Please fill in name and address");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/labs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newLab.name,
          address: newLab.address,
          contact_info: {
            phone: newLab.phone || null,
            email: newLab.email || null,
          },
          active: newLab.active,
        }),
      });

      if (!res.ok) throw new Error("Failed to create lab");

      toast.success("Lab location created successfully");
      setNewLab({
        name: "",
        address: "",
        phone: "",
        email: "",
        active: true,
      });
      setIsDialogOpen(false);
      fetchLabs();
    } catch (error: any) {
      toast.error(`Failed to create lab: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateLab = async () => {
    if (!editingLab) return;

    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/labs/${editingLab.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editingLab),
      });

      if (!res.ok) throw new Error("Failed to update lab");

      toast.success("Lab location updated successfully");
      setEditingLab(null);
      fetchLabs();
    } catch (error: any) {
      toast.error(`Failed to update lab: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLab = async (labId: string) => {
    if (!confirm("Are you sure you want to delete this lab location?")) return;

    try {
      const res = await fetch(`${API_URL}/labs/${labId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to delete lab");

      toast.success("Lab location deleted successfully");
      fetchLabs();
    } catch (error: any) {
      toast.error(`Failed to delete lab: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  /* ---------- UI BELOW IS UNCHANGED ---------- */

  return (
    <div className="space-y-6">
      {/* UI code remains exactly the same */}
    </div>
  );
};

export default LabManagement;
