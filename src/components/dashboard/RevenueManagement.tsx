import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBillingRecords } from "../../hooks/useBillingRecords";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";

const API_URL = "http://localhost:5000";

const RevenueManagement = () => {
  const { billingRecords, loading, error, refetch } = useBillingRecords();
  const { toast } = useToast();
  const [updatingPayment, setUpdatingPayment] = useState<{ [key: string]: boolean }>({});

  const handlePaymentStatusUpdate = async (
    recordId: string,
    newStatus: "paid" | "overdue"
  ) => {
    setUpdatingPayment((prev) => ({ ...prev, [recordId]: true }));

    try {
      const res = await fetch(`${API_URL}/billing-records/${recordId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ payment_status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update payment status");
      }

      toast({
        title: "Success",
        description: `Payment status updated to ${newStatus}`,
      });

      refetch();
    } catch (err) {
      console.error("Error updating payment status:", err);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setUpdatingPayment((prev) => ({ ...prev, [recordId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading revenue data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading revenue data: {error}</p>
      </div>
    );
  }

  const totalRevenue = billingRecords.reduce(
    (sum, record) => sum + Number(record.amount),
    0
  );
  const paidRevenue = billingRecords
    .filter((record) => record.payment_status === "paid")
    .reduce((sum, record) => sum + Number(record.amount), 0);
  const pendingRevenue = billingRecords
    .filter((record) => record.payment_status === "pending")
    .reduce((sum, record) => sum + Number(record.amount), 0);
  const overdueRevenue = billingRecords
    .filter((record) => record.payment_status === "overdue")
    .reduce((sum, record) => sum + Number(record.amount), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Revenue Management</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{paidRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₹{pendingRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Revenue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{overdueRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Records ({billingRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Sample</th>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Test Type</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billingRecords.map((record) => (
                  <tr key={record.id} className="border-b">
                    <td className="px-4 py-2">
                      {record.samples?.barcode || "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium">
                        {record.customers?.name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.customers?.tier || "N/A"}
                      </p>
                    </td>
                    <td className="px-4 py-2">{record.test_type}</td>
                    <td className="px-4 py-2 font-medium">
                      ₹{Number(record.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          record.payment_status === "paid"
                            ? "default"
                            : record.payment_status === "overdue"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {record.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(record.billing_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {record.payment_status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handlePaymentStatusUpdate(record.id, "paid")
                            }
                            disabled={updatingPayment[record.id]}
                          >
                            {updatingPayment[record.id] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Mark Paid"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handlePaymentStatusUpdate(record.id, "overdue")
                            }
                            disabled={updatingPayment[record.id]}
                          >
                            Mark Overdue
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {billingRecords.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No billing records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueManagement;
