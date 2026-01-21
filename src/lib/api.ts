const BASE_URL = "http://localhost:5000";

const getHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // 🔐 LOGIN
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }

    return res.json();
  },

  // 🧪 GET LABS
  getLabs: async () => {
    const res = await fetch(`${BASE_URL}/labs`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch labs");
    }

    return res.json();
  },

  // 👤 GET PATIENTS
  getPatients: async () => {
    const res = await fetch(`${BASE_URL}/patients`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch patients");
    }

    return res.json();
  },
};
