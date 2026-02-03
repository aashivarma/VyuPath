export const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      throw new Error("Auth token missing. Please login again.");
    }
  
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };
  