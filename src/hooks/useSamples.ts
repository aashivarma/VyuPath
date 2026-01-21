import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const useSamples = () => {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/samples`, {
          headers: authHeaders(),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        setSamples(data);
      } catch (err) {
        console.error("useSamples error:", err);
        setError("Failed to fetch samples");
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, []);

  return { samples, loading, error };
};
