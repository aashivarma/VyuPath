import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const useSamples = () => {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/samples`, { headers: authHeaders() })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setSamples)
      .catch(() => setError("Failed to load samples"))
      .finally(() => setLoading(false));
  }, []);

  return { samples, loading, error };
};

export const usePatients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/patients`, { headers: authHeaders() })
      .then(res => res.json())
      .then(setPatients)
      .finally(() => setLoading(false));
  }, []);

  return { patients, loading };
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/customers`, { headers: authHeaders() })
      .then(res => res.json())
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  return { customers, loading };
};

export const useTestResults = () => {
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/test-results`, { headers: authHeaders() })
      .then(res => res.json())
      .then(setTestResults);
  }, []);

  return { testResults };
};
export const usePricingTiers = () => {
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/pricing-tiers`, {
      headers: authHeaders(),
    })
      .then(res => res.json())
      .then(setPricingTiers)
      .finally(() => setLoading(false));
  }, []);

  return { pricingTiers, loading };
};
