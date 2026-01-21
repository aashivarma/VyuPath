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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  User,
  Loader2,
  Trash2,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { Customer } from "@/types/user";

const API_URL = "http://localhost:5000";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    email: "",
    tier: "" as Customer["tier"] | "",
    location: "",
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/customers`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch customers");

      const data = await res.json();
      setCustomers(data);
    } catch (error: any) {
      toast.error(`Failed to fetch customers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async () => {
    if (
      !newCustomer.name ||
      !newCustomer.contact ||
      !newCustomer.email ||
      !newCustomer.tier ||
      !newCustomer.location
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newCustomer),
      });

      if (!res.ok) throw new Error("Failed to create customer");

      toast.success("Customer created successfully");
      setNewCustomer({
        name: "",
        contact: "",
        email: "",
        tier: "",
        location: "",
      });
      setIsDialogOpen(false);
      fetchCustomers();
    } catch (error: any) {
      toast.error(`Failed to create customer: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;

    setUpdating(true);
    try {
      const res = await fetch(
        `${API_URL}/customers/${editingCustomer.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(editingCustomer),
        }
      );

      if (!res.ok) throw new Error("Failed to update customer");

      toast.success("Customer updated successfully");
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      toast.error(`Failed to update customer: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer?"))
      return;

    try {
      const res = await fetch(
        `${API_URL}/customers/${customerId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) throw new Error("Failed to delete customer");

      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error: any) {
      toast.error(`Failed to delete customer: ${error.message}`);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* UI code unchanged */}
      {/* (exact same JSX as your original file) */}
      {/* truncated here for clarity */}
    </div>
  );
};

export default CustomerManagement;
