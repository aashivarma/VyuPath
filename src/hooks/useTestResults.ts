import { useEffect, useState } from "react";
import { TestResult } from "@/types/user";

export const useTestResults = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch("http://localhost:5000/test-results", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch test results");
      }

      const data = await res.json();
      setTestResults(data);
    } catch (err: any) {
      console.error("Test result fetch error:", err);
      setError(err.message || "Failed to load test results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestResults();
  }, []);

  return {
    testResults,
    loading,
    error,
    refetch: fetchTestResults,
  };
};
