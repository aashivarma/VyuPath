import { useState, useEffect } from "react";
import { getAuthHeaders } from "../../../lib/authHeaders";
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


  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/labs`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch labs");

      const data = await res.json();
      console.log("LABS FROM API:", data);
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
      const res = await fetch(`${API_URL}/api/labs`, {
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
      const res = await fetch(`${API_URL}/api/labs/${editingLab.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editingLab),
      });

      if (!res.ok) throw new Error("Failed to update lab");

      toast.success("Lab location updated successfully");
      setEditingLab(null);
      fetchLabs();
      console.log("labs data:", labs);
    } catch (error: any) {
      toast.error(`Failed to update lab: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLab = async (labId: string) => {
    if (!confirm("Are you sure you want to delete this lab location?")) return;

    try {
      const res = await fetch(`${API_URL}/api/labs/${labId}`, {
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Lab Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Lab
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Lab Location</DialogTitle>
              <DialogDescription>
                Create a new lab location with contact information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Lab Name *</Label>
                <Input
                  id="name"
                  value={newLab.name}
                  onChange={(e) => setNewLab({...newLab, name: e.target.value})}
                  placeholder="Enter lab name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={newLab.address}
                  onChange={(e) => setNewLab({...newLab, address: e.target.value})}
                  placeholder="Enter lab address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newLab.phone}
                  onChange={(e) => setNewLab({...newLab, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLab.email}
                  onChange={(e) => setNewLab({...newLab, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={newLab.active}
                  onCheckedChange={(checked) => setNewLab({...newLab, active: checked})}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateLab}
                disabled={creating}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Lab
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map((lab) => (
          <Card key={lab.id} className={`${!lab.active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{lab.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={lab.active ? "default" : "secondary"}>
                    {lab.active ? "Active" : "Inactive"}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditingLab(lab)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteLab(lab.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{lab.address}</span>
              </div>
              {lab.contact_info?.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{lab.contact_info.phone}</span>
                </div>
              )}
              {lab.contact_info?.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{lab.contact_info.email}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {editingLab && (
        <Dialog open={!!editingLab} onOpenChange={() => setEditingLab(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Lab Location</DialogTitle>
              <DialogDescription>
                Update lab location information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Lab Name *</Label>
                <Input
                  id="edit-name"
                  value={editingLab.name}
                  onChange={(e) => setEditingLab({...editingLab, name: e.target.value})}
                  placeholder="Enter lab name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Input
                  id="edit-address"
                  value={editingLab.address}
                  onChange={(e) => setEditingLab({...editingLab, address: e.target.value})}
                  placeholder="Enter lab address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingLab.contact_info?.phone || ''}
                  onChange={(e) => setEditingLab({
                    ...editingLab, 
                    contact_info: { ...editingLab.contact_info, phone: e.target.value }
                  })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingLab.contact_info?.email || ''}
                  onChange={(e) => setEditingLab({
                    ...editingLab, 
                    contact_info: { ...editingLab.contact_info, email: e.target.value }
                  })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={editingLab.active}
                  onCheckedChange={(checked) => setEditingLab({...editingLab, active: checked})}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <div className="flex space-x-2 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={handleUpdateLab}
                  disabled={updating}
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Lab
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingLab(null)}
                  disabled={updating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LabManagement;
