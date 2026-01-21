import { useEffect, useState } from "react";
import { PricingTier } from "@/types/user";

export const usePricingTiers = () => {
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPricingTiers = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("http://localhost:5000/pricing-tiers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch pricing tiers");
      }

      const data = await res.json();
      setPricingTiers(data);
    } catch (err: any) {
      console.error("Pricing tier fetch error:", err);
      setError(err.message || "Failed to load pricing tiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingTiers();
  }, []);

  return {
    pricingTiers,
    loading,
    error,
    refetch: fetchPricingTiers,
  };
};
