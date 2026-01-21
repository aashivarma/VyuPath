import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const useSamples = () => {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/samples`, {
      headers: authHeaders(),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch samples");
        return res.json();
      })
      .then(setSamples)
      .catch(() => setError("Failed to fetch samples"))
      .finally(() => setLoading(false));
  }, []);

  return { samples, loading, error };
};
