import { useState } from "react";
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
import { CreditCard, Edit, Loader2 } from "lucide-react";
import {
  usePricingTiers,
  useCustomers,
} from "@/hooks/useApiData";
import { toast } from "sonner";

const API_URL = "http://localhost:5000";

const PricingTiers = () => {
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const { pricingTiers, loading: pricingLoading } = usePricingTiers();
  const { customers, loading: customersLoading } = useCustomers();

  const [editValues, setEditValues] = useState<{
    [key: string]: {
      lbc_price: number;
      hpv_price: number;
      co_test_price: number;
    };
  }>({});

  const handleEditStart = (tierName: string, tier: any) => {
    setEditingTier(tierName);
    setEditValues({
      [tierName]: {
        lbc_price: tier.lbc_price,
        hpv_price: tier.hpv_price,
        co_test_price: tier.co_test_price,
      },
    });
  };

  const handlePricingUpdate = (
    tierName: string,
    field: string,
    value: number
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [tierName]: {
        ...prev[tierName],
        [field]: value,
      },
    }));
  };

  const handleSave = async (tierName: string) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/api/pricing-tiers/${tierName}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editValues[tierName]),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update pricing tier");
      }

      toast.success(`${tierName} tier pricing updated successfully`);
      setEditingTier(null);
    } catch (error: any) {
      toast.error(`Failed to update pricing: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getCustomerCountByTier = (tier: string) => {
    return customers.filter((customer) => customer.tier === tier).length;
  };

  const getSavingsPercentage = (tierName: string) => {
    const silverTier = pricingTiers.find(
      (t) => t.tier_name === "Silver"
    );
    const currentTier = pricingTiers.find(
      (t) => t.tier_name === tierName
    );

    if (!silverTier || !currentTier) return "0%";

    const silverAvg =
      (silverTier.lbc_price +
        silverTier.hpv_price +
        silverTier.co_test_price) /
      3;
    const currentAvg =
      (currentTier.lbc_price +
        currentTier.hpv_price +
        currentTier.co_test_price) /
      3;
    const savings = Math.round(
      ((silverAvg - currentAvg) / silverAvg) * 100
    );

    return savings > 0 ? `${savings}% off` : "Standard";
  };

  if (pricingLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Pricing Tiers
        </h2>
        <Button variant="outline">Export Pricing Sheet</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pricingTiers.map((tier) => {
          const tierName = tier.tier_name;
          const isEditing = editingTier === tierName;
          const editingValues = editValues[tierName] || tier;

          return (
            <Card
              key={tier.id}
              className={`${
                tierName === "Platinum"
                  ? "border-purple-200 bg-purple-50"
                  : tierName === "Gold"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>{tierName} Tier</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      isEditing
                        ? setEditingTier(null)
                        : handleEditStart(tierName, tier)
                    }
                    disabled={updating}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  {tierName === "Platinum" &&
                    "Premium customers with highest volume"}
                  {tierName === "Gold" &&
                    "Regular customers with moderate volume"}
                  {tierName === "Silver" &&
                    "Standard pricing for new customers"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {["lbc", "hpv", "co_test"].map((key) => (
                  <div
                    key={key}
                    className="flex justify-between items-center"
                  >
                    <Label>
                      {key === "lbc"
                        ? "LBC Test"
                        : key === "hpv"
                        ? "HPV Test"
                        : "Co-test"}
                    </Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={
                          editingValues[
                            `${key}_price` as keyof typeof editingValues
                          ]
                        }
                        onChange={(e) =>
                          handlePricingUpdate(
                            tierName,
                            `${key}_price`,
                            Number(e.target.value)
                          )
                        }
                        className="w-24 text-right"
                        disabled={updating}
                      />
                    ) : (
                      <span className="font-medium">
                        ₹{tier[`${key}_price`]}
                      </span>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSave(tierName)}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTier(null)}
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Savings vs Silver
                    </span>
                    <Badge>{getSavingsPercentage(tierName)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PricingTiers;
