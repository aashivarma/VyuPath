import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const useRecentActivity = () => {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      const res = await fetch(`${API_BASE}/api/pathologist/recent-activity`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      setActivities(data);
    };

    fetchActivity();
  }, []);

  return { activities };
};
