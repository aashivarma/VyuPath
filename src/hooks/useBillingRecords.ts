import { useEffect, useState } from "react";

interface BillingRecord {
  id: string;
  sample_id: string;
  customer_id: string;
  test_type: "LBC" | "HPV" | "Co-test";
  amount: number;
  billing_date: string;
  payment_status: "pending" | "paid" | "overdue";
  created_at: string;
  updated_at: string;
  samples?: {
    id: string;
    barcode: string;
    customer_name: string;
  };
  customers?: {
    id: string;
    name: string;
    tier: "Platinum" | "Gold" | "Silver";
  };
}

export const useBillingRecords = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("http://localhost:5000/billing-records", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch billing records");
      }

      const data = await res.json();
      setBillingRecords(data);
    } catch (err: any) {
      console.error("Billing records fetch error:", err);
      setError(err.message || "Failed to load billing records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingRecords();
  }, []);

  return {
    billingRecords,
    loading,
    error,
    refetch: fetchBillingRecords,
  };
};
