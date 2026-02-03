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

  

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/customers`, {
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
      const res = await fetch(`${API_URL}/api/customers`, {
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
      const payload = {
        name: editingCustomer.name,
        email: editingCustomer.email,
        contact: editingCustomer.contact,
        tier: editingCustomer.tier,
        location: editingCustomer.location,
      };
  
      const res = await fetch(
        `${API_URL}/api/customers/${editingCustomer.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );
  
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update customer");
      }
  
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
        `${API_URL}/api/customers/${customerId}`,
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Register a new customer account with pricing tier.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Organization Name</Label>
                <Input
                  id="customerName"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number</Label>
                <Input
                  id="contact"
                  value={newCustomer.contact}
                  onChange={(e) => setNewCustomer({...newCustomer, contact: e.target.value})}
                  placeholder="+91-XXXXX-XXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">Pricing Tier</Label>
                <Select value={newCustomer.tier} onValueChange={(value: Customer['tier']) => setNewCustomer({...newCustomer, tier: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newCustomer.location}
                  onChange={(e) => setNewCustomer({...newCustomer, location: e.target.value})}
                  placeholder="Enter city/location"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateCustomer}
                disabled={creating}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>All Customers ({filteredCustomers.length})</span>
          </CardTitle>
          <CardDescription>Manage customer accounts and pricing tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Input 
              placeholder="Search customers..." 
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingCustomer?.id === customer.id ? (
                        <Input
                          value={editingCustomer.name}
                          onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                          className="w-full"
                        />
                      ) : (
                        customer.name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingCustomer?.id === customer.id ? (
                        <Input
                          value={editingCustomer.contact}
                          onChange={(e) => setEditingCustomer({...editingCustomer, contact: e.target.value})}
                          className="w-full"
                        />
                      ) : (
                        customer.contact
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingCustomer?.id === customer.id ? (
                        <Input
                          value={editingCustomer.email}
                          onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                          className="w-full"
                        />
                      ) : (
                        customer.email
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCustomer?.id === customer.id ? (
                        <Select 
                          value={editingCustomer.tier} 
                          onValueChange={(value: Customer['tier']) => setEditingCustomer({...editingCustomer, tier: value})}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Platinum">Platinum</SelectItem>
                            <SelectItem value="Gold">Gold</SelectItem>
                            <SelectItem value="Silver">Silver</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={customer.tier === 'Platinum' ? 'default' : customer.tier === 'Gold' ? 'secondary' : 'outline'}>
                          {customer.tier}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingCustomer?.id === customer.id ? (
                        <Input
                          value={editingCustomer.location}
                          onChange={(e) => setEditingCustomer({...editingCustomer, location: e.target.value})}
                          className="w-full"
                        />
                      ) : (
                        customer.location
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {editingCustomer?.id === customer.id ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleUpdateCustomer}
                            disabled={updating}
                          >
                            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingCustomer(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingCustomer(customer)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerManagement;
