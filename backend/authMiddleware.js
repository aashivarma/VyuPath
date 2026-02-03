import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Expected format: Bearer <token>
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("❌ Token missing");
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("❌ Token missing");
    req.user = decoded; // attach user info to request
    next();
  } catch (error) {
    console.log("❌ Token error:", error.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
